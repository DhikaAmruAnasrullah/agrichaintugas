import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Leaf, Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";

export function Navbar() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<string | null>(null);

  async function connectWallet() {
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum;
    if (!eth) {
      toast.error("MetaMask tidak terdeteksi", {
        description: "Pasang ekstensi MetaMask untuk menghubungkan dompet.",
      });
      return;
    }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) {
        setWallet(accounts[0]);
        toast.success("Dompet terhubung");
      }
    } catch {
      toast.error("Gagal menghubungkan dompet");
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary">
              <Leaf className="size-4 text-brand" />
            </span>
            <span className="text-sm font-semibold uppercase tracking-tight text-primary">
              AgriChain
            </span>
          </Link>
          <div className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <Link to="/dashboard" className="transition-colors hover:text-primary">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={connectWallet} className="font-mono text-xs">
            <Wallet className="size-4" />
            {wallet ? `${wallet.slice(0, 5)}…${wallet.slice(-4)}` : "Hubungkan Wallet"}
          </Button>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
              aria-label="Keluar"
            >
              <LogOut className="size-4" />
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
