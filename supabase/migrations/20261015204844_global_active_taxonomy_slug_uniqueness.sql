update public.taxonomy_nodes
set slug = lower(trim(both '-' from regexp_replace(
  regexp_replace(
    regexp_replace(trim(slug), '[[:space:]]+', '-', 'g'),
    '[^a-zA-Z0-9-]', '', 'g'
  ),
  '-+', '-', 'g'
))),
updated_at = now()
where slug is distinct from lower(trim(both '-' from regexp_replace(
  regexp_replace(
    regexp_replace(trim(slug), '[[:space:]]+', '-', 'g'),
    '[^a-zA-Z0-9-]', '', 'g'
  ),
  '-+', '-', 'g'
)));

drop index if exists public.taxonomy_nodes_active_sibling_slug_uq;
create unique index taxonomy_nodes_active_slug_global_uq
  on public.taxonomy_nodes (lower(slug))
  where status = 'active';
