import { createServerFn } from "@tanstack/react-start";

// Public traceability lookup by product code — no auth required.
// Uses the admin client (scoped to a single product code) so consumers can
// scan a QR / enter a code without signing in. Only safe, non-PII columns are returned.
export const getPublicProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => ({
    code: String(input.code).trim().slice(0, 60),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product } = await supabaseAdmin
      .from("products")
      .select(
        "id, product_code, commodity, variety, weight_kg, harvest_date, method, status, farmer_id, land_id, created_at",
      )
      .eq("product_code", data.code)
      .maybeSingle();

    if (!product) return { product: null, farmer: null, land: null, events: [] };

    const [{ data: farmer }, { data: land }, { data: events }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, region")
        .eq("id", product.farmer_id)
        .maybeSingle(),
      product.land_id
        ? supabaseAdmin
            .from("lands")
            .select("name, location, gps_coords")
            .eq("id", product.land_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from("distribution_events")
        .select("event_type, actor_name, location, notes, tx_hash, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: true }),
    ]);

    return {
      product,
      farmer: farmer ?? null,
      land: land ?? null,
      events: events ?? [],
    };
  });
