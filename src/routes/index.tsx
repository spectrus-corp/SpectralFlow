import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Zap, Radio, MessageCircle, Youtube } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "SpectralFlow — Flux vidéo cyberpunk & chat temps réel" },
      {
        name: "keywords",
        content:
          "SpectralFlow, réseau social vidéo, flux immersif, chat privé, communauté cyberpunk, partage YouTube, abonnements créateurs, vidéos courtes",
      },
      {
        name: "description",
        content:
          "Rejoins SpectralFlow, le réseau social cyberpunk pour la génération vidéo : flux immersif, publication YouTube instantanée, abonnements créateurs et chat en temps réel.",
      },
      {
        property: "og:title",
        content: "SpectralFlow — Flux vidéo cyberpunk & chat temps réel",
      },
      {
        property: "og:description",
        content:
          "Le réseau social hybride pour la génération vidéo : flux immersif, YouTube et chat temps réel.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://spectralflow.lovable.app/icon.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://spectralflow.lovable.app/icon.svg" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: "https://spectralflow.lovable.app/",
          name: "SpectralFlow",
          description:
            "SpectralFlow est un réseau social vidéo cyberpunk avec un flux immersif, partage YouTube instantané et chat temps réel.",
          publisher: {
            "@type": "Organization",
            name: "SpectralFlow",
            url: "https://spectralflow.lovable.app/",
          },
        }),
      },
    ],
  }),
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
          Le réseau social <span className="gradient-text">cyberpunk</span> pour la génération
          vidéo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Un flux immersif. Tes vidéos YouTube en un coller-poser. Du chat temps réel. Tout ça dans
          une esthétique néon qui fait vibrer les rétines.
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
            {
              icon: Youtube,
              title: "YouTube intégré",
              desc: "Colle un lien, on l'embed instantanément dans le flux.",
            },
            {
              icon: Radio,
              title: "Flux immersif",
              desc: "Posts, likes, commentaires — un fil vivant et continu.",
            },
            {
              icon: MessageCircle,
              title: "Chat temps réel",
              desc: "Discussions privées synchronisées à la milliseconde.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur transition hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 rounded-3xl border border-border bg-card/50 p-8 shadow-[0_0_40px_rgba(14,116,195,0.08)]">
          <h2 className="text-2xl font-semibold">Un réseau social cyberpunk conçu pour la vidéo</h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            SpectralFlow place le contenu vidéo et la communauté au cœur de l'expérience. Publie tes
            stories et tes clips, suis tes créateurs favoris, réagis avec des likes et des
            commentaires, puis discute instantanément en messages privés.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Publie ton contenu",
                description:
                  "Upload des vidéos ou partage une URL YouTube pour t'exposer à une audience active et engagée.",
              },
              {
                title: "Suis tes créateurs",
                description:
                  "Abonne-toi à des profils, reçois leurs nouveaux posts et garde une longueur d'avance sur les tendances.",
              },
              {
                title: "Chat instantané",
                description:
                  "Discute en direct avec la communauté ou tes amis pour faire évoluer chaque publication en vraie conversation.",
              },
              {
                title: "Communautés et hubs",
                description:
                  "Rejoins des espaces de discussion, trouve des groupes de fans et participe à des événements privés.",
              },
              {
                title: "Collections & favoris",
                description:
                  "Enregistre tes vidéos préférées pour les retrouver facilement dans ton espace personnel.",
              },
              {
                title: "Interface immersive",
                description:
                  "Explore un flux vidéo en plein écran avec un design neon qui fait vibrer ton écran comme une vraie expérience showroom.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-border bg-background/80 p-5"
              >
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
