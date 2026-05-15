
REVOKE EXECUTE ON FUNCTION public.increment_post_views(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO authenticated;
