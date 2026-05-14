import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const schema = z.object({
  username: z
    .string()
    .min(3, "3 caractères min")
    .max(24, "24 caractères max")
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres ou _"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
});
type FormData = z.infer<typeof schema>;

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/feed" });
  }, [user, authLoading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: { username: data.username, display_name: data.username },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bienvenue dans SpectralFlow !");
    navigate({ to: "/feed" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-xl neon-glow">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">
            Spectral<span className="text-neon">Flow</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold">Créer ton identité</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisis un pseudo unique et plonge dans le flux.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Pseudo</Label>
            <Input id="username" placeholder="neon_runner" {...register("username")} />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full neon-glow" disabled={submitting}>
            {submitting ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
