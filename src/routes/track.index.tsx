import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Search } from "lucide-react";

export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Lacak Produk — AgriChain" },
      {
        name: "description",
        content: "Masukkan kode produk untuk melihat asal, tanggal panen, dan riwayat distribusi.",
      },
    ],
  }),
  component: TrackSearch,
});

function TrackSearch() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (c) navigate({ to: "/track/$code", params: { code: c } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-secondary">
          <QrCode className="size-7 text-primary" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
          Lacak asal produk
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Masukkan kode produk (mis. <span className="font-mono">PAD-2026-1234</span>) untuk
          melihat perjalanan lengkapnya dari lahan ke konsumen.
        </p>
        <form onSubmit={submit} className="mt-8 flex w-full gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Kode produk"
            className="font-mono"
          />
          <Button type="submit">
            <Search className="size-4" /> Lacak
          </Button>
        </form>
      </div>
    </div>
  );
}
