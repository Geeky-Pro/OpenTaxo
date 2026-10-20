-- Unit 26–27 follow-up: transactional base-unit management and conversion consistency.
-- A new base unit rebases all active units in the same dimension in one transaction.

create unique index if not exists unit_conversion_rules_active_physical_pair_uq
  on public.unit_conversion_rules(source_unit_id, target_unit_id)
  where status = 'active' and selling_unit_definition_id is null;

create unique index if not exists unit_conversion_rules_active_selling_pair_uq
  on public.unit_conversion_rules(source_unit_id, target_unit_id, selling_unit_definition_id)
  where status = 'active' and selling_unit_definition_id is not null;

create or replace function public.save_measurement_unit(
  p_id uuid,
  p_dimension_id uuid,
  p_key text,
  p_name_ar text,
  p_name_en text,
  p_symbol text,
  p_to_base_multiplier numeric,
  p_to_base_offset numeric,
  p_make_base boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_id uuid;
  v_current public.measurement_units%rowtype;
  v_has_active_base boolean;
  v_make_base boolean;
  v_target_multiplier numeric;
  v_target_offset numeric;
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_authorized_users a
    where a.user_id = auth.uid() and a.is_active
  ) then
    raise exception 'Only an authorized owner can manage measurement units'
      using errcode = '42501';
  end if;

  if p_key is null or p_key !~ '^[a-z][a-z0-9_]{1,62}$' then
    raise exception 'Unit key must use lowercase snake_case'
      using errcode = '22023';
  end if;
  if p_name_ar is null or char_length(btrim(p_name_ar)) not between 1 and 120 then
    raise exception 'Arabic unit name is required and must not exceed 120 characters'
      using errcode = '22023';
  end if;
  if p_name_en is not null and char_length(btrim(p_name_en)) > 120 then
    raise exception 'English unit name must not exceed 120 characters'
      using errcode = '22023';
  end if;
  if p_symbol is not null and char_length(btrim(p_symbol)) > 40 then
    raise exception 'Unit symbol must not exceed 40 characters'
      using errcode = '22023';
  end if;
  if p_to_base_multiplier is null or p_to_base_multiplier <= 0 then
    raise exception 'Unit conversion multiplier must be greater than zero'
      using errcode = '22023';
  end if;
  if p_to_base_offset is null then
    raise exception 'Unit conversion offset is required'
      using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.measurement_dimensions d
    where d.id = p_dimension_id and d.status = 'active'
  ) then
    raise exception 'The selected measurement dimension is missing or inactive'
      using errcode = '23503';
  end if;

  if p_id is not null then
    select * into v_current
      from public.measurement_units u
     where u.id = p_id and u.status = 'active'
     for update;
    if not found then
      raise exception 'Active measurement unit was not found'
        using errcode = 'P0002';
    end if;
    if v_current.dimension_id <> p_dimension_id then
      raise exception 'A unit cannot be moved to another dimension; create a new unit instead'
        using errcode = '23514';
    end if;
    if v_current.is_base and not coalesce(p_make_base, false) then
      raise exception 'Choose another base unit before editing this unit as a non-base unit'
        using errcode = '23514';
    end if;
  end if;

  select exists (
    select 1 from public.measurement_units u
    where u.dimension_id = p_dimension_id and u.status = 'active' and u.is_base
      and (p_id is null or u.id <> p_id)
  ) into v_has_active_base;

  v_make_base := coalesce(p_make_base, false) or not v_has_active_base;

  if p_id is null then
    insert into public.measurement_units (
      dimension_id, key, name_ar, name_en, symbol,
      to_base_multiplier, to_base_offset, is_base, status
    ) values (
      p_dimension_id, lower(btrim(p_key)), btrim(p_name_ar), nullif(btrim(p_name_en), ''),
      nullif(btrim(p_symbol), ''), p_to_base_multiplier, p_to_base_offset, false, 'active'
    )
    returning id into v_id;
  else
    update public.measurement_units
       set key = lower(btrim(p_key)),
           name_ar = btrim(p_name_ar),
           name_en = nullif(btrim(p_name_en), ''),
           symbol = nullif(btrim(p_symbol), ''),
           to_base_multiplier = case when v_current.is_base then 1 else p_to_base_multiplier end,
           to_base_offset = case when v_current.is_base then 0 else p_to_base_offset end,
           is_base = false,
           updated_at = now()
     where id = p_id
    returning id into v_id;
  end if;

  if v_make_base then
    select to_base_multiplier, to_base_offset
      into v_target_multiplier, v_target_offset
      from public.measurement_units
     where id = v_id and status = 'active'
     for update;

    if not v_has_active_base then
      -- There is no current coordinate system; the first active unit defines it.
      v_target_multiplier := 1;
      v_target_offset := 0;
      update public.measurement_units
         set to_base_multiplier = 1, to_base_offset = 0
       where id = v_id;
    end if;

    update public.measurement_units
       set is_base = false
     where dimension_id = p_dimension_id and status = 'active' and is_base;

    update public.measurement_units
       set to_base_multiplier = to_base_multiplier / v_target_multiplier,
           to_base_offset = (to_base_offset - v_target_offset) / v_target_multiplier,
           is_base = (id = v_id),
           updated_at = now()
     where dimension_id = p_dimension_id and status = 'active';

    -- The selected base must resolve exactly to 1 × value + 0.
    update public.measurement_units
       set to_base_multiplier = 1, to_base_offset = 0, is_base = true, updated_at = now()
     where id = v_id;
  end if;

  return v_id;
