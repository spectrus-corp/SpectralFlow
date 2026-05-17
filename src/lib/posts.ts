import { supabase } from "@/integrations/supabase/client";
import { extractYouTubeId } from "@/lib/youtube";

export type MediaType = "text" | "youtube" | "video";

export interface FeedPost {
  id: string;
  user_id: string;
  content: string | null;
  youtube_url: string | null;
  media_url: string | null;
  media_type: MediaType;
  thumbnail_url: string | null;
  views: number;
  aspect_ratio: number | null;
  created_at: string;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  likeCount: number;
  liked: boolean;
  commentCount: number;
  following?: boolean;
}

export interface PublishPostPayload {
  content?: string | null;
  youtubeUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: MediaType;
  thumbnailUrl?: string | null;
  aspectRatio?: number | null;
}

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

/** Posts disappear from the feed after this window (48 hours). */
export const FEED_WINDOW_MS = 48 * 60 * 60 * 1000;

export function isWithinFeedWindow(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < FEED_WINDOW_MS;
}

export async function publishPost(userId: string, payload: PublishPostPayload): Promise<FeedPost> {
  const content = payload.content?.trim() || null;
  const youtube_url = payload.youtubeUrl?.trim() || null;
  const media_url = payload.mediaUrl?.trim() || null;

  let media_type: MediaType = payload.mediaType ?? "text";
  if (!payload.mediaType) {
    if (media_url) media_type = "video";
    else if (youtube_url) media_type = "youtube";
  }

  if (!content && !youtube_url && !media_url) {
    throw new Error("Ajoute du texte, une vidéo ou un lien YouTube avant de publier.");
  }
  if (youtube_url && !extractYouTubeId(youtube_url)) {
    throw new Error("Lien YouTube invalide.");
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content,
      youtube_url,
      media_url,
      media_type,
      thumbnail_url: payload.thumbnailUrl ?? null,
      aspect_ratio: payload.aspectRatio ?? null,
    })
    .select(
      "id,user_id,content,youtube_url,media_url,media_type,thumbnail_url,views,aspect_ratio,created_at,profile:profiles!posts_user_id_fkey(username,display_name,avatar_url)",
    )
    .single();

  if (error) throw error;
  if (!data) throw new Error("Impossible de récupérer le post publié.");

  return {
    id: data.id,
    user_id: data.user_id,
    content: data.content,
    youtube_url: data.youtube_url,
    media_url: data.media_url,
    media_type: (data.media_type ?? "text") as MediaType,
    thumbnail_url: data.thumbnail_url,
    views: data.views ?? 0,
    aspect_ratio: data.aspect_ratio ?? null,
    created_at: data.created_at,
    profile: data.profile,
    likeCount: 0,
    liked: false,
    commentCount: 0,
  };
}

export interface FetchFeedOptions {
  limit?: number;
  videosOnly?: boolean;
}

