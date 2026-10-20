-- Unit 25–27: integrity rules for central values, physical units and conversions.
-- Additive migration: existing records are preserved; no seed or reset is performed.

alter table public.attribute_value_sets
  add column if not exists sort_order integer not null default 0;
alter table public.attribute_values
  add column if not exists sort_order integer not null default 0;

alter table public.attribute_value_sets
  add constraint attribute_value_sets_sort_order_check check (sort_order >= 0);
alter table public.attribute_values
  add constraint attribute_values_sort_order_check check (sort_order >= 0);

create unique index if not exists attribute_value_sets_active_attribute_uq
  on public.attribute_value_sets(attribute_id)
  where attribute_id is not null and status = 'active';

create unique index if not exists attribute_values_active_key_ci_uq
  on public.attribute_values(value_set_id, lower(btrim(value_key)))
  where status = 'active';

alter table public.measurement_units
  add constraint measurement_units_base_factor_check
  check (not is_base or (to_base_multiplier = 1 and to_base_offset = 0));

create or replace function public.validate_attribute_value_set()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.attribute_id is not null and new.status = 'active' then
    if not exists (
      select 1 from public.attributes a
      where a.id = new.attribute_id and a.status = 'active' and a.data_type = 'enum'
    ) then
      raise exception 'An active value set can only be linked to an active enum attribute'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.status = 'active' and new.status = 'archived'
     and exists (
       select 1 from public.product_type_attributes pta
       join public.product_type_schemas pts on pts.id = pta.product_type_schema_id
       where pts.status = 'active'
         and pta.configuration->>'value_set_id' = old.id::text
     ) then
    raise exception 'Remove this value set from active Product Types before archiving it'
      using errcode = '23503';
  end if;

  return new;
end;
$function$;

drop trigger if exists attribute_value_sets_integrity on public.attribute_value_sets;
create trigger attribute_value_sets_integrity
before insert or update on public.attribute_value_sets
for each row execute function public.validate_attribute_value_set();

create or replace function public.validate_attribute_value()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_set_status text;
begin
  select s.status into v_set_status
    from public.attribute_value_sets s
   where s.id = new.value_set_id;

  if v_set_status is distinct from 'active' and new.status = 'active' then
    raise exception 'An active value must belong to an active value set'
      using errcode = '23503';
  end if;

  return new;
end;
$function$;

drop trigger if exists attribute_values_integrity on public.attribute_values;
create trigger attribute_values_integrity
before insert or update on public.attribute_values
for each row execute function public.validate_attribute_value();

create or replace function public.validate_measurement_dimension_archive()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if old.status = 'active' and new.status = 'archived' then
    if exists (select 1 from public.measurement_units u where u.dimension_id = old.id and u.status = 'active')
       or exists (select 1 from public.attributes a where a.measurement_dimension_id = old.id and a.status = 'active')
       or exists (select 1 from public.selling_unit_definitions s where s.measurement_dimension_id = old.id and s.status = 'active') then
      raise exception 'Archive or detach active units, attributes and selling units before archiving this dimension'
        using errcode = '23503';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists measurement_dimensions_archive_guard on public.measurement_dimensions;
create trigger measurement_dimensions_archive_guard
before update of status on public.measurement_dimensions
for each row execute function public.validate_measurement_dimension_archive();

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

  if tg_op = 'UPDATE' and old.status = 'active' and new.status = 'archived'
     and exists (
       select 1 from public.product_type_attributes pta
       join public.product_type_schemas pts on pts.id = pta.product_type_schema_id
       where pts.status = 'active'
         and pta.configuration->>'unit_id' = old.id::text
     ) then
    raise exception 'Remove this unit from active Product Types before archiving it'
      using errcode = '23503';
  end if;

  return new;
end;
$function$;

drop trigger if exists measurement_units_integrity on public.measurement_units;
create trigger measurement_units_integrity
before insert or update on public.measurement_units
for each row execute function public.validate_measurement_unit();

create or replace function public.validate_unit_conversion_rule()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_source_dimension uuid;
  v_target_dimension uuid;
  v_selling_dimension uuid;
begin
  select u.dimension_id into v_source_dimension
    from public.measurement_units u
   where u.id = new.source_unit_id and u.status = 'active';

  select u.dimension_id into v_target_dimension
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

  if new.selling_unit_definition_id is not null then
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

drop trigger if exists unit_conversion_rules_integrity on public.unit_conversion_rules;
create trigger unit_conversion_rules_integrity
before insert or update on public.unit_conversion_rules
for each row execute function public.validate_unit_conversion_rule();

create or replace function public.convert_measurement_value(
  p_value numeric,
  p_source_unit_id uuid,
  p_target_unit_id uuid
)
returns numeric
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_source public.measurement_units%rowtype;
  v_target public.measurement_units%rowtype;
begin
  if p_value is null then
    raise exception 'Value to convert is required' using errcode = '22023';
  end if;

  select * into v_source from public.measurement_units
   where id = p_source_unit_id and status = 'active';
  if not found then
    raise exception 'Source unit is missing or inactive' using errcode = '23503';
  end if;

  select * into v_target from public.measurement_units
   where id = p_target_unit_id and status = 'active';
  if not found then
    raise exception 'Target unit is missing or inactive' using errcode = '23503';
  end if;

  if v_source.dimension_id <> v_target.dimension_id then
    raise exception 'Cannot convert between different physical dimensions' using errcode = '23514';
  end if;

  return ((p_value * v_source.to_base_multiplier + v_source.to_base_offset)
          - v_target.to_base_offset) / v_target.to_base_multiplier;
end;
$function$;

revoke all on function public.validate_attribute_value_set() from public, anon, authenticated;
revoke all on function public.validate_attribute_value() from public, anon, authenticated;
revoke all on function public.validate_measurement_dimension_archive() from public, anon, authenticated;
revoke all on function public.validate_measurement_unit() from public, anon, authenticated;
revoke all on function public.validate_unit_conversion_rule() from public, anon, authenticated;
revoke all on function public.convert_measurement_value(numeric, uuid, uuid) from public, anon;
grant execute on function public.convert_measurement_value(numeric, uuid, uuid) to authenticated;
