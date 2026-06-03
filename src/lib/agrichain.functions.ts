import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  landSchema,
  harvestSchema,
  distributionSchema,
  type AppRole,
} from "./schemas";

function mockTxHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function productCode(commodity: string): string {
  const prefix = commodity
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const n = Math.floor(1000 + Math.random() * 9000);
  const y = new Date().getFullYear();
  return `${prefix}-${y}-${n}`;
}

// ---------- Dashboard (authenticated) ----------
export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roles }, { data: products }, { data: events }, { data: lands }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase
          .from("distribution_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("lands").select("*").order("created_at", { ascending: false }),
      ]);

    const role = (roles?.[0]?.role ?? "konsumen") as AppRole;

    return {
      profile: profile ?? null,
      role,
      products: products ?? [],
      events: events ?? [],
      lands: lands ?? [],
    };
  });

// ---------- Create land ----------
export const createLand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => landSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: land, error } = await supabase
      .from("lands")
      .insert({
        farmer_id: userId,
        name: data.name,
        area_ha: data.area_ha,
        location: data.location || null,
        gps_coords: data.gps_coords || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return land;
  });

// ---------- Create harvest (product + genesis event) ----------
export const createHarvest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => harvestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, region")
      .eq("id", userId)
      .maybeSingle();

    let code = productCode(data.commodity);
    // ensure uniqueness with a couple of retries
    for (let i = 0; i < 3; i++) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("product_code", code)
        .maybeSingle();
      if (!existing) break;
      code = productCode(data.commodity);
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        product_code: code,
        farmer_id: userId,
        land_id: data.land_id || null,
        commodity: data.commodity,
        variety: data.variety || null,
        weight_kg: data.weight_kg,
        harvest_date: data.harvest_date,
        method: data.method || null,
        status: "harvested",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { error: evErr } = await supabase.from("distribution_events").insert({
      product_id: product.id,
      actor_id: userId,
      event_type: "harvest",
      actor_name: profile?.full_name || "Petani",
      location: data.location || profile?.region || null,
      notes: "Pencatatan hasil panen terverifikasi",
      tx_hash: mockTxHash(),
    });
    if (evErr) throw new Error(evErr.message);

    return product;
  });

// ---------- Add distribution event ----------
export const addDistributionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => distributionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    const { error } = await supabase.from("distribution_events").insert({
      product_id: data.product_id,
      actor_id: userId,
      event_type: data.event_type,
      actor_name: profile?.full_name || "Pengguna",
      location: data.location || null,
      notes: data.notes || null,
      tx_hash: mockTxHash(),
    });
    if (error) throw new Error(error.message);

    const statusMap: Record<string, string> = {
      processing: "processing",
      distribution: "in_transit",
      retail: "at_retail",
      delivered: "delivered",
    };
    if (statusMap[data.event_type]) {
      await supabase
        .from("products")
        .update({ status: statusMap[data.event_type] })
        .eq("id", data.product_id);
    }

    return { ok: true };
  });

// ---------- Update wallet address ----------
export const saveWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { wallet: string }) => ({
    wallet: String(input.wallet).slice(0, 80),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ wallet_address: data.wallet })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