export async function fetchFeedPosts(
  userId: string | null,
  opts: FetchFeedOptions = {},
): Promise<FeedPost[]> {
  const { limit = 50, videosOnly = false } = opts;
  // Only keep posts published in the last 48 hours
  const since = new Date(Date.now() - FEED_WINDOW_MS).toISOString();
  let query = supabase
    .from("posts")
    .select(
      "id,user_id,content,youtube_url,media_url,media_type,thumbnail_url,views,aspect_ratio,created_at,profile:profiles!posts_user_id_fkey(username,display_name,avatar_url)",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (videosOnly) query = query.in("media_type", ["youtube", "video"]);

  const { data: rawPosts, error } = await query;
  if (error) throw error;

  const posts = (rawPosts ?? []) as any[];
  if (!posts.length) return [];

  const followedIds = new Set<string>();
  if (userId) {
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select("target_id")
      .eq("subscriber_id", userId);
    if (subsError) throw subsError;
    (subs ?? []).forEach((row: { target_id: string }) => followedIds.add(row.target_id));
  }

  const ids = posts.map((p) => p.id);
  const [likesRes, commentsRes] = await Promise.all([
    supabase.from("likes").select("post_id,user_id").in("post_id", ids.length ? ids : [EMPTY_UUID]),
    supabase.from("comments").select("post_id").in("post_id", ids.length ? ids : [EMPTY_UUID]),
  ]);

  const likesByPost = new Map<string, { count: number; mine: boolean }>();
  for (const like of likesRes.data ?? []) {
    const e = likesByPost.get(like.post_id) ?? { count: 0, mine: false };
    e.count += 1;
    if (userId && like.user_id === userId) e.mine = true;
    likesByPost.set(like.post_id, e);
  }
  const commentsByPost = new Map<string, number>();
  for (const c of commentsRes.data ?? []) {
    commentsByPost.set(c.post_id, (commentsByPost.get(c.post_id) ?? 0) + 1);
  }

  return posts.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    youtube_url: p.youtube_url,
    media_url: p.media_url,
    media_type: (p.media_type ?? "text") as MediaType,
    thumbnail_url: p.thumbnail_url,
    views: p.views ?? 0,
    aspect_ratio: p.aspect_ratio,
    created_at: p.created_at,
    profile: p.profile,
    likeCount: likesByPost.get(p.id)?.count ?? 0,
    liked: likesByPost.get(p.id)?.mine ?? false,
    commentCount: commentsByPost.get(p.id) ?? 0,
    following: userId ? followedIds.has(p.user_id) : false,
  }));
}

export async function fetchPostById(id: string, userId: string | null): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,user_id,content,youtube_url,media_url,media_type,thumbnail_url,views,aspect_ratio,created_at,profile:profiles!posts_user_id_fkey(username,display_name,avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [likesRes, commentsRes] = await Promise.all([
    supabase.from("likes").select("user_id").eq("post_id", id),
    supabase.from("comments").select("id").eq("post_id", id),
  ]);

  const likes = likesRes.data ?? [];
  return {
    id: data.id,
    user_id: data.user_id,
    content: data.content,
    youtube_url: data.youtube_url,
    media_url: (data as any).media_url,
    media_type: (((data as any).media_type as MediaType) ?? "text"),
    thumbnail_url: (data as any).thumbnail_url,
    views: (data as any).views ?? 0,
    aspect_ratio: (data as any).aspect_ratio ?? null,
    created_at: data.created_at,
    profile: (data as any).profile,
    likeCount: likes.length,
    liked: !!userId && likes.some((l) => l.user_id === userId),
    commentCount: (commentsRes.data ?? []).length,
    following: false,
  };
}

export async function incrementViews(postId: string) {
  await supabase.rpc("increment_post_views", { p_post_id: postId });
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    await supabase.from("likes").delete().match({ post_id: postId, user_id: userId });
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  }
}

/**
 * Upload a video file to the `videos` bucket under the user's folder.
 * Returns the public URL.
 */
export async function uploadVideo(
  userId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // supabase-js v2 doesn't expose progress events for upload yet; fake-tick if callback provided.
  if (onProgress) onProgress(10);
  const { error } = await supabase.storage.from("videos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || `video/${ext}`,
  });
  if (error) throw error;
  if (onProgress) onProgress(100);

  const { data } = supabase.storage.from("videos").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Generate a thumbnail (data URL) from a local video file (for previews). */
export function generateThumbnail(file: File): Promise<{ dataUrl: string; aspect: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.crossOrigin = "anonymous";
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(1, (video.duration || 1) / 2);
      } catch {
        cleanup();
        resolve(null);
      }
    };
    video.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      const ctx = c.getContext("2d");
      if (!ctx) {
        cleanup();
        return resolve(null);
      }
      ctx.drawImage(video, 0, 0);
      const dataUrl = c.toDataURL("image/jpeg", 0.7);
      cleanup();
      resolve({ dataUrl, aspect: video.videoWidth / video.videoHeight });
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}
