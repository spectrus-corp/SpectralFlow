import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Bookmark } from "lucide-react";
import { fetchPostById, type FeedPost } from "@/lib/posts";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/bookmarks")({
  component: BookmarksPage,
  head: () => ({
    meta: [
      { title: "Favoris — SpectralFlow" },
      {
        name: "description",
        content: "Retrouve et organise les posts que tu as sauvegardés dans ton espace Favoris.",
      },
      { property: "og:title", content: "Favoris — SpectralFlow" },
      {
        property: "og:description",
        content: "Un espace dédié pour consulter rapidement tes contenus sauvegardés.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/bookmarks" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/bookmarks" }],
  }),
});

function BookmarksPage() {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("sf:bookmarks");
    try {
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setIds(parsed.filter(Boolean));
    } catch {
      setIds([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (ids.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const fetched = await Promise.all(ids.map((id) => fetchPostById(id, user?.id ?? null)));
      setPosts(fetched.filter(Boolean) as FeedPost[]);
      setLoading(false);
    };
    load();
  }, [ids, user]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-border bg-card/70 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Favoris</p>
            <h1 className="text-3xl font-bold tracking-tight">Tes contenus enregistrés</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Retrouve ici tous les posts que tu as mis de côté depuis le flux.
            </p>
          </div>
          <Button asChild>
            <Link to="/discover">Explorer de nouveaux contenus</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {loading ? (
          <div className="flex justify-center rounded-3xl border border-border bg-background/80 p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-border bg-background/80 p-12 text-center">
            <Bookmark className="mx-auto mb-4 h-10 w-10 text-primary" />
            <p className="text-lg font-semibold">Aucun favori pour l’instant</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sauvegarde tes meilleurs posts depuis le flux pour les retrouver plus tard.
            </p>
            <Button asChild className="mt-6 neon-glow">
              <Link to="/feed">Retour au flux</Link>
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-border bg-background/80 p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{post.profile?.username}</p>
                  <h2 className="text-lg font-semibold">{post.content ?? "Contenu sauvegardé"}</h2>
                </div>
                <Link
                  to={`/post/${post.id}`}
                  className="rounded-full border border-border bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/20"
                >
                  Voir le post
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
