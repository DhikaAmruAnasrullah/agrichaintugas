import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  ShieldCheck,
  QrCode,
  BarChart3,
  Sprout,
  Truck,
  Store,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriChain — Transparansi Rantai Pasok Pertanian di Blockchain" },
      {
        name: "description",
        content:
          "AgriChain melacak hasil panen petani lokal dari lahan hingga konsumen dengan catatan terverifikasi blockchain, QR code, dan dashboard real-time.",
      },
      { property: "og:title", content: "AgriChain — Rantai Pasok Pertanian Transparan" },
      {
        property: "og:description",
        content:
          "Lacak asal produk, tanggal panen, lokasi produksi, dan riwayat distribusi secara transparan dengan AgriChain.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: Sprout,
    title: "Registrasi & Lahan",
    desc: "Petani mendaftar, mencatat data lahan, dan menerbitkan hasil panen dengan ID unik.",
  },
  {
    icon: ShieldCheck,
    title: "Catatan Terverifikasi",
    desc: "Setiap kejadian distribusi tercatat dengan tx hash yang tak bisa diubah.",
  },
  {
    icon: QrCode,
    title: "Pelacakan QR",
    desc: "Konsumen memindai QR untuk melihat seluruh perjalanan produk secara instan.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Real-time",
    desc: "Pantau statistik rantai pasok, status produk, dan aktivitas terbaru.",
  },
];

const ROLES = [
  { icon: Sprout, label: "Petani", desc: "Catat lahan & panen" },
  { icon: Truck, label: "Distributor", desc: "Perbarui logistik" },
  { icon: Store, label: "Retail", desc: "Konfirmasi penerimaan" },
  { icon: QrCode, label: "Konsumen", desc: "Lacak asal produk" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand" />
              Web3 · Polygon · Supply Chain
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Transparansi rantai pasok{" "}
              <span className="text-primary">hasil pertanian</span> lokal.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              AgriChain mencatat perjalanan setiap produk — dari lahan petani,
              proses distribusi, hingga ke tangan konsumen — dengan jejak yang
              terverifikasi dan transparan.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Mulai sekarang <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/track">
                  <QrCode className="size-4" /> Lacak produk
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary">
                <f.icon className="size-5 text-brand" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-card-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Satu rantai, empat peran
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Setiap aktor punya akses dan tanggung jawab sesuai perannya.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-secondary">
                <r.icon className="size-5 text-primary" />
              </span>
              <div>
                <p className="font-semibold text-card-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-primary px-8 py-14 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-primary-foreground md:text-3xl">
            Mulai catat panen Anda di blockchain
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80">
            Gabung sebagai petani, distributor, atau konsumen dan bawa
            transparansi ke rantai pasok pangan.
          </p>
          <div className="mt-7">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Buat akun gratis <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-primary" />
            <span className="font-semibold text-foreground">AgriChain</span>
          </div>
          <p className="font-mono text-xs">© {new Date().getFullYear()} AgriChain</p>
        </div>
      </footer>
    </div>
  );
}
