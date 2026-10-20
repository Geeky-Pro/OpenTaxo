-- Enforce exactly one active base unit whenever a dimension has active units.
-- Deferred validation permits transactional create/rebase workflows while rejecting a
-- restored non-base unit when its dimension has no active base.

create or replace function public.assert_measurement_dimension_base_invariant()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_dimension_id uuid;
  v_active_count integer;
  v_base_count integer;
  v_old_dimension_id uuid;
begin
  if tg_op = 'DELETE' then
    v_dimension_id := old.dimension_id;
  else
    v_dimension_id := new.dimension_id;
  end if;

  select count(*)::integer,
         count(*) filter (where is_base)::integer
    into v_active_count, v_base_count
    from public.measurement_units
   where dimension_id = v_dimension_id and status = 'active';

  if v_active_count > 0 and v_base_count <> 1 then
    raise exception 'A dimension with active units must have exactly one active base unit'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and old.dimension_id is distinct from new.dimension_id then
    v_old_dimension_id := old.dimension_id;
    select count(*)::integer,
           count(*) filter (where is_base)::integer
      into v_active_count, v_base_count
      from public.measurement_units
     where dimension_id = v_old_dimension_id and status = 'active';
    if v_active_count > 0 and v_base_count <> 1 then
      raise exception 'The previous dimension must retain exactly one active base unit'
        using errcode = '23514';
    end if;
  end if;

  return null;
end;
$function$;

revoke all on function public.assert_measurement_dimension_base_invariant() from public, anon, authenticated;

drop trigger if exists measurement_units_base_invariant on public.measurement_units;
create constraint trigger measurement_units_base_invariant
after insert or update or delete on public.measurement_units
deferrable initially deferred
for each row execute function public.assert_measurement_dimension_base_invariant();
