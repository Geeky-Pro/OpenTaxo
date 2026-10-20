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
      (legacy_id, node_type, name_ar, name_en, slug, image_path, sort_order, status, source_metadata, archived_at)
    values
      (v_legacy_id, coalesce(v_node->>'node_type', 'category'), v_node->>'name_ar',
       nullif(v_node->>'name_en', ''), v_node->>'slug', nullif(v_node->>'image', ''),
       v_order - 1, 'active', v_node, null)
    on conflict (legacy_id) do update
      set node_type = excluded.node_type,
          name_ar = excluded.name_ar,
          name_en = excluded.name_en,
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

  -- Product Type is the only attribute/schema boundary. Preserve binding UUIDs
  -- for unchanged (schema, attribute) pairs and synchronize variant axes.
  for v_node in select value from jsonb_array_elements(p_nodes)
  loop
    v_legacy_id := v_node->>'id';

    if coalesce(v_node->>'node_type', 'category') <> 'product_type' then
      if jsonb_array_length(coalesce(v_node->'attributes', '[]'::jsonb)) > 0 then
        raise exception 'Attributes can only be assigned to Product Type nodes (node %)', v_legacy_id;
      end if;
      continue;
    end if;

    select s.id into v_schema_id
      from public.product_type_schemas s
      join public.taxonomy_nodes n on n.id = s.taxonomy_node_id
     where n.legacy_id = v_legacy_id and n.status = 'active' and s.status = 'active';

    if v_schema_id is null then
      raise exception 'Product Type schema missing for node %', v_legacy_id;
    end if;

    for v_binding, v_order in
      select e.value, e.ordinality::integer
      from jsonb_array_elements(coalesce(v_node->'attributes', '[]'::jsonb))
           with ordinality as e(value, ordinality)
    loop
      if nullif(btrim(v_binding->>'attribute_id'), '') is null then
        raise exception 'Attribute binding has no attribute_id on node %', v_legacy_id;
      end if;

      select a.id into v_attribute_id
        from public.attributes a
       where a.legacy_id = v_binding->>'attribute_id' and a.status = 'active';

      if v_attribute_id is null then
        raise exception 'Attribute % does not exist or is archived', v_binding->>'attribute_id';
      end if;

      v_role := coalesce(nullif(v_binding->>'role', ''), 'descriptive');
      v_is_variant := coalesce((v_binding->>'is_variant')::boolean, false);

      insert into public.product_type_attributes
        (product_type_schema_id, attribute_id, is_required, is_filterable, display_order, group_key, configuration)
      values
        (v_schema_id, v_attribute_id, false, true, v_order - 1,
         nullif(v_binding->>'group', ''),
         jsonb_build_object('role', v_role, 'group', v_binding->'group',
                            'allowed_values', coalesce(v_binding->'allowed_values', '[]'::jsonb)))
      on conflict (product_type_schema_id, attribute_id) do update
        set is_filterable = excluded.is_filterable,
            display_order = excluded.display_order,
            group_key = excluded.group_key,
            configuration = excluded.configuration,
            updated_at = now()
      returning id into v_binding_id;

      if v_is_variant then
        insert into public.variant_axes (product_type_attribute_id, display_order, configuration)
        values (v_binding_id, v_order - 1, jsonb_build_object('role', v_role, 'group', v_binding->'group'))
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
           from jsonb_array_elements(coalesce(v_node->'attributes', '[]'::jsonb)) as b(value)
           join public.attributes a on a.legacy_id = b.value->>'attribute_id'
          where a.id = pta.attribute_id
       );

    delete from public.product_type_attributes pta
     where pta.product_type_schema_id = v_schema_id
       and not exists (
         select 1
           from jsonb_array_elements(coalesce(v_node->'attributes', '[]'::jsonb)) as b(value)
           join public.attributes a on a.legacy_id = b.value->>'attribute_id'
          where a.id = pta.attribute_id
       );
  end loop;
end;
$function$;

create or replace function public.replace_attribute_snapshot(p_attributes jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_attribute jsonb;
  v_legacy_id text;
  v_key text;
begin
  if jsonb_typeof(p_attributes) <> 'array' then
    raise exception 'Attribute snapshot must be a JSON array';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_attributes) as e(value)
    where nullif(btrim(e.value->>'id'), '') is null
       or nullif(btrim(e.value->>'name_ar'), '') is null
       or coalesce(e.value->>'data_type', 'string') not in ('string','number','boolean','enum')
  ) then
    raise exception 'Attribute snapshot contains a missing ID/name or invalid data type';
  end if;

  if (select count(*) from jsonb_array_elements(p_attributes))
     <> (select count(distinct value->>'id') from jsonb_array_elements(p_attributes)) then
    raise exception 'Attribute snapshot contains duplicate IDs';
  end if;

  for v_attribute in select value from jsonb_array_elements(p_attributes)
  loop
    v_legacy_id := v_attribute->>'id';
    v_key := 'legacy_' || coalesce(
      nullif(btrim(regexp_replace(lower(v_legacy_id), '[^a-z0-9]+', '_', 'g'), '_'), ''),
      'attribute'
    );

    insert into public.attributes
      (legacy_id, key, name_ar, name_en, data_type, filter_type, status, source_metadata, archived_at)
    values
      (v_legacy_id, v_key, v_attribute->>'name_ar', nullif(v_attribute->>'name_en', ''),
       coalesce(v_attribute->>'data_type', 'string'), nullif(v_attribute->>'filter_type', ''),
       'active', v_attribute, null)
    on conflict (legacy_id) do update
      set name_ar = excluded.name_ar,
          name_en = excluded.name_en,
          data_type = excluded.data_type,
          filter_type = excluded.filter_type,
          status = 'active',
          archived_at = null,
          source_metadata = excluded.source_metadata,
          updated_at = now();
  end loop;

  update public.attributes a
     set status = 'archived',
         archived_at = coalesce(a.archived_at, now()),
         updated_at = now()
   where a.status = 'active'
     and a.legacy_id is not null
     and not exists (
       select 1 from jsonb_array_elements(p_attributes) as e(value)
       where e.value->>'id' = a.legacy_id
     );
end;
$function$;

revoke all on function public.replace_taxonomy_snapshot(jsonb) from public, anon;
revoke all on function public.replace_attribute_snapshot(jsonb) from public, anon;
grant execute on function public.replace_taxonomy_snapshot(jsonb) to authenticated;
grant execute on function public.replace_attribute_snapshot(jsonb) to authenticated;
