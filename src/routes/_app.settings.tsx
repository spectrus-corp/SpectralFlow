import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Globe, LogOut, Moon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Paramètres — SpectralFlow" },
      {
        name: "description",
        content:
          "Gère ton compte SpectralFlow : mot de passe, langue, apparence et déconnexion.",
      },
      { property: "og:title", content: "Paramètres — SpectralFlow" },
      {
        property: "og:description",
        content: "Préférences du compte SpectralFlow.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/settings" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/settings" }],
  }),
});

function SettingsPage() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState("fr");

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("6 caractères minimum");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour");
      setNewPassword("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Card title="Compte" icon={ShieldCheck}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="np">Nouveau mot de passe</Label>
          <div className="flex gap-2">
            <Input
              id="np"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button onClick={updatePassword} disabled={busy}>
              Changer
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Apparence" icon={Moon}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Mode sombre</p>
            <p className="text-xs text-muted-foreground">
              Toujours actif — l'identité visuelle de SpectralFlow.
            </p>
          </div>
          <Switch checked disabled />
        </div>
      </Card>

      <Card title="Langue" icon={Globe}>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-48" aria-label="Sélection de la langue">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card title="Session" icon={LogOut}>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </Card>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}
