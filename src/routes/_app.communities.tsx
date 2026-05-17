import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Globe, Handshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/communities")({
  component: CommunitiesPage,
  head: () => ({
    meta: [
      { title: "Communautés — SpectralFlow" },
      {
        name: "description",
        content:
          "Découvre et rejoins des communautés thématiques qui rassemblent les meilleurs créateurs et fans.",
      },
      { property: "og:title", content: "Communautés — SpectralFlow" },
      {
        property: "og:description",
        content:
          "Rejoins des hubs de discussion, des groupes et des événements autour de tes passions.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/communities" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/communities" }],
  }),
});

const groups = [
  {
    title: "Cyberpunk Creators",
    members: 2874,
    description: "Créateurs, musiciens et storytellers du futur.",
    icon: Users,
  },
  {
    title: "Live Sessions",
    members: 1592,
    description: "Tout ce qui est stream, chill et sessions en direct.",
    icon: Globe,
  },
  {
    title: "Beatmakers",
    members: 1320,
    description: "Musique, playlists et vibes électroniques.",
    icon: Sparkles,
  },
  {
    title: "Story Lab",
    members: 1043,
    description: "Histoires éphémères, threads et mini-séries.",
    icon: Handshake,
  },
];

function CommunitiesPage() {
  const [joined, setJoined] = useState<string[]>([]);

  const toggleJoin = (title: string) => {
    setJoined((prev) => {
      const next = prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title];
      toast.success(
        prev.includes(title) ? "Tu as quitté la communauté" : "Tu as rejoint la communauté",
      );
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="rounded-3xl border border-border bg-card/70 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Communautés</p>
            <h1 className="text-3xl font-bold tracking-tight">
              Rejoins des hubs qui te ressemblent
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              SpectralFlow rassemble les espaces de discussion, les studios de création et les
              événements en un seul point.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-background/90 p-4">
              <p className="text-sm font-semibold">+ 120 hubs actifs</p>
              <p className="text-xs text-muted-foreground">
                Musique, gaming, art et live sessions.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background/90 p-4">
              <p className="text-sm font-semibold">Chats de groupe intégrés</p>
              <p className="text-xs text-muted-foreground">
                Discussion privée ou ouverte selon ton style.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <article
            key={group.title}
            className="rounded-3xl border border-border bg-background/90 p-6 shadow-sm transition hover:border-primary"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <group.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {group.members.toLocaleString()} membres
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-foreground">{group.description}</p>
            <Button
              onClick={() => toggleJoin(group.title)}
              className="mt-6 neon-glow"
              variant={joined.includes(group.title) ? "outline" : "secondary"}
            >
              {joined.includes(group.title) ? "Quitter" : "Rejoindre"}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
