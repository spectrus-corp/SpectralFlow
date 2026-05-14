/**
 * Extract a YouTube video ID from a variety of URL formats.
 * Returns null if no valid id is found.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
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

export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}?rel=0`;
}
