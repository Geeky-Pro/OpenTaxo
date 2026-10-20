-- Unit 24: central attribute definitions and compatibility enforcement.
-- This migration is additive. Existing legacy definitions are not bulk-rewritten.

create or replace function public.attribute_filter_compatible(
  p_data_type text,
  p_filter_type text
)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select coalesce(
    case p_data_type
      when 'string' then p_filter_type = any (array['select', 'checkbox', 'button_group']::text[])
      when 'number' then p_filter_type = any (array['range']::text[])
      when 'boolean' then p_filter_type = any (array['toggle', 'checkbox']::text[])
      when 'enum' then p_filter_type = any (array['select', 'checkbox', 'button_group', 'color_swatch']::text[])
      else false
    end,
    false
  );
$function$;

create unique index if not exists attributes_key_case_insensitive_uq
  on public.attributes (lower(key));

create unique index if not exists attribute_aliases_unique_per_attribute_language_uq
  on public.attribute_aliases (attribute_id, lower(btrim(alias_text)), coalesce(language_code, ''));

create or replace function public.enforce_attribute_definition_compatibility()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  -- Allow untouched legacy rows to remain readable. Enforce the rule on inserts
  -- and whenever a definition's type, filter, or dimension is changed.
  if tg_op = 'INSERT'
     or new.data_type is distinct from old.data_type
     or new.filter_type is distinct from old.filter_type
     or new.measurement_dimension_id is distinct from old.measurement_dimension_id then
    if not public.attribute_filter_compatible(new.data_type, new.filter_type) then
      raise exception 'Filter type % is not compatible with data type %', new.filter_type, new.data_type
        using errcode = '23514';
    end if;

    if new.measurement_dimension_id is not null and new.data_type <> 'number' then
      raise exception 'Physical dimensions can only be assigned to numeric attributes'
        using errcode = '23514';
    end if;

    if new.measurement_dimension_id is not null and not exists (
      select 1 from public.measurement_dimensions d
      where d.id = new.measurement_dimension_id and d.status = 'active'
    ) then
      raise exception 'The selected measurement dimension does not exist or is archived'
        using errcode = '23503';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists attributes_definition_compatibility on public.attributes;
create trigger attributes_definition_compatibility
before insert or update
on public.attributes
for each row execute function public.enforce_attribute_definition_compatibility();

