create table public.app_authorized_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  is_active boolean not null default true,
  approved_at timestamptz not null default now(),
  note text null
);

create table public.taxonomy_nodes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  parent_id uuid null references public.taxonomy_nodes(id) on delete restrict,
  node_type text not null check (node_type in ('department','category','subcategory','product_type')),
  name_ar text not null check (length(btrim(name_ar)) > 0),
  name_en text null,
  slug text not null check (length(btrim(slug)) > 0),
  image_path text null,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null
);
create index taxonomy_nodes_parent_id_idx on public.taxonomy_nodes(parent_id);
create index taxonomy_nodes_node_type_idx on public.taxonomy_nodes(node_type);
create index taxonomy_nodes_status_idx on public.taxonomy_nodes(status);
create unique index taxonomy_nodes_active_sibling_slug_uq
  on public.taxonomy_nodes (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug))
  where status = 'active';

create table public.attributes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  key text not null unique check (length(btrim(key)) > 0),
  name_ar text not null check (length(btrim(name_ar)) > 0),
  name_en text null,
  data_type text not null check (data_type in ('string','number','boolean','enum')),
  filter_type text null,
  measurement_dimension_id uuid null,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null
);
create index attributes_status_idx on public.attributes(status);

create table public.product_type_schemas (
  id uuid primary key default gen_random_uuid(),
  taxonomy_node_id uuid not null unique references public.taxonomy_nodes(id) on delete restrict,
  status text not null default 'active' check (status in ('active','archived')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null
);

create table public.product_type_attributes (
  id uuid primary key default gen_random_uuid(),
  product_type_schema_id uuid not null references public.product_type_schemas(id) on delete restrict,
  attribute_id uuid not null references public.attributes(id) on delete restrict,
  is_required boolean not null default false,
  is_filterable boolean not null default false,
  display_order integer not null default 0,
  group_key text null,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  unique (product_type_schema_id, attribute_id)
);

alter table public.app_authorized_users enable row level security;
alter table public.taxonomy_nodes enable row level security;
alter table public.attributes enable row level security;
alter table public.product_type_schemas enable row level security;
alter table public.product_type_attributes enable row level security;
