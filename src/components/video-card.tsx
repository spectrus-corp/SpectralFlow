import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MoreVertical,
  Trash2,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { extractYouTubeId, youTubeThumbnail } from "@/lib/youtube";
import { incrementViews, toggleLike, type FeedPost } from "@/lib/posts";
import { VideoPlayer } from "./video-player";
import { HeartBurst, type BurstPoint } from "./heart-burst";

interface Props {
  post: FeedPost;
  active: boolean;
  nearby?: boolean;
  onChange: () => void;
}

/**
 * Single full-screen video card in the immersive feed.
 * - autoplay when in view (active)
 * - double-tap to like (heart burst)
 * - side actions: like / comment / share / views
 * - comment drawer + delete (own posts)
 */
export function VideoCard({ post, active, nearby, onChange }: Props) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [bursts, setBursts] = useState<BurstPoint[]>([]);
  const [showComments, setShowComments] = useState(false);
  const tapTimer = useRef<number | null>(null);
  const burstId = useRef(0);

  useEffect(() => {
    setLiked(post.liked);
    setLikeCount(post.likeCount);
  }, [post.liked, post.likeCount]);

  const ytId = extractYouTubeId(post.youtube_url);
  const isVideo = post.media_type === "video" && !!post.media_url;
  const isYouTube = post.media_type === "youtube" && !!ytId;
  const isMine = user?.id === post.user_id;

  const handleLike = useCallback(async () => {
    if (!user) {
      toast.error("Connecte-toi pour liker");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, user.id, liked);
    } catch (e) {
      setLiked(liked);
      setLikeCount(post.likeCount);
      toast.error("Action impossible");
    }
  }, [liked, post.id, post.likeCount, user]);

  const triggerHeartAt = (x: number, y: number) => {
    const id = ++burstId.current;
    setBursts((b) => [...b, { id, x, y }]);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // detect double tap
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      const rect = e.currentTarget.getBoundingClientRect();
      triggerHeartAt(e.clientX - rect.left, e.clientY - rect.top);
      if (!liked) handleLike();
    } else {
      tapTimer.current = window.setTimeout(() => {
        tapTimer.current = null;
      }, 280);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const shareData = { title: "SpectralFlow", text: post.content ?? "Regarde ce post", url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user cancelled */
      }
    }
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

  const onFirstPlay = () => {
    incrementViews(post.id).catch(() => {});
  };

  const poster = post.thumbnail_url ?? (ytId ? youTubeThumbnail(ytId) : null);
  const name = post.profile?.display_name || post.profile?.username || "anon";
  const initial = name.charAt(0).toUpperCase();

  return (
    <section
      className="relative h-[calc(100svh-4rem)] md:h-[calc(100svh-3rem)] w-full snap-start snap-always overflow-hidden bg-black"
      aria-label={`Post de ${name}`}
    >
      {/* Player layer — wrapped so taps register */}
      <div
        className="absolute inset-0"
        onClick={handleTap}
        onDoubleClick={(e) => e.preventDefault()}
      >
        {isVideo ? (
          <VideoPlayer
            kind="video"
            src={post.media_url!}
            active={active}
            nearby={nearby}
            poster={poster}
            onFirstPlay={onFirstPlay}
          />
        ) : isYouTube ? (
          <VideoPlayer
            kind="youtube"
            ytId={ytId!}
            active={active}
            nearby={nearby}
            poster={poster}
            onFirstPlay={onFirstPlay}
          />
        ) : (
          <TextOnlyHero post={post} />
        )}
      </div>

      {/* Heart bursts */}
      <HeartBurst points={bursts} onDone={(id) => setBursts((b) => b.filter((p) => p.id !== id))} />

      {/* Top fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/60 to-transparent" />

      {/* Right action rail */}
      <aside className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5 text-white">
        <ActionButton
          icon={<Heart className={`h-7 w-7 ${liked ? "fill-primary text-primary" : ""}`} />}
          label={formatCount(likeCount)}
          onClick={handleLike}
          active={liked}
        />
        <ActionButton
          icon={<MessageCircle className="h-7 w-7" />}
          label={formatCount(post.commentCount)}
          onClick={() => setShowComments(true)}
        />
        <ActionButton
          icon={<Share2 className="h-7 w-7" />}
          label="Partager"
          onClick={share}
        />
        <ActionButton
          icon={muted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
          label={muted ? "Muet" : "Son"}
          onClick={onToggleMute}
        />
        <div className="flex flex-col items-center gap-1 text-xs">
          <Eye className="h-5 w-5 opacity-70" />
          {formatCount(post.views)}
        </div>
        {isMine && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-full bg-black/40 p-2 backdrop-blur-xl"
                aria-label="Plus d'options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={remove} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </aside>

      {/* Bottom info overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-24 pt-16 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary">
            <AvatarImage src={post.profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">@{post.profile?.username}</p>
            <p className="text-xs opacity-70">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        {post.content && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed drop-shadow-md">
            {post.content}
          </p>
        )}
        {(isVideo || isYouTube) && (
          <div className="mt-3 flex items-center gap-2 text-xs opacity-80">
            <Music2 className="h-3.5 w-3.5" />
            <span className="truncate">
              {isYouTube ? "YouTube · son original" : "Audio original"}
            </span>
          </div>
        )}
      </div>

      <CommentsDrawer
        open={showComments}
        onOpenChange={setShowComments}
        postId={post.id}
        onChange={onChange}
      />
    </section>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-xs transition-transform active:scale-90"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-xl ${
          active ? "bg-primary/20" : "bg-black/40"
        }`}
      >
        {icon}
      </span>
      <span className="drop-shadow-md">{label}</span>
    </button>
  );
}

function TextOnlyHero({ post }: { post: FeedPost }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-grid bg-gradient-to-br from-background via-background to-card px-8">
      <p className="max-w-md text-center text-2xl font-semibold leading-snug text-foreground">
        {post.content}
      </p>
    </div>
  );
}

function CommentsDrawer({
  open,
  onOpenChange,
  postId,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  postId: string;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<
    { id: string; content: string; created_at: string; profile: { username: string; avatar_url: string | null } | null }[]
  >([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("id,content,created_at,profile:profiles(username,avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data as any) ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const send = async () => {
    if (!user || !text.trim()) return;
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: user.id, content: text.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    await load();
    onChange();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70svh] rounded-t-3xl border-primary/30 bg-card">
        <SheetHeader>
          <SheetTitle>Commentaires</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex h-[calc(70svh-9rem)] flex-col gap-3 overflow-y-auto pr-1">
          {loading && <p className="text-center text-sm text-muted-foreground">Chargement…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Aucun commentaire. Lance la conversation.
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/15 text-primary">
                  {(c.profile?.username || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-2xl bg-background/60 px-3 py-2">
                <p className="text-xs font-semibold text-primary">@{c.profile?.username}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <label htmlFor={`comment-input-${postId}`} className="sr-only">
            Ajouter un commentaire
          </label>
          <Input
            id={`comment-input-${postId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ajouter un commentaire…"
            aria-label="Ajouter un commentaire"
          />
          <Button onClick={send} className="neon-glow">
            Envoyer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "") + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}