create or replace function public.save_attribute_definition(
  p_id uuid,
  p_key text,
  p_name_ar text,
  p_name_en text,
  p_data_type text,
  p_filter_type text,
  p_measurement_dimension_id uuid,
  p_sort_order integer,
  p_aliases jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_id uuid;
  v_aliases jsonb := coalesce(p_aliases, '[]'::jsonb);
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_authorized_users u
    where u.user_id = auth.uid() and u.is_active
  ) then
    raise exception 'Only an authorized owner can manage attribute definitions'
      using errcode = '42501';
  end if;

  if p_key is null or p_key !~ '^[a-z][a-z0-9_]{1,62}$' then
    raise exception 'Attribute key must be lowercase snake_case and start with a letter'
      using errcode = '22023';
  end if;

  if p_name_ar is null or length(btrim(p_name_ar)) = 0 or char_length(btrim(p_name_ar)) > 120 then
    raise exception 'Arabic attribute name is required and must not exceed 120 characters' using errcode = '22023';
  end if;

  if p_name_en is not null and char_length(btrim(p_name_en)) > 120 then
    raise exception 'English attribute name must not exceed 120 characters' using errcode = '22023';
  end if;

  if p_sort_order is not null and (p_sort_order < 0 or p_sort_order > 100000) then
    raise exception 'Sort order must be between 0 and 100000' using errcode = '22023';
  end if;

  if not public.attribute_filter_compatible(p_data_type, p_filter_type) then
    raise exception 'Filter type % is not compatible with data type %', p_filter_type, p_data_type
      using errcode = '23514';
  end if;

  if p_measurement_dimension_id is not null and p_data_type <> 'number' then
    raise exception 'Physical dimensions can only be assigned to numeric attributes'
      using errcode = '23514';
  end if;

  if p_measurement_dimension_id is not null and not exists (
    select 1 from public.measurement_dimensions d
    where d.id = p_measurement_dimension_id and d.status = 'active'
  ) then
    raise exception 'The selected measurement dimension does not exist or is archived'
      using errcode = '23503';
  end if;

  if jsonb_typeof(v_aliases) <> 'array' then
    raise exception 'Aliases must be a JSON array' using errcode = '22023';
  end if;

  if jsonb_array_length(v_aliases) > 100 then
    raise exception 'An attribute can have at most 100 aliases' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_aliases) as x(alias_text text, language_code text)
    where nullif(btrim(x.alias_text), '') is null
       or char_length(btrim(x.alias_text)) > 200
       or (x.language_code is not null and x.language_code not in ('ar', 'en'))
  ) then
    raise exception 'Each alias must have text up to 200 characters and language ar or en'
      using errcode = '22023';
  end if;

  if exists (
    select lower(btrim(x.alias_text)), coalesce(x.language_code, '')
    from jsonb_to_recordset(v_aliases) as x(alias_text text, language_code text)
    group by lower(btrim(x.alias_text)), coalesce(x.language_code, '')
    having count(*) > 1
  ) then
    raise exception 'Duplicate aliases are not allowed for the same language'
      using errcode = '23505';
  end if;

  if p_id is null then
    insert into public.attributes (
      key, name_ar, name_en, data_type, filter_type,
      measurement_dimension_id, sort_order, status, created_by, updated_by
    )
    values (
      lower(btrim(p_key)), btrim(p_name_ar), nullif(btrim(p_name_en), ''),
      p_data_type, p_filter_type, p_measurement_dimension_id,
      greatest(coalesce(p_sort_order, 0), 0), 'active', auth.uid(), auth.uid()
    )
    returning id into v_id;
  else
    if exists (
      select 1 from public.attributes a
      where a.id = p_id and a.status = 'active'
        and (a.data_type is distinct from p_data_type
             or a.measurement_dimension_id is distinct from p_measurement_dimension_id)
    ) and exists (
      select 1
      from public.product_type_attributes pta
      join public.product_type_schemas pts on pts.id = pta.product_type_schema_id
      where pta.attribute_id = p_id and pts.status = 'active'
    ) then
      raise exception 'Remove this attribute from active Product Types before changing its data type or physical dimension'
        using errcode = '23514';
    end if;

    if exists (
      select 1 from public.attributes a
      where a.id = p_id and a.status = 'active'
        and a.data_type is distinct from p_data_type
    ) and exists (
      select 1 from public.attribute_value_sets s
      where s.attribute_id = p_id and s.status = 'active'
    ) then
      raise exception 'Archive or detach attribute-specific value sets before changing this data type'
        using errcode = '23514';
    end if;

    update public.attributes
       set key = lower(btrim(p_key)),
           name_ar = btrim(p_name_ar),
           name_en = nullif(btrim(p_name_en), ''),
           data_type = p_data_type,
           filter_type = p_filter_type,
           measurement_dimension_id = p_measurement_dimension_id,
           sort_order = greatest(coalesce(p_sort_order, 0), 0),
           updated_by = auth.uid(),
           updated_at = now()
     where id = p_id and status = 'active'
    returning id into v_id;

    if v_id is null then
      raise exception 'Active attribute definition % was not found', p_id
        using errcode = 'P0002';
    end if;
  end if;

  delete from public.attribute_aliases where attribute_id = v_id;

  insert into public.attribute_aliases (attribute_id, alias_text, language_code, created_by)
  select v_id, btrim(x.alias_text), x.language_code, auth.uid()
  from jsonb_to_recordset(v_aliases) as x(alias_text text, language_code text);

  return v_id;
end;
$function$;

create or replace function public.archive_attribute_definition(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_authorized_users u
    where u.user_id = auth.uid() and u.is_active
  ) then
    raise exception 'Only an authorized owner can archive attribute definitions'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.attributes a where a.id = p_id and a.status = 'active'
  ) then
    raise exception 'Active attribute definition % was not found', p_id
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.product_type_attributes pta
    join public.product_type_schemas pts on pts.id = pta.product_type_schema_id
    where pta.attribute_id = p_id and pts.status = 'active'
  ) then
    raise exception 'Remove this attribute from active Product Types before archiving it'
      using errcode = '23503';
  end if;

  if exists (
    select 1 from public.attribute_value_sets s
    where s.attribute_id = p_id and s.status = 'active'
  ) then
    raise exception 'Detach or archive attribute-specific value sets before archiving this attribute'
      using errcode = '23503';
  end if;

  update public.attributes
     set status = 'archived',
         archived_at = coalesce(archived_at, now()),
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_id and status = 'active';
end;
$function$;

revoke all on function public.attribute_filter_compatible(text, text) from public, anon;
revoke all on function public.enforce_attribute_definition_compatibility() from public, anon;
revoke all on function public.save_attribute_definition(uuid, text, text, text, text, text, uuid, integer, jsonb) from public, anon;
revoke all on function public.archive_attribute_definition(uuid) from public, anon;

grant execute on function public.attribute_filter_compatible(text, text) to authenticated;
grant execute on function public.save_attribute_definition(uuid, text, text, text, text, text, uuid, integer, jsonb) to authenticated;
grant execute on function public.archive_attribute_definition(uuid) to authenticated;
