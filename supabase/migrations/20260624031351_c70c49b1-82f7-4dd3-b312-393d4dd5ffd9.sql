REVOKE ALL ON FUNCTION public.owns_product(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_product(uuid, uuid) TO authenticated, service_role;