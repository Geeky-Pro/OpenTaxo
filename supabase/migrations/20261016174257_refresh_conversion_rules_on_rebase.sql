-- Keep saved physical conversion rules synchronized if a dimension's base unit changes.
-- Deferred execution sees the final, fully rebased set of units at transaction commit.

create or replace function public.refresh_physical_conversion_rules()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.to_base_multiplier is distinct from old.to_base_multiplier
     or new.to_base_offset is distinct from old.to_base_offset then
    update public.unit_conversion_rules r
       set multiplier = source_unit.to_base_multiplier / target_unit.to_base_multiplier,
           offset_value = (source_unit.to_base_offset - target_unit.to_base_offset) / target_unit.to_base_multiplier,
           updated_at = now()
      from public.measurement_units source_unit,
           public.measurement_units target_unit
     where r.status = 'active'
       and r.selling_unit_definition_id is null
       and source_unit.id = r.source_unit_id
       and target_unit.id = r.target_unit_id
       and source_unit.dimension_id = new.dimension_id
       and target_unit.dimension_id = new.dimension_id
       and source_unit.status = 'active'
       and target_unit.status = 'active';
  end if;
  return null;
end;
$function$;

revoke all on function public.refresh_physical_conversion_rules() from public, anon, authenticated;

drop trigger if exists measurement_units_refresh_conversion_rules on public.measurement_units;
create constraint trigger measurement_units_refresh_conversion_rules
after update on public.measurement_units
deferrable initially deferred
for each row execute function public.refresh_physical_conversion_rules();
