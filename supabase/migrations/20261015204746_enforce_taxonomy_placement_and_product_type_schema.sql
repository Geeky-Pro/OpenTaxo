create or replace function public.enforce_taxonomy_node_placement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_node_type text;
  v_parent_id uuid;
  v_status text;
  v_parent_type text;
  v_parent_status text;
begin
  if tg_op = 'UPDATE'
     and old.parent_id is not distinct from new.parent_id
     and old.node_type is not distinct from new.node_type
     and old.status is not distinct from new.status then
    return new;
  end if;

  select n.parent_id, n.node_type, n.status
    into v_parent_id, v_node_type, v_status
    from public.taxonomy_nodes n
   where n.id = new.id;

  if not found or v_status <> 'active' then
    return new;
  end if;

  if v_parent_id is null then
    if v_node_type <> 'department' then
      raise exception using errcode = '23514',
        message = 'Root taxonomy nodes must have node_type department';
    end if;
  else
    select p.node_type, p.status
      into v_parent_type, v_parent_status
      from public.taxonomy_nodes p
     where p.id = v_parent_id;

    if not found or v_parent_status <> 'active' then
      raise exception using errcode = '23503',
        message = 'Taxonomy parent must exist and be active';
    end if;

    if not (
      (v_parent_type = 'department' and v_node_type = 'category')
      or (v_parent_type = 'category' and v_node_type in ('subcategory', 'product_type'))
      or (v_parent_type = 'subcategory' and v_node_type = 'product_type')
    ) then
      raise exception using errcode = '23514',
        message = format('Invalid taxonomy hierarchy: %s cannot be a child of %s', v_node_type, v_parent_type);
    end if;
  end if;

  if v_node_type <> 'product_type' and exists (
    select 1 from public.product_type_schemas s
     where s.taxonomy_node_id = new.id and s.status = 'active'
  ) then
    raise exception using errcode = '23514',
      message = 'Only product_type taxonomy nodes may have an active Product Type schema';
  end if;

  if tg_op = 'UPDATE' and old.node_type is distinct from new.node_type then
    if exists (
      select 1
        from public.taxonomy_nodes child
       where child.parent_id = new.id
         and child.status = 'active'
         and not (
           (v_node_type = 'department' and child.node_type = 'category')
           or (v_node_type = 'category' and child.node_type in ('subcategory', 'product_type'))
           or (v_node_type = 'subcategory' and child.node_type = 'product_type')
         )
    ) then
      raise exception using errcode = '23514',
        message = 'Changing this node type would invalidate one or more child nodes';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists taxonomy_nodes_placement_check on public.taxonomy_nodes;
create constraint trigger taxonomy_nodes_placement_check
after insert or update of parent_id, node_type, status
on public.taxonomy_nodes
deferrable initially deferred
for each row
execute function public.enforce_taxonomy_node_placement();

create or replace function public.enforce_product_type_schema_node()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_taxonomy_node_id uuid;
  v_schema_status text;
  v_node_type text;
  v_node_status text;
begin
  if tg_op = 'UPDATE'
     and old.taxonomy_node_id is not distinct from new.taxonomy_node_id
     and old.status is not distinct from new.status then
    return new;
  end if;

  select s.taxonomy_node_id, s.status
    into v_taxonomy_node_id, v_schema_status
    from public.product_type_schemas s
   where s.id = new.id;

  if not found or v_schema_status <> 'active' then
    return new;
  end if;

  select n.node_type, n.status
    into v_node_type, v_node_status
    from public.taxonomy_nodes n
   where n.id = v_taxonomy_node_id;

  if not found or v_node_status <> 'active' or v_node_type <> 'product_type' then
    raise exception using errcode = '23514',
      message = 'An active Product Type schema must reference an active product_type taxonomy node';
  end if;

  return new;
end;
$function$;

drop trigger if exists product_type_schema_node_check on public.product_type_schemas;
create constraint trigger product_type_schema_node_check
after insert or update of taxonomy_node_id, status
on public.product_type_schemas
deferrable initially deferred
for each row
execute function public.enforce_product_type_schema_node();
