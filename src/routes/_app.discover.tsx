import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Bookmark, Users, Sparkles, CalendarDays, Video, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/discover")({
  component: DiscoverPage,
  head: () => ({
    meta: [
      { title: "Découvrir — SpectralFlow" },
      {
        name: "description",
        content:
          "Découvre les tendances, les communautés, les lives et les collections de SpectralFlow dans un hub fluide et non intrusif.",
      },
      { property: "og:title", content: "Découvrir — SpectralFlow" },
      {
        property: "og:description",
        content: "Explore les meilleurs posts, groupes, lives et événements sans perdre ton fil.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/discover" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/discover" }],
  }),
});

function DiscoverPage() {
  const trends = ["#Cyberpunk", "#LiveStream", "#MusicFlow", "#Shorts", "#Communauté", "#Mindset"];

  const creators = [
    { name: "NovaRêve", tag: "@novarêve" },
    { name: "PixelSamurai", tag: "@pixelsamurai" },
    { name: "LunaWave", tag: "@lunawave" },
  ];

  const actions = [
    {
      title: "Bookmarkables",
      description: "Sauvegarde tes posts préférés pour les retrouver plus tard.",
      icon: Bookmark,
      href: "/bookmarks",
    },
    {
      title: "Communautés",
      description: "Rejoins des hubs thématiques selon tes passions.",
      icon: Users,
      href: "/communities",
    },
    {
      title: "Lives et événements",
      description: "Suis les diffusions en direct et les studios immersifs.",
      icon: Video,
      href: "/discover",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <section className="rounded-3xl border border-border bg-card/70 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Nouvel espace
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Découvre tout l’univers SpectralFlow
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Un hub léger pour retrouver tes tendances, rejoindre des communautés, suivre des lives
              et sauvegarder tes moments préférés.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="group rounded-3xl border border-border bg-background/90 p-5 transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <action.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold group-hover:text-primary">
                  {action.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-border bg-card/70 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Recherche universelle</h2>
              <p className="text-sm text-muted-foreground">
                Recherche des posts, des créateurs, des hashtags ou des groupes en un seul geste.
              </p>
            </div>
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-wrap gap-3">
            {trends.map((trend) => (
              <button
                key={trend}
                className="rounded-full border border-border bg-background/80 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {trend}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-base font-semibold">Créateurs du moment</h3>
                <p className="text-sm text-muted-foreground">Les stars de la soirée</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {creators.map((creator) => (
                <div
                  key={creator.tag}
                  className="flex items-center justify-between rounded-3xl border border-border bg-background/80 p-4"
                >
                  <div>
                    <p className="font-semibold">{creator.name}</p>
                    <p className="text-sm text-muted-foreground">{creator.tag}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Suivre
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-base font-semibold">À venir</h3>
                <p className="text-sm text-muted-foreground">
                  Lives, annonces et événements exclusifs.
                </p>
              </div>
            </div>
            <ul className="mt-5 space-y-4 text-sm text-muted-foreground">
              <li className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="font-semibold">Soirée beats néon</p>
                <p>Live DJ, chat vocal et partages instantanés.</p>
              </li>
              <li className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="font-semibold">Atelier créateur</p>
                <p>Apprends à booster ton profil et ton engagement.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card/70 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Tout ce qu’il faut pour ne rien manquer</h2>
            <p className="text-sm text-muted-foreground">
              Stories, communautés, bookmarks, événements et chats, sans charger l’interface.
            </p>
          </div>
          <Button asChild>
            <Link to="/bookmarks">Voir mes favoris</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Stories & moments",
              description: "Publie des mini-chroniques éphémères.",
              icon: Video,
            },
            {
              title: "Collections",
              description: "Rassemble tes contenus préférés.",
              icon: Bookmark,
            },
            {
              title: "Hubs de communauté",
              description: "Réunis des fans et des créateurs.",
              icon: Users,
            },
            {
              title: "Chat universel",
              description: "Messages privés, groupes et notifications.",
              icon: Sparkles,
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-border bg-background/80 p-5"
            >
              <feature.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
