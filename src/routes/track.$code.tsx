import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getPublicProduct } from "@/lib/public.functions";
import { EVENT_LABELS, type EventType } from "@/lib/schemas";
import { Leaf, MapPin, Calendar, Scale, ShieldCheck, Search } from "lucide-react";

export const Route = createFileRoute("/track/$code")({
  head: () => ({ meta: [{ title: "Hasil Pelacakan — AgriChain" }] }),
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <p className="mx-auto max-w-xl px-6 py-24 text-center text-sm text-muted-foreground">
        Terjadi kesalahan saat memuat data produk.
      </p>
    </div>
  ),
  component: TrackResult,
});

type Result = Awaited<ReturnType<typeof getPublicProduct>>;

function TrackResult() {
  const { code } = Route.useParams();
  const fetchProduct = useServerFn(getPublicProduct);
  const { data, isLoading } = useQuery<Result>({
    queryKey: ["track", code],
    queryFn: () => fetchProduct({ data: { code } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/track" className="text-sm text-muted-foreground hover:text-primary">
          ← Lacak produk lain
        </Link>

        {isLoading && (
          <p className="mt-10 text-sm text-muted-foreground">Memuat data…</p>
        )}

        {!isLoading && data && !data.product && (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center">
            <Search className="mx-auto size-8 text-muted-foreground" />
            <h1 className="mt-4 text-lg font-semibold text-card-foreground">
              Produk tidak ditemukan
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tidak ada produk dengan kode{" "}
              <span className="font-mono">{code}</span>.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/track">Coba lagi</Link>
            </Button>
          </div>
        )}

        {!isLoading && data?.product && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-card p-6">
              <div>
                <Badge variant="secondary" className="font-mono uppercase">
                  {data.product.status}
                </Badge>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-card-foreground">
                  {data.product.commodity}
                  {data.product.variety ? ` · ${data.product.variety}` : ""}
                </h1>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {data.product.product_code}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Scale className="size-4" /> {data.product.weight_kg} kg
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="size-4" /> Panen: {data.product.harvest_date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Leaf className="size-4" /> Petani: {data.farmer?.full_name || "—"}
                  </span>
                  {data.land?.name && (
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4" /> {data.land.name}
                      {data.land.location ? ` · ${data.land.location}` : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <QRCodeSVG value={data.product.product_code} size={104} />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Distribusi</CardTitle>
                <CardDescription>
                  Setiap langkah tercatat secara transparan di rantai pasok.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-6 border-l border-border pl-6">
                  {data.events.map((ev, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[1.65rem] top-1 grid size-4 place-items-center rounded-full bg-brand">
                        <ShieldCheck className="size-2.5 text-brand-foreground" />
                      </span>
                      <p className="font-medium text-card-foreground">
                        {EVENT_LABELS[ev.event_type as EventType] ?? ev.event_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ev.actor_name}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                      {ev.notes && (
                        <p className="text-sm text-muted-foreground">{ev.notes}</p>
                      )}
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                        {new Date(ev.created_at).toLocaleString("id-ID")} · tx {ev.tx_hash?.slice(0, 16)}…
                      </p>
                    </li>
                  ))}
                  {data.events.length === 0 && (
                    <li className="text-sm text-muted-foreground">Belum ada riwayat.</li>
                  )}
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
