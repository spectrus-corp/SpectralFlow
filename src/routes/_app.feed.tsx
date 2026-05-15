import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CreateVideoComposer } from "@/components/create-post";
import { VideoCard } from "@/components/video-card";
import { fetchFeedPosts, type FeedPost } from "@/lib/posts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const addPost = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const load = useCallback(async () => {
    try {
      const feedPosts = await fetchFeedPosts(user?.id ?? null, { limit: 50 });
      setPosts(feedPosts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime feed updates
  useEffect(() => {
    const channel = supabase
      .channel("feed-immersive")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // IntersectionObserver — track which video is in view
  useEffect(() => {
    if (!containerRef.current || posts.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [posts]);

  if (loading) {
    return (
      <div className="flex h-[calc(100svh-3rem)] items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-[calc(100svh-3rem)] flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-card px-6 text-center">
        <Sparkles className="h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">
          Le flux est <span className="gradient-text">vide</span>
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sois le premier à publier une vidéo dans SpectralFlow.
        </p>
        <Button onClick={() => setComposerOpen(true)} className="neon-glow">
          <Plus className="mr-2 h-4 w-4" /> Créer un post
        </Button>
        <CreateVideoComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onPosted={load}
        />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100svh-3rem)] w-full bg-black">
      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {posts.map((post, idx) => (
          <div
            key={post.id}
            data-idx={idx}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
          >
            <VideoCard
              post={post}
              active={idx === activeIdx}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onChange={load}
            />
          </div>
        ))}
      </div>

      {/* Floating create button */}
      <button
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-transform hover:scale-110 active:scale-95"
        aria-label="Créer un post"
      >
        <Plus className="h-7 w-7" />
      </button>

      <CreateVideoComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={load}
      />
    </div>
  );
}
