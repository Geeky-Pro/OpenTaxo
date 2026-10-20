-- Preserve conversion factors for archived units when the active base unit changes.
-- If no active base remains, restore the previous units first so their factor coordinate is known.
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

  if not v_has_active_base
     and not coalesce(v_current.is_base, false)
     and exists (
       select 1 from public.measurement_units u
       where u.dimension_id = p_dimension_id
         and u.id is distinct from p_id
         and u.status in ('active', 'archived')
     ) then
    raise exception 'Restore existing units and their base before establishing a new base; their factors depend on the previous base'
      using errcode = '23514';
  end if;

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
     where dimension_id = p_dimension_id and is_base;

    -- Rebase archived units too, so restoring them later preserves their conversion semantics.
    update public.measurement_units
       set to_base_multiplier = to_base_multiplier / v_target_multiplier,
           to_base_offset = (to_base_offset - v_target_offset) / v_target_multiplier,
           is_base = (id = v_id and status = 'active'),
           updated_at = now()
     where dimension_id = p_dimension_id;

    -- The selected base must resolve exactly to 1 × value + 0.
    update public.measurement_units
       set to_base_multiplier = 1, to_base_offset = 0, is_base = true, updated_at = now()
     where id = v_id;
  end if;

  return v_id;
end;
$function$;

