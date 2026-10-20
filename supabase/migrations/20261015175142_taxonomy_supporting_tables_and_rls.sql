create table public.taxonomy_aliases (
  id uuid primary key default gen_random_uuid(),
  taxonomy_node_id uuid not null references public.taxonomy_nodes(id) on delete restrict,
  alias_text text not null check (length(btrim(alias_text)) > 0),
  language_code text null, source_system text null, source_value text null,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);
create index taxonomy_aliases_node_id_idx on public.taxonomy_aliases(taxonomy_node_id);

create table public.attribute_aliases (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete restrict,
  alias_text text not null check (length(btrim(alias_text)) > 0),
  language_code text null, source_system text null, source_value text null,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);
create index attribute_aliases_attribute_id_idx on public.attribute_aliases(attribute_id);

create table public.attribute_value_sets (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique, key text not null unique check (length(btrim(key)) > 0),
  name_ar text not null check (length(btrim(name_ar)) > 0), name_en text null,
  attribute_id uuid null references public.attributes(id) on delete restrict,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz null
);
create index attribute_value_sets_attribute_id_idx on public.attribute_value_sets(attribute_id);

create table public.attribute_values (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  value_set_id uuid not null references public.attribute_value_sets(id) on delete restrict,
  value_key text not null check (length(btrim(value_key)) > 0),
  label_ar text not null check (length(btrim(label_ar)) > 0), label_en text null,
  raw_value text null,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  unique (value_set_id, value_key)
);
create index attribute_values_value_set_id_idx on public.attribute_values(value_set_id);

create table public.variant_axes (
  id uuid primary key default gen_random_uuid(),
  product_type_attribute_id uuid not null unique references public.product_type_attributes(id) on delete restrict,
  display_order integer not null default 0, configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.variant_constraints (
  id uuid primary key default gen_random_uuid(),
  product_type_schema_id uuid not null references public.product_type_schemas(id) on delete restrict,
  constraint_key text not null, configuration jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (product_type_schema_id, constraint_key)
);

create table public.measurement_dimensions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_ar text not null check (length(btrim(name_ar)) > 0), name_en text null,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.measurement_units (
  id uuid primary key default gen_random_uuid(),
  dimension_id uuid not null references public.measurement_dimensions(id) on delete restrict,
  key text not null unique,
  name_ar text not null check (length(btrim(name_ar)) > 0), name_en text null, symbol text null,
  to_base_multiplier numeric(38,18) not null default 1 check (to_base_multiplier > 0),
  to_base_offset numeric(38,18) not null default 0,
  is_base boolean not null default false,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index measurement_units_dimension_id_idx on public.measurement_units(dimension_id);
create unique index measurement_units_one_base_per_dimension_uq
  on public.measurement_units(dimension_id) where is_base and status = 'active';

create table public.selling_unit_definitions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique, key text not null unique,
  name_ar text not null check (length(btrim(name_ar)) > 0), name_en text null,
  base_selling_unit_id uuid null references public.selling_unit_definitions(id) on delete restrict,
  quantity_in_base numeric(38,18) null check (quantity_in_base > 0),
  measurement_dimension_id uuid null references public.measurement_dimensions(id) on delete restrict,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  archived_at timestamptz null
);

alter table public.attributes
  add constraint attributes_measurement_dimension_fk
  foreign key (measurement_dimension_id) references public.measurement_dimensions(id) on delete restrict;

create table public.unit_conversion_rules (
  id uuid primary key default gen_random_uuid(),
  source_unit_id uuid not null references public.measurement_units(id) on delete restrict,
  target_unit_id uuid not null references public.measurement_units(id) on delete restrict,
  multiplier numeric(38,18) not null check (multiplier > 0),
  offset_value numeric(38,18) not null default 0,
  selling_unit_definition_id uuid null references public.selling_unit_definitions(id) on delete restrict,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (source_unit_id <> target_unit_id),
  unique (source_unit_id, target_unit_id, selling_unit_definition_id)
);
create index unit_conversion_rules_source_idx on public.unit_conversion_rules(source_unit_id);
create index unit_conversion_rules_target_idx on public.unit_conversion_rules(target_unit_id);

insert into public.app_authorized_users (user_id, is_active, note)
values ('a1ae0bfc-519d-4844-a19a-cc287f9de1a4'::uuid, true, 'Initial project owner explicitly approved for app access')
on conflict (user_id) do update set is_active = excluded.is_active, note = excluded.note;

grant select on public.app_authorized_users to authenticated;
create policy "owner reads own active authorization" on public.app_authorized_users
  for select to authenticated using ((select auth.uid()) = user_id and is_active);

do $$
declare t text;
begin
  foreach t in array array[
    'taxonomy_nodes','taxonomy_aliases','attributes','attribute_aliases','attribute_value_sets','attribute_values',
    'product_type_schemas','product_type_attributes','variant_axes','variant_constraints',
    'measurement_dimensions','measurement_units','selling_unit_definitions','unit_conversion_rules'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.app_authorized_users a where a.user_id = (select auth.uid()) and a.is_active))', t || '_owner_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.app_authorized_users a where a.user_id = (select auth.uid()) and a.is_active))', t || '_owner_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (exists (select 1 from public.app_authorized_users a where a.user_id = (select auth.uid()) and a.is_active)) with check (exists (select 1 from public.app_authorized_users a where a.user_id = (select auth.uid()) and a.is_active))', t || '_owner_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.app_authorized_users a where a.user_id = (select auth.uid()) and a.is_active))', t || '_owner_delete', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
revoke all on public.app_authorized_users from anon;
