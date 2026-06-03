import { z } from "zod";

export const APP_ROLES = ["admin", "petani", "distributor", "konsumen"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  petani: "Petani",
  distributor: "Distributor",
  konsumen: "Konsumen",
};

export const EVENT_TYPES = [
  "harvest",
  "processing",
  "distribution",
  "retail",
  "delivered",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_LABELS: Record<EventType, string> = {
  harvest: "Panen Selesai",
  processing: "Pengolahan",
  distribution: "Distribusi Logistik",
  retail: "Tiba di Retail",
  delivered: "Sampai ke Konsumen",
};

export const landSchema = z.object({
  name: z.string().min(2).max(120),
  area_ha: z.number().min(0).max(100000),
  location: z.string().max(200).optional().or(z.literal("")),
  gps_coords: z.string().max(120).optional().or(z.literal("")),
});

export const harvestSchema = z.object({
  commodity: z.string().min(2).max(120),
  variety: z.string().max(120).optional().or(z.literal("")),
  weight_kg: z.number().min(0).max(10_000_000),
  harvest_date: z.string().min(4).max(40),
  method: z.string().max(120).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  land_id: z.string().uuid().optional().or(z.literal("")),
});

export const distributionSchema = z.object({
  product_id: z.string().uuid(),
  event_type: z.enum(EVENT_TYPES),
  location: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type LandInput = z.infer<typeof landSchema>;
export type HarvestInput = z.infer<typeof harvestSchema>;
export type DistributionInput = z.infer<typeof distributionSchema>;
