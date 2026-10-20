create or replace function public.prevent_taxonomy_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then return new; end if;
  if new.parent_id = new.id then
    raise exception 'A taxonomy node cannot be its own parent';
  end if;
  if exists (
    with recursive ancestors(id, parent_id) as (
      select n.id, n.parent_id from public.taxonomy_nodes n where n.id = new.parent_id
      union
      select n.id, n.parent_id from public.taxonomy_nodes n join ancestors a on n.id = a.parent_id
    )
    select 1 from ancestors where id = new.id
  ) then
    raise exception 'Reparenting would create a taxonomy cycle';
  end if;
  return new;
end;
$$;
create trigger taxonomy_nodes_prevent_cycle
before insert or update of parent_id on public.taxonomy_nodes
for each row execute function public.prevent_taxonomy_cycle();
revoke execute on function public.prevent_taxonomy_cycle() from public, anon, authenticated;

insert into public.taxonomy_nodes
  (legacy_id, node_type, name_ar, name_en, slug, image_path, source_metadata)
values
('cat_electronics', 'department', 'إلكترونيات', 'Electronics', 'electronics', null, '{"id":"cat_electronics","name_ar":"إلكترونيات","name_en":"Electronics","slug":"electronics","node_type":"department","parent_id":null,"image":null,"attributes":[]}'::jsonb),
('cat_phones', 'category', 'هواتف', 'Phones', 'phones', null, '{"id":"cat_phones","name_ar":"هواتف","name_en":"Phones","slug":"phones","node_type":"category","parent_id":"cat_electronics","image":null,"attributes":[]}'::jsonb),
('cat_smartphones', 'category', 'هواتف ذكية', 'Smartphones', 'smartphones', null, '{"id":"cat_smartphones","name_ar":"هواتف ذكية","name_en":"Smartphones","slug":"smartphones","node_type":"category","parent_id":"cat_phones","image":null,"attributes":[]}'::jsonb),
('cat_laptops', 'category', 'حواسيب محمولة', 'Laptops', 'laptops', null, '{"id":"cat_laptops","name_ar":"حواسيب محمولة","name_en":"Laptops","slug":"laptops","node_type":"category","parent_id":"cat_electronics","image":null,"attributes":[]}'::jsonb),
('cat_fashion', 'department', 'مواد البناء', 'Building Materials ', 'Building Materials', null, '{"id":"cat_fashion","name_ar":"مواد البناء","name_en":"Building Materials ","slug":"Building Materials","node_type":"department","parent_id":null,"image":null,"attributes":[]}'::jsonb),
('cat_men', 'category', 'رجالي', 'Men', 'men', null, '{"id":"cat_men","name_ar":"رجالي","name_en":"Men","slug":"men","node_type":"category","parent_id":"cat_fashion","image":null,"attributes":[]}'::jsonb),
('cat_women', 'category', 'نسائي', 'Women', 'women', null, '{"id":"cat_women","name_ar":"نسائي","name_en":"Women","slug":"women","node_type":"category","parent_id":"cat_fashion","image":null,"attributes":[]}'::jsonb),
('cat_pqltDmsuoSbhhB9WstGG4', 'department', 'الكهرباء', 'Electricity', 'Electricity', null, '{"id":"cat_pqltDmsuoSbhhB9WstGG4","name_ar":"الكهرباء","name_en":"Electricity","slug":"Electricity","node_type":"department","parent_id":null,"image":null,"attributes":[]}'::jsonb),
('cat__-ndHslQdxz0wtvEdkaZ-', 'category', 'الانارة', null, 'alanarh', '/categories/alanarh_1789687557031.webp', '{"id":"cat__-ndHslQdxz0wtvEdkaZ-","name_ar":"الانارة","slug":"alanarh","node_type":"category","parent_id":"cat_pqltDmsuoSbhhB9WstGG4","image":"/categories/alanarh_1789687557031.webp","attributes":[]}'::jsonb),
('cat_1fQLE0x9cD22giWZHPva0', 'category', 'لمبات', null, 'lmbat', null, '{"id":"cat_1fQLE0x9cD22giWZHPva0","name_ar":"لمبات","slug":"lmbat","node_type":"category","parent_id":"cat__-ndHslQdxz0wtvEdkaZ-","image":null,"attributes":[]}'::jsonb),
('cat_H-xUfB1OFnq34pG9jcvSC', 'category', 'لمبات ليد', null, 'lmbat-lyd', null, '{"id":"cat_H-xUfB1OFnq34pG9jcvSC","name_ar":"لمبات ليد","slug":"lmbat-lyd","node_type":"category","parent_id":"cat_1fQLE0x9cD22giWZHPva0","image":null,"attributes":[]}'::jsonb),
('cat_sMo5utmJJl59NwepQVJcS', 'department', 'السباكة والأدوات الصحية ', 'plumbing and sanitary tools ', 'plumbing and sanitary tools ', null, '{"id":"cat_sMo5utmJJl59NwepQVJcS","name_ar":"السباكة والأدوات الصحية ","name_en":"plumbing and sanitary tools ","slug":"plumbing and sanitary tools ","node_type":"department","parent_id":null,"image":null,"attributes":[]}'::jsonb),
('cat_bdA6rAzeZzoHTP-jtyoBV', 'department', 'الأدوية والمنتجات الطبية ', 'Medications and medicinal products', 'Medications and medicinal products', null, '{"id":"cat_bdA6rAzeZzoHTP-jtyoBV","name_ar":"الأدوية والمنتجات الطبية ","name_en":"Medications and medicinal products","slug":"Medications and medicinal products","node_type":"department","parent_id":null,"image":null,"attributes":[]}'::jsonb),
('cat_JhxzaGMAzmBVD1L5ywPlo', 'category', 'إنارة داخلية', 'Indoor Lighting ', 'Indoor Lighting ', '/categories/indoor_lighting__1790270071374.png', '{"id":"cat_JhxzaGMAzmBVD1L5ywPlo","name_ar":"إنارة داخلية","name_en":"Indoor Lighting ","slug":"Indoor Lighting ","node_type":"category","parent_id":"cat__-ndHslQdxz0wtvEdkaZ-","image":"/categories/indoor_lighting__1790270071374.png","attributes":[]}'::jsonb),
('cat_vwmAm8QC837PNj_3Xik8_', 'category', 'إنارة خارجية ', 'Outdoor Lighting ', 'Outdoor Lighting ', '/categories/outdoor_lighting__1790270103633.png', '{"id":"cat_vwmAm8QC837PNj_3Xik8_","name_ar":"إنارة خارجية ","name_en":"Outdoor Lighting ","slug":"Outdoor Lighting ","node_type":"category","parent_id":"cat__-ndHslQdxz0wtvEdkaZ-","image":"/categories/outdoor_lighting__1790270103633.png","attributes":[]}'::jsonb),
('cat_vwVkn2V9XBW9gDcITH8ot', 'category', 'إنارة ديكورية ', 'Decorative lighting ', 'Decorative lighting ', '/categories/decorative_lighting__1790270134567.png', '{"id":"cat_vwVkn2V9XBW9gDcITH8ot","name_ar":"إنارة ديكورية ","name_en":"Decorative lighting ","slug":"Decorative lighting ","node_type":"category","parent_id":"cat__-ndHslQdxz0wtvEdkaZ-","image":"/categories/decorative_lighting__1790270134567.png","attributes":[]}'::jsonb),
('cat_RytJK4v1u5GdfBGZK6AC3', 'category', 'إكسسوارات وملحقات الإنارة ', 'Lighting Accessories & Accessories ', 'Lighting Accessories & Accessories ', '/categories/lighting_accessories___accessories__1790270199467.png', '{"id":"cat_RytJK4v1u5GdfBGZK6AC3","name_ar":"إكسسوارات وملحقات الإنارة ","name_en":"Lighting Accessories & Accessories ","slug":"Lighting Accessories & Accessories ","node_type":"category","parent_id":"cat__-ndHslQdxz0wtvEdkaZ-","image":"/categories/lighting_accessories___accessories__1790270199467.png","attributes":[]}'::jsonb),
('cat_OhQ4h9RnmALzJLaOuldAE', 'category', 'المفاتيح والافياش', 'sockets', 'Sockets', '/categories/sockets_1790270294200.png', '{"id":"cat_OhQ4h9RnmALzJLaOuldAE","name_ar":"المفاتيح والافياش","name_en":"sockets","slug":"Sockets","node_type":"category","parent_id":"cat__-ndHslQdxz0wtvEdkaZ-","image":"/categories/sockets_1790270294200.png","attributes":[]}'::jsonb),
('cat_U24VqYORYXPSlfx8EZIpG', 'product_type', 'لمبات ليد LED ', 'LED Bulbs', 'LED Bulbs ', null, '{"name_ar":"لمبات ليد LED ","name_en":"LED Bulbs","slug":"LED Bulbs ","node_type":"product_type","parent_id":"cat_JhxzaGMAzmBVD1L5ywPlo","attributes":[],"id":"cat_U24VqYORYXPSlfx8EZIpG","image":null}'::jsonb);

