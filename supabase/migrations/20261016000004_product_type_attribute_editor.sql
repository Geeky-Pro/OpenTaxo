-- Unit 22: typed Product Type attribute editor.
-- All writes are scoped to one active Product Type schema and use caller privileges.
create or replace function public.replace_product_type_attribute_assignments(
  p_taxonomy_node_id uuid,
  p_bindings jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_schema_id uuid;
  v_binding jsonb;
  v_order integer;
  v_attribute_id uuid;
  v_data_type text;
  v_dimension_id uuid;
  v_unit_id uuid;
  v_value_set_id uuid;
  v_min numeric;
  v_max numeric;
  v_binding_id uuid;
  v_role text;
  v_group text;
  v_is_required boolean;
  v_is_filterable boolean;
  v_is_variant boolean;
begin
  if p_bindings is null or jsonb_typeof(p_bindings) <> 'array' then
    raise exception 'Product Type bindings must be a JSON array';
  end if;

  if (select count(*) from jsonb_array_elements(p_bindings))
     <> (select count(distinct value->>'attribute_id') from jsonb_array_elements(p_bindings)) then
    raise exception 'Duplicate Product Type attribute assignments are not allowed';
  end if;

  select s.id into v_schema_id
    from public.taxonomy_nodes n
    join public.product_type_schemas s on s.taxonomy_node_id = n.id
   where n.id = p_taxonomy_node_id
     and n.node_type = 'product_type'
     and n.status = 'active'
     and s.status = 'active';

  if v_schema_id is null then
    raise exception 'An active Product Type schema is required';
  end if;

  for v_binding, v_order in
    select e.value, e.ordinality::integer
      from jsonb_array_elements(p_bindings) with ordinality as e(value, ordinality)
  loop
    if nullif(btrim(v_binding->>'attribute_id'), '') is null then
      raise exception 'Every Product Type binding must identify an attribute';
    end if;

    select a.id, a.data_type, a.measurement_dimension_id
      into v_attribute_id, v_data_type, v_dimension_id
      from public.attributes a
     where (a.legacy_id = v_binding->>'attribute_id' or a.id::text = v_binding->>'attribute_id')
       and a.status = 'active';

    if v_attribute_id is null then
      raise exception 'Attribute % does not exist or is archived', v_binding->>'attribute_id';
    end if;

    if coalesce(jsonb_typeof(v_binding->'min_value'), 'null') not in ('number','null')
       or coalesce(jsonb_typeof(v_binding->'max_value'), 'null') not in ('number','null') then
      raise exception 'Numeric bounds must be numbers';
    end if;

    v_min := case when jsonb_typeof(v_binding->'min_value') = 'number'
                  then (v_binding->>'min_value')::numeric else null end;
    v_max := case when jsonb_typeof(v_binding->'max_value') = 'number'
                  then (v_binding->>'max_value')::numeric else null end;

    if (v_min is not null or v_max is not null) and v_data_type <> 'number' then
      raise exception 'Numeric bounds are only valid for number attributes';
    end if;
    if v_min is not null and v_max is not null and v_min > v_max then
      raise exception 'Minimum value cannot exceed maximum value';
    end if;

    v_unit_id := null;
    if nullif(v_binding->>'unit_id', '') is not null then
      if v_data_type <> 'number' or v_dimension_id is null then
        raise exception 'A measurement unit requires a numeric attribute with a measurement dimension';
      end if;
      if (v_binding->>'unit_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Invalid measurement unit identifier';
      end if;
      v_unit_id := (v_binding->>'unit_id')::uuid;
      perform 1 from public.measurement_units u
       where u.id = v_unit_id
         and u.dimension_id = v_dimension_id
         and u.status = 'active';
      if not found then
        raise exception 'Measurement unit does not match the attribute measurement dimension';
      end if;
    end if;

    v_value_set_id := null;
    if nullif(v_binding->>'value_set_id', '') is not null then
      if v_data_type <> 'enum' then
        raise exception 'Value sets are only valid for enum attributes';
      end if;
      if (v_binding->>'value_set_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Invalid value set identifier';
      end if;
      v_value_set_id := (v_binding->>'value_set_id')::uuid;
      perform 1 from public.attribute_value_sets vs
       where vs.id = v_value_set_id
         and vs.status = 'active'
         and (vs.attribute_id is null or vs.attribute_id = v_attribute_id);
      if not found then
        raise exception 'Value set is inactive or assigned to a different attribute';
      end if;
    end if;

    if v_binding ? 'allowed_values' and jsonb_typeof(v_binding->'allowed_values') <> 'array' then
      raise exception 'Allowed values must be an array';
    end if;

    v_role := coalesce(nullif(v_binding->>'role', ''), 'descriptive');
    if v_role not in ('identity','variant','descriptive','commercial') then
      raise exception 'Invalid Product Type attribute role';
    end if;
    v_group := nullif(btrim(v_binding->>'group'), '');
    v_is_required := coalesce((v_binding->>'is_required')::boolean, false);
    v_is_filterable := coalesce((v_binding->>'is_filterable')::boolean, false);
    v_is_variant := coalesce((v_binding->>'is_variant')::boolean, false);

    insert into public.product_type_attributes
      (product_type_schema_id, attribute_id, is_required, is_filterable, display_order, group_key, configuration)
    values
      (v_schema_id, v_attribute_id, v_is_required, v_is_filterable, v_order - 1, v_group,
       jsonb_strip_nulls(jsonb_build_object(
         'role', v_role,
         'group', v_group,
         'allowed_values', coalesce(v_binding->'allowed_values', '[]'::jsonb),
         'min_value', v_binding->'min_value',
         'max_value', v_binding->'max_value',
         'unit_id', v_unit_id,
         'value_set_id', v_value_set_id
       )))
    on conflict (product_type_schema_id, attribute_id) do update
      set is_required = excluded.is_required,
          is_filterable = excluded.is_filterable,
          display_order = excluded.display_order,
          group_key = excluded.group_key,
          configuration = excluded.configuration,
          updated_at = now()
    returning id into v_binding_id;

    if v_is_variant then
      insert into public.variant_axes (product_type_attribute_id, display_order, configuration)
      values (v_binding_id, v_order - 1, jsonb_build_object('role', v_role, 'group', v_group))
      on conflict (product_type_attribute_id) do update
        set display_order = excluded.display_order,
            configuration = excluded.configuration,
            updated_at = now();
    else
      delete from public.variant_axes where product_type_attribute_id = v_binding_id;
    end if;
  end loop;

  delete from public.variant_axes va
   using public.product_type_attributes pta
   where va.product_type_attribute_id = pta.id
     and pta.product_type_schema_id = v_schema_id
     and not exists (
       select 1
         from jsonb_array_elements(p_bindings) as b(value)
         join public.attributes a
           on a.legacy_id = b.value->>'attribute_id' or a.id::text = b.value->>'attribute_id'
        where a.id = pta.attribute_id
     );

  delete from public.product_type_attributes pta
   where pta.product_type_schema_id = v_schema_id
     and not exists (
       select 1
         from jsonb_array_elements(p_bindings) as b(value)
         join public.attributes a
           on a.legacy_id = b.value->>'attribute_id' or a.id::text = b.value->>'attribute_id'
        where a.id = pta.attribute_id
     );
end;
$function$;

create or replace function public.replace_taxonomy_snapshot(p_nodes jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_node jsonb;
  v_binding jsonb;
  v_order integer;
  v_legacy_id text;
  v_parent_legacy_id text;
  v_parent_id uuid;
  v_schema_id uuid;
  v_attribute_id uuid;
  v_binding_id uuid;
  v_role text;
  v_is_variant boolean;
  v_node_uuid uuid;
begin
  if jsonb_typeof(p_nodes) <> 'array' then
    raise exception 'Taxonomy snapshot must be a JSON array';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_nodes) as e(value)
    where nullif(btrim(e.value->>'id'), '') is null
       or nullif(btrim(e.value->>'name_ar'), '') is null
       or nullif(btrim(e.value->>'slug'), '') is null
       or coalesce(e.value->>'node_type', 'category') not in ('department','category','subcategory','product_type')
  ) then
    raise exception 'Taxonomy snapshot contains a missing ID/name/slug or invalid node type';
  end if;

  if (select count(*) from jsonb_array_elements(p_nodes))
     <> (select count(distinct value->>'id') from jsonb_array_elements(p_nodes)) then
    raise exception 'Taxonomy snapshot contains duplicate IDs';
  end if;

  -- Upsert nodes without parent links first so parent order in the JSON is irrelevant.
  for v_node, v_order in
    select e.value, e.ordinality::integer
    from jsonb_array_elements(p_nodes) with ordinality as e(value, ordinality)
  loop
    v_legacy_id := v_node->>'id';
    insert into public.taxonomy_nodes
      (legacy_id, node_type, name_ar, name_en, description, slug, image_path, sort_order, status, source_metadata, archived_at)
    values
      (v_legacy_id, coalesce(v_node->>'node_type', 'category'), v_node->>'name_ar',
       nullif(v_node->>'name_en', ''), nullif(v_node->>'description', ''), v_node->>'slug', nullif(v_node->>'image', ''),
       v_order - 1, 'active', v_node, null)
    on conflict (legacy_id) do update
      set node_type = excluded.node_type,
          name_ar = excluded.name_ar,
          name_en = excluded.name_en,
          description = excluded.description,
          slug = excluded.slug,
          image_path = excluded.image_path,
          sort_order = excluded.sort_order,
          status = 'active',
          archived_at = null,
          source_metadata = excluded.source_metadata,
          updated_at = now();
  end loop;

  -- Missing rows are archived rather than hard-deleted.
  update public.taxonomy_nodes n
     set status = 'archived',
         archived_at = coalesce(n.archived_at, now()),
         updated_at = now()
   where n.status = 'active'
     and n.legacy_id is not null
     and not exists (
       select 1 from jsonb_array_elements(p_nodes) as e(value)
       where e.value->>'id' = n.legacy_id
     );

  -- Resolve legacy parent IDs to stable UUID relationships.
  for v_node in select value from jsonb_array_elements(p_nodes)
  loop
    v_legacy_id := v_node->>'id';
    v_parent_legacy_id := nullif(v_node->>'parent_id', '');
    v_parent_id := null;

    if v_parent_legacy_id is not null then
      select n.id into v_parent_id
        from public.taxonomy_nodes n
       where n.legacy_id = v_parent_legacy_id and n.status = 'active';

      if v_parent_id is null then
        raise exception 'Parent node % does not exist or is archived', v_parent_legacy_id;
      end if;
    end if;

    update public.taxonomy_nodes
       set parent_id = v_parent_id, updated_at = now()
     where legacy_id = v_legacy_id;
  end loop;

  -- Ensure exactly the active Product Type nodes have active schema records.
  update public.product_type_schemas s
     set status = 'archived', updated_at = now()
    from public.taxonomy_nodes n
   where s.taxonomy_node_id = n.id
     and s.status = 'active'
     and (n.status <> 'active' or n.node_type <> 'product_type');

  insert into public.product_type_schemas (taxonomy_node_id, status, source_metadata)
  select n.id, 'active', jsonb_build_object('legacy_id', n.legacy_id)
    from public.taxonomy_nodes n
   where n.status = 'active' and n.node_type = 'product_type'
  on conflict (taxonomy_node_id) do update
    set status = 'active', source_metadata = excluded.source_metadata, updated_at = now();

  -- Delegate Product Type bindings to the same validated assignment RPC used by the editor.
  for v_node in select value from jsonb_array_elements(p_nodes)
  loop
    v_legacy_id := v_node->>'id';
    if coalesce(v_node->>'node_type', 'category') <> 'product_type' then
      if jsonb_array_length(coalesce(v_node->'attributes', '[]'::jsonb)) > 0 then
        raise exception 'Attributes can only be assigned to Product Type nodes (node %)', v_legacy_id;
      end if;
      continue;
    end if;

    select n.id into v_node_uuid
      from public.taxonomy_nodes n
     where n.legacy_id = v_legacy_id and n.status = 'active';

    if v_node_uuid is null then
      raise exception 'Product Type node % was not found after snapshot update', v_legacy_id;
    end if;

    perform public.replace_product_type_attribute_assignments(
      v_node_uuid,
      coalesce(v_node->'attributes', '[]'::jsonb)
    );
  end loop;

end;
$function$;

revoke all on function public.replace_product_type_attribute_assignments(uuid, jsonb) from public, anon;
grant execute on function public.replace_product_type_attribute_assignments(uuid, jsonb) to authenticated;
