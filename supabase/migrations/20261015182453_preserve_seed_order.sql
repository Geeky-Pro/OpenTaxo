alter table public.attributes
  add column if not exists sort_order integer not null default 0;

with seed_order(legacy_id, sort_order) as (
  values
    ('attr_color', 0),
    ('attr_size', 1),
    ('attr_material', 2),
    ('attr_weight', 3),
    ('attr_brand', 4),
    ('attr_waterproof', 5),
    ('njk7zl4S6PNZqG0wl8Zyd', 6)
)
update public.attributes a
   set sort_order = s.sort_order
  from seed_order s
 where a.legacy_id = s.legacy_id;

with seed_order(legacy_id, sort_order) as (
  values
    ('cat_electronics', 0),
    ('cat_phones', 1),
    ('cat_smartphones', 2),
    ('cat_laptops', 3),
    ('cat_fashion', 4),
    ('cat_men', 5),
    ('cat_women', 6),
    ('cat_pqltDmsuoSbhhB9WstGG4', 7),
    ('cat__-ndHslQdxz0wtvEdkaZ-', 8),
    ('cat_1fQLE0x9cD22giWZHPva0', 9),
    ('cat_H-xUfB1OFnq34pG9jcvSC', 10),
    ('cat_sMo5utmJJl59NwepQVJcS', 11),
    ('cat_bdA6rAzeZzoHTP-jtyoBV', 12),
    ('cat_JhxzaGMAzmBVD1L5ywPlo', 13),
    ('cat_vwmAm8QC837PNj_3Xik8_', 14),
    ('cat_vwVkn2V9XBW9gDcITH8ot', 15),
    ('cat_RytJK4v1u5GdfBGZK6AC3', 16),
    ('cat_OhQ4h9RnmALzJLaOuldAE', 17),
    ('cat_U24VqYORYXPSlfx8EZIpG', 18)
)
update public.taxonomy_nodes n
   set sort_order = s.sort_order
  from seed_order s
 where n.legacy_id = s.legacy_id;

create or replace function public.replace_attribute_snapshot(p_attributes jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_attribute jsonb;
  v_order integer;
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

  for v_attribute, v_order in
    select e.value, e.ordinality::integer
      from jsonb_array_elements(p_attributes) with ordinality as e(value, ordinality)
  loop
    v_legacy_id := v_attribute->>'id';
    v_key := 'legacy_' || coalesce(
      nullif(btrim(regexp_replace(lower(v_legacy_id), '[^a-z0-9]+', '_', 'g'), '_'), ''),
      'attribute'
    );

    insert into public.attributes
      (legacy_id, key, name_ar, name_en, data_type, filter_type, sort_order, status, source_metadata, archived_at)
    values
      (v_legacy_id, v_key, v_attribute->>'name_ar', nullif(v_attribute->>'name_en', ''),
       coalesce(v_attribute->>'data_type', 'string'), nullif(v_attribute->>'filter_type', ''),
       v_order - 1, 'active', v_attribute, null)
    on conflict (legacy_id) do update
      set name_ar = excluded.name_ar,
          name_en = excluded.name_en,
          data_type = excluded.data_type,
          filter_type = excluded.filter_type,
          sort_order = excluded.sort_order,
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
