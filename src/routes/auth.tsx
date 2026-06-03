import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/schemas";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — AgriChain" },
      { name: "description", content: "Masuk ke AgriChain atau daftar sebagai petani, distributor, atau konsumen." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoginError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
    });
    if (error) {
      setBusy(false);
      const message = error.message.includes("Invalid login credentials")
        ? "Email atau kata sandi tidak cocok."
        : error.message.includes("Email not confirmed")
          ? "Email belum terverifikasi. Silakan cek email verifikasi Anda."
          : error.message;
      setLoginError(message);
      return toast.error("Gagal masuk", { description: message });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    setBusy(false);
    if (userError || !userData.user) {
      const message = "Sesi login belum valid. Coba masuk kembali.";
      setLoginError(message);
      return toast.error("Gagal masuk", { description: message });
    }

    toast.success("Berhasil masuk");
    navigate({ to: "/dashboard", replace: true });
  }

  const [role, setRole] = useState<AppRole>("petani");

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoginError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: {
          full_name: String(fd.get("full_name")),
          region: String(fd.get("region") || ""),
          phone: String(fd.get("phone") || ""),
          role,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error("Gagal mendaftar", { description: error.message });
    if (data.session) {
      toast.success("Akun dibuat, selamat datang!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Akun dibuat", { description: "Silakan masuk dengan akun Anda." });
    }
  }

  async function handleGoogle() {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (error) toast.error("Gagal masuk dengan Google", { description: error.message });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary">
            <Leaf className="size-5 text-brand" />
          </span>
          <span className="text-lg font-semibold uppercase tracking-tight text-primary">
            AgriChain
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Kata sandi</Label>
                  <Input id="login-password" name="password" type="password" required autoComplete="current-password" />
                </div>
                {loginError ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {loginError}
                  </p>
                ) : null}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Memproses…" : "Masuk"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nama lengkap</Label>
                  <Input id="su-name" name="full_name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-role">Peran</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger id="su-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APP_ROLES.filter((r) => r !== "admin").map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="su-region">Wilayah</Label>
                    <Input id="su-region" name="region" placeholder="mis. Bandung" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-phone">Telepon</Label>
                    <Input id="su-phone" name="phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Kata sandi</Label>
                  <Input id="su-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Memproses…" : "Buat akun"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> atau <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            Lanjutkan dengan Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}
