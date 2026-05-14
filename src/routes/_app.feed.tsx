import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CreatePost } from "@/components/create-post";
import { PostCard, type PostWithMeta } from "@/components/post-card";

export const Route = createFileRoute("/_app/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: rawPosts } = await supabase
      .from("posts")
      .select("id,user_id,content,youtube_url,created_at,profile:profiles(username,display_name,avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    const ids = (rawPosts ?? []).map((p) => p.id);
    const [likesRes, commentsRes] = await Promise.all([
      supabase.from("likes").select("post_id,user_id").in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("comments").select("post_id").in("post_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const likesByPost = new Map<string, { count: number; mine: boolean }>();
    for (const l of likesRes.data ?? []) {
      const cur = likesByPost.get(l.post_id) ?? { count: 0, mine: false };
      cur.count++;
      if (l.user_id === user.id) cur.mine = true;
      likesByPost.set(l.post_id, cur);
    }
    const commentsByPost = new Map<string, number>();
    for (const c of commentsRes.data ?? []) {
      commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) ?? 0) + 1);
    }

    setPosts(
      (rawPosts ?? []).map((p) => ({
        ...p,
        profile: p.profile as any,
        likeCount: likesByPost.get(p.id)?.count ?? 0,
        liked: likesByPost.get(p.id)?.mine ?? false,
        commentCount: commentsByPost.get(p.id) ?? 0,
      })),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: refresh on any post/like/comment change
  useEffect(() => {
    const channel = supabase
      .channel("feed-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Flux</h1>
        <p className="text-sm text-muted-foreground">Le pouls de SpectralFlow.</p>
      </div>
      <CreatePost onPosted={load} />
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Le flux est silencieux. Sois le premier à publier.
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)
      )}
    </div>
  );
}
