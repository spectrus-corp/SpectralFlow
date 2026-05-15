/**
 * YouTube helpers — extract IDs and build embed URLs (incl. autoplay/mute params).
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(embed|shorts|v)\/([^/?#]+)/);
      if (m) return m[2];
    }
    return null;
  } catch {
    return null;
  }
}

export function youTubeEmbedUrl(
  id: string,
  opts: { autoplay?: boolean; mute?: boolean; controls?: boolean; loop?: boolean } = {},
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    autoplay: opts.autoplay ? "1" : "0",
    mute: opts.mute ? "1" : "0",
    controls: opts.controls === false ? "0" : "1",
  });
  if (opts.loop) {
    params.set("loop", "1");
    params.set("playlist", id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