update public.taxonomy_nodes child
set parent_id = parent.id
from public.taxonomy_nodes parent
where child.source_metadata->>'parent_id' = parent.legacy_id
  and child.parent_id is null;

insert into public.attributes
  (legacy_id, key, name_ar, name_en, data_type, filter_type, source_metadata)
values
('attr_color', 'legacy_attr_color', 'اللون', 'Color', 'string', 'color_swatch', '{"data_type":"string","id":"attr_color","name_ar":"اللون","name_en":"Color","filter_type":"color_swatch"}'::jsonb),
('attr_size', 'legacy_attr_size', 'المقاس', 'Size', 'string', 'button_group', '{"data_type":"string","id":"attr_size","name_ar":"المقاس","name_en":"Size","filter_type":"button_group"}'::jsonb),
('attr_material', 'legacy_attr_material', 'المادة', 'Material', 'string', 'checkbox', '{"data_type":"string","id":"attr_material","name_ar":"المادة","name_en":"Material","filter_type":"checkbox"}'::jsonb),
('attr_weight', 'legacy_attr_weight', 'الوزن', 'Weight', 'string', 'range', '{"data_type":"string","id":"attr_weight","name_ar":"الوزن","name_en":"Weight","filter_type":"range","unit":"كغ"}'::jsonb),
('attr_brand', 'legacy_attr_brand', 'العلامة التجارية', 'Brand', 'string', 'select', '{"data_type":"string","id":"attr_brand","name_ar":"العلامة التجارية","name_en":"Brand","filter_type":"select"}'::jsonb),
('attr_waterproof', 'legacy_attr_waterproof', 'مقاوم للماء', 'Waterproof', 'string', 'toggle', '{"data_type":"string","id":"attr_waterproof","name_ar":"مقاوم للماء","name_en":"Waterproof","filter_type":"toggle"}'::jsonb),
('njk7zl4S6PNZqG0wl8Zyd', 'legacy_njk7zl4s6pnzqg0wl8zyd', 'الموديل', 'Model', 'string', 'select', '{"data_type":"string","name_ar":"الموديل","name_en":"Model","filter_type":"select","id":"njk7zl4S6PNZqG0wl8Zyd"}'::jsonb);

insert into public.product_type_schemas (taxonomy_node_id, source_metadata)
select id, jsonb_build_object('migration_note','Created for legacy Product Type node','legacy_id',legacy_id)
from public.taxonomy_nodes
where node_type = 'product_type'
on conflict (taxonomy_node_id) do nothing;
