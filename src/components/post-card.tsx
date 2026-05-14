import { useState } from "react";
import { Heart, MessageCircle, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractYouTubeId } from "@/lib/youtube";
import { YouTubeEmbed } from "./youtube-embed";

export interface PostWithMeta {
  id: string;
  user_id: string;
  content: string | null;
  youtube_url: string | null;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  likeCount: number;
  liked: boolean;
  commentCount: number;
}

export function PostCard({ post, onChange }: { post: PostWithMeta; onChange: () => void }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<
    { id: string; content: string; user_id: string; created_at: string; profile: { username: string } | null }[]
  >([]);
  const [newComment, setNewComment] = useState("");
  const ytId = extractYouTubeId(post.youtube_url);
  const isMine = user?.id === post.user_id;

  const toggleLike = async () => {
    if (!user) return;
    if (post.liked) {
      await supabase.from("likes").delete().match({ post_id: post.id, user_id: user.id });
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: user.id });
    }
    onChange();
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id,content,user_id,created_at,profile:profiles(username)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments((data as any) ?? []);
  };

  const handleToggleComments = async () => {
    if (!showComments) await loadComments();
    setShowComments((s) => !s);
  };

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewComment("");
    await loadComments();
    onChange();
  };

  const share = async () => {
    const url = `${window.location.origin}/feed#post-${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const remove = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Post supprimé");
      onChange();
    }
  };

  const name = post.profile?.display_name || post.profile?.username || "anon";
  const initial = name.charAt(0).toUpperCase();

  return (
    <article
      id={`post-${post.id}`}
      className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl transition hover:border-primary/30"
    >
      <header className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
          <AvatarImage src={post.profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/15 text-primary">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">
            @{post.profile?.username} ·{" "}
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
          </p>
        </div>
        {isMine && (
          <Button variant="ghost" size="icon" onClick={remove} aria-label="Supprimer">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </header>

      {post.content && (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</p>
      )}

      {ytId && (
        <div className="mt-3">
          <YouTubeEmbed id={ytId} />
        </div>
      )}

      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLike}
          className={post.liked ? "text-primary" : ""}
        >
          <Heart className={`mr-1.5 h-4 w-4 ${post.liked ? "fill-primary" : ""}`} />
          {post.likeCount}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggleComments}>
          <MessageCircle className="mr-1.5 h-4 w-4" />
          {post.commentCount}
        </Button>
        <Button variant="ghost" size="sm" onClick={share}>
          <Share2 className="mr-1.5 h-4 w-4" />
          Partager
        </Button>
      </footer>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-background/60 px-3 py-2">
              <p className="text-xs font-semibold text-primary">@{c.profile?.username}</p>
              <p className="text-sm">{c.content}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              onKeyDown={(e) => {
                if (e.key === "Enter") submitComment();
              }}
            />
            <Button onClick={submitComment}>Envoyer</Button>
          </div>
        </div>
      )}
    </article>
  );
}
