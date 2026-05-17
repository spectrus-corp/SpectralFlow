import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { fetchPostById, type FeedPost } from "@/lib/posts";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/post/$postId")({
  component: PostPage,
  head: ({ params }) => ({
    meta: [
      { title: `Post — SpectralFlow` },
      {
        name: "description",
        content:
          "Regarde ce post vidéo partagé sur SpectralFlow, le réseau social cyberpunk pour la génération vidéo.",
      },
      { property: "og:title", content: "Post vidéo — SpectralFlow" },
      {
        property: "og:description",
        content: "Vidéo partagée sur SpectralFlow — flux immersif type TikTok.",
      },
      { property: "og:type", content: "article" },
      {
        property: "og:url",
        content: `https://spectralflow.lovable.app/post/${params.postId}`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://spectralflow.lovable.app/post/${params.postId}`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SocialMediaPosting",
          url: `https://spectralflow.lovable.app/post/${params.postId}`,
          identifier: params.postId,
          publisher: { "@type": "Organization", name: "SpectralFlow" },
        }),
      },
    ],
  }),
});

function PostPage() {
  const { postId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  

  const load = async () => {
    try {
      const p = await fetchPostById(postId, user?.id ?? null);
      setPost(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user]);

  if (loading) {
    return (
      <div className="flex h-[calc(100svh-3rem)] items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-[calc(100svh-3rem)] flex-col items-center justify-center gap-4 bg-black text-center">
        <p className="text-lg text-muted-foreground">Post introuvable.</p>
        <Button asChild>
          <Link to="/feed">Retour au flux</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100svh-3rem)] w-full bg-black">
      <h1 className="sr-only">Post vidéo SpectralFlow</h1>
      <button
        onClick={() => navigate({ to: "/feed" })}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xl"
        aria-label="Retour"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <VideoCard post={post} active onChange={load} />
    </div>
  );
}
