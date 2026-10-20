create or replace function public.replace_taxonomy_and_attribute_snapshots(
  p_nodes jsonb,
  p_attributes jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  perform public.replace_taxonomy_snapshot(p_nodes);
  perform public.replace_attribute_snapshot(p_attributes);
end;
$function$;

revoke all on function public.replace_taxonomy_and_attribute_snapshots(jsonb, jsonb) from public, anon;
grant execute on function public.replace_taxonomy_and_attribute_snapshots(jsonb, jsonb) to authenticated;
