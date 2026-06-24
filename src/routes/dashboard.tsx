import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getDashboard,
  createLand,
  createHarvest,
  addDistributionEvent,
} from "@/lib/agrichain.functions";
import {
  ROLE_LABELS,
  EVENT_LABELS,
  EVENT_TYPES,
  type AppRole,
  type EventType,
} from "@/lib/schemas";
import {
  Package,
  Map as MapIcon,
  Activity,
  Sprout,
  Plus,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AgriChain" }] }),
  component: DashboardPage,
});

type DashData = Awaited<ReturnType<typeof getDashboard>>;

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchDashboard = useServerFn(getDashboard);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data, isLoading } = useQuery<DashData>({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
    enabled: !!user,
  });

  if (loading || (!data && isLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">
          Memuat dashboard…
        </div>
      </div>
    );
  }

  if (!data) return null;

  const role = data.role as AppRole;

  if (role === "konsumen") {
    return <ConsumerDashboard fullName={data.profile?.full_name || "Pengguna"} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Halo, {data.profile?.full_name || "Pengguna"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard rantai pasok AgriChain
            </p>
          </div>
          <Badge variant="secondary" className="font-mono uppercase">
            {ROLE_LABELS[role]}
          </Badge>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Package} label="Total Produk" value={data.products.length} />
          <StatCard icon={MapIcon} label="Lahan Terdaftar" value={data.lands.length} />
          <StatCard icon={Activity} label="Kejadian Distribusi" value={data.events.length} />
          <StatCard
            icon={Sprout}
            label="Terkirim"
            value={data.products.filter((p) => p.status === "delivered").length}
          />
        </div>

        {/* Role actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {(role === "petani" || role === "admin") && (
            <>
              <NewLandDialog />
              <NewHarvestDialog lands={data.lands} />
            </>
          )}
          {(role === "distributor" || role === "admin") && (
            <NewEventDialog products={data.products} />
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Products */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Produk</CardTitle>
              <CardDescription>Hasil panen yang tercatat di rantai pasok.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.products.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada produk.</p>
              )}
              {data.products.slice(0, 12).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-card-foreground">
                      {p.commodity}
                      {p.variety ? ` · ${p.variety}` : ""}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {p.product_code} · {p.weight_kg} kg
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {p.status}
                    </Badge>
                    <Button size="icon" variant="ghost" asChild>
                      <Link to="/track/$code" params={{ code: p.product_code }} aria-label="Lacak">
                        <ExternalLink className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>Kejadian distribusi terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.events.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
              )}
              {data.events.slice(0, 10).map((ev, i) => (
                <div key={i} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 size-2 rounded-full bg-brand" />
                  <p className="text-sm font-medium text-card-foreground">
                    {EVENT_LABELS[ev.event_type as EventType] ?? ev.event_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ev.actor_name} · {ev.location || "—"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground/70">
                    {ev.tx_hash?.slice(0, 14)}…
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid size-11 place-items-center rounded-xl bg-secondary">
          <Icon className="size-5 text-primary" />
        </span>
        <div>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ConsumerDashboard({ fullName }: { fullName: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = code.trim();
    if (c) navigate({ to: "/track/$code", params: { code: c } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Halo, {fullName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lacak asal-usul produk pertanian yang Anda beli.
            </p>
          </div>
          <Badge variant="secondary" className="font-mono uppercase">
            {ROLE_LABELS.konsumen}
          </Badge>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Lacak Produk</CardTitle>
            <CardDescription>
              Masukkan kode produk untuk melihat riwayat panen dan distribusinya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: BER-2026-1219"
                className="font-mono"
              />
              <Button type="submit">
                <Search className="size-4" /> Lacak
              </Button>
            </form>
            <Button variant="link" asChild className="mt-3 px-0">
              <Link to="/track">Buka halaman pelacakan lengkap</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="flex items-start gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary">
              <Sprout className="size-5 text-primary" />
            </span>
            <div>
              <p className="font-medium text-card-foreground">
                Transparansi rantai pasok
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Setiap produk memiliki jejak terverifikasi mulai dari lahan
                petani hingga sampai ke tangan Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NewLandDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const run = useServerFn(createLand);
  const m = useMutation({
    mutationFn: (input: { name: string; area_ha: number; location: string; gps_coords: string }) =>
      run({ data: input }),
    onSuccess: () => {
      toast.success("Lahan ditambahkan");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Gagal", { description: e.message }),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    m.mutate({
      name: String(fd.get("name")),
      area_ha: Number(fd.get("area_ha") || 0),
      location: String(fd.get("location") || ""),
      gps_coords: String(fd.get("gps_coords") || ""),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" /> Tambah Lahan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Lahan</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="l-name">Nama lahan</Label>
            <Input id="l-name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="l-area">Luas (ha)</Label>
              <Input id="l-area" name="area_ha" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-loc">Lokasi</Label>
              <Input id="l-loc" name="location" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-gps">Koordinat GPS</Label>
            <Input id="l-gps" name="gps_coords" placeholder="-6.914, 107.609" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewHarvestDialog({ lands }: { lands: DashData["lands"] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [landId, setLandId] = useState("");
  const run = useServerFn(createHarvest);
  const m = useMutation({
    mutationFn: (input: Record<string, unknown>) => run({ data: input }),
    onSuccess: () => {
      toast.success("Hasil panen dicatat");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Gagal", { description: e.message }),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    m.mutate({
      commodity: String(fd.get("commodity")),
      variety: String(fd.get("variety") || ""),
      weight_kg: Number(fd.get("weight_kg") || 0),
      harvest_date: String(fd.get("harvest_date")),
      method: String(fd.get("method") || ""),
      location: String(fd.get("location") || ""),
      land_id: landId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Catat Panen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Hasil Panen</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="h-comm">Komoditas</Label>
              <Input id="h-comm" name="commodity" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-var">Varietas</Label>
              <Input id="h-var" name="variety" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="h-w">Berat (kg)</Label>
              <Input id="h-w" name="weight_kg" type="number" step="0.01" min="0" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-date">Tanggal panen</Label>
              <Input id="h-date" name="harvest_date" type="date" required />
            </div>
          </div>
          {lands.length > 0 && (
            <div className="space-y-2">
              <Label>Lahan</Label>
              <Select value={landId} onValueChange={setLandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih lahan (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  {lands.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="h-method">Metode</Label>
              <Input id="h-method" name="method" placeholder="Organik" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-loc">Lokasi</Label>
              <Input id="h-loc" name="location" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Menyimpan…" : "Catat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewEventDialog({ products }: { products: DashData["products"] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [eventType, setEventType] = useState<EventType>("distribution");
  const run = useServerFn(addDistributionEvent);
  const m = useMutation({
    mutationFn: (input: Record<string, unknown>) => run({ data: input }),
    onSuccess: () => {
      toast.success("Kejadian distribusi dicatat");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error("Gagal", { description: e.message }),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productId) return toast.error("Pilih produk dulu");
    const fd = new FormData(e.currentTarget);
    m.mutate({
      product_id: productId,
      event_type: eventType,
      location: String(fd.get("location") || ""),
      notes: String(fd.get("notes") || ""),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Catat Distribusi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Kejadian Distribusi</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Produk</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.product_code} — {p.commodity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenis kejadian</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.filter((t) => t !== "harvest").map((t) => (
                  <SelectItem key={t} value={t}>
                    {EVENT_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-loc">Lokasi</Label>
            <Input id="e-loc" name="location" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e-notes">Catatan</Label>
            <Textarea id="e-notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Menyimpan…" : "Catat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
