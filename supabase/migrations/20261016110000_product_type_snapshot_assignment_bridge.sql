-- Unit 22 follow-up: preserve typed Product Type assignment semantics in full taxonomy snapshots.
-- Runs after taxonomy_node_description so the description column exists.
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