end;
$function$;

create or replace function public.validate_measurement_unit()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.is_base and (new.to_base_multiplier <> 1 or new.to_base_offset <> 0) then
    raise exception 'A base unit must use multiplier 1 and offset 0'
      using errcode = '23514';
  end if;

  if new.status = 'active' and not exists (
    select 1 from public.measurement_dimensions d
    where d.id = new.dimension_id and d.status = 'active'
  ) then
    raise exception 'A measurement unit must belong to an active dimension'
      using errcode = '23503';
  end if;

  if tg_op = 'UPDATE' and old.status = 'active' and new.status = 'archived' then
    if exists (
      select 1 from public.product_type_attributes pta
      join public.product_type_schemas pts on pts.id = pta.product_type_schema_id
      where pts.status = 'active' and pta.configuration->>'unit_id' = old.id::text
    ) then
      raise exception 'Remove this unit from active Product Types before archiving it'
        using errcode = '23503';
    end if;

    if exists (
      select 1 from public.unit_conversion_rules r
      where r.status = 'active' and (r.source_unit_id = old.id or r.target_unit_id = old.id)
    ) then
      raise exception 'Archive conversion rules that use this unit before archiving it'
        using errcode = '23503';
    end if;

    if old.is_base and exists (
      select 1 from public.measurement_units u
      where u.dimension_id = old.dimension_id and u.status = 'active' and u.id <> old.id
    ) then
      raise exception 'Choose another base unit before archiving this base unit'
        using errcode = '23503';
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.validate_unit_conversion_rule()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_source_dimension uuid;
  v_target_dimension uuid;
  v_selling_dimension uuid;
  v_source_multiplier numeric;
  v_source_offset numeric;
  v_target_multiplier numeric;
  v_target_offset numeric;
  v_expected_multiplier numeric;
  v_expected_offset numeric;
begin
  select u.dimension_id, u.to_base_multiplier, u.to_base_offset
    into v_source_dimension, v_source_multiplier, v_source_offset
    from public.measurement_units u
   where u.id = new.source_unit_id and u.status = 'active';

  select u.dimension_id, u.to_base_multiplier, u.to_base_offset
    into v_target_dimension, v_target_multiplier, v_target_offset
    from public.measurement_units u
   where u.id = new.target_unit_id and u.status = 'active';

  if v_source_dimension is null or v_target_dimension is null then
    raise exception 'Conversion rules require active source and target units'
      using errcode = '23503';
  end if;

  if v_source_dimension <> v_target_dimension then
    raise exception 'Conversion is only allowed between units of the same physical dimension'
      using errcode = '23514';
  end if;

  if new.multiplier <= 0 then
    raise exception 'Conversion multiplier must be greater than zero'
      using errcode = '23514';
  end if;

  if new.selling_unit_definition_id is null then
    v_expected_multiplier := v_source_multiplier / v_target_multiplier;
    v_expected_offset := (v_source_offset - v_target_offset) / v_target_multiplier;
    if abs(new.multiplier - v_expected_multiplier) > 0.000000000001
       or abs(new.offset_value - v_expected_offset) > 0.000000000001 then
      raise exception 'Physical conversion rule must match the source and target unit factors'
        using errcode = '23514';
    end if;
  else
    select s.measurement_dimension_id into v_selling_dimension
      from public.selling_unit_definitions s
     where s.id = new.selling_unit_definition_id and s.status = 'active';

    if not found then
      raise exception 'The linked selling unit definition is inactive or missing'
        using errcode = '23503';
    end if;

    if v_selling_dimension is not null and v_selling_dimension <> v_source_dimension then
      raise exception 'Selling unit and measurement conversion dimensions must match'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function public.save_measurement_unit(uuid, uuid, text, text, text, text, numeric, numeric, boolean) from public, anon;
grant execute on function public.save_measurement_unit(uuid, uuid, text, text, text, text, numeric, numeric, boolean) to authenticated;
