-- Normalize URL slugs that contain whitespace.
-- This keeps existing taxonomy paths routable and makes subsequent reads/writes
-- normalize slugs consistently through CategorySchema.
update public.taxonomy_nodes
set slug = regexp_replace(trim(slug), '[[:space:]]+', '-', 'g'),
    updated_at = now()
where slug is distinct from regexp_replace(trim(slug), '[[:space:]]+', '-', 'g');
