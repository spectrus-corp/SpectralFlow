import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Zap, Radio, MessageCircle, Youtube } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen" />;
  if (user) return <Navigate to="/feed" />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground neon-glow">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Spectral<span className="text-neon">Flow</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Connexion</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Rejoindre</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
        <h1 className="max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Le réseau social <span className="gradient-text">cyberpunk</span> pour la génération vidéo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Un flux immersif. Tes vidéos YouTube en un coller-poser. Du chat temps réel.
          Tout ça dans une esthétique néon qui fait vibrer les rétines.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="neon-glow">
            <Link to="/signup">Créer mon compte</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">J'ai déjà un compte</Link>
          </Button>
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: Youtube, title: "YouTube intégré", desc: "Colle un lien, on l'embed instantanément dans le flux." },
            { icon: Radio, title: "Flux immersif", desc: "Posts, likes, commentaires — un fil vivant et continu." },
            { icon: MessageCircle, title: "Chat temps réel", desc: "Discussions privées synchronisées à la milliseconde." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur transition hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
