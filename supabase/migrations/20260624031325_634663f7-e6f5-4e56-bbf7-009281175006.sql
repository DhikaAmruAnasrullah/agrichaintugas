-- Helper: does the current user own the referenced product?
CREATE OR REPLACE FUNCTION public.owns_product(_product_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = _product_id AND farmer_id = _user_id
  )
$$;

-- LANDS: restrict reads to the owning farmer
DROP POLICY IF EXISTS "Signed-in users can view lands" ON public.lands;
CREATE POLICY "Farmers can view own lands"
ON public.lands FOR SELECT TO authenticated
USING (auth.uid() = farmer_id);

-- PRODUCTS: restrict reads to the owning farmer
DROP POLICY IF EXISTS "Signed-in users can view products" ON public.products;
CREATE POLICY "Farmers can view own products"
ON public.products FOR SELECT TO authenticated
USING (auth.uid() = farmer_id);

-- DISTRIBUTION EVENTS: only the product owner can view/insert events for it
DROP POLICY IF EXISTS "Signed-in users can view events" ON public.distribution_events;
CREATE POLICY "Owners can view product events"
ON public.distribution_events FOR SELECT TO authenticated
USING (public.owns_product(product_id, auth.uid()));

DROP POLICY IF EXISTS "Signed-in users can add events" ON public.distribution_events;
CREATE POLICY "Owners can add product events"
ON public.distribution_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = actor_id AND public.owns_product(product_id, auth.uid()));