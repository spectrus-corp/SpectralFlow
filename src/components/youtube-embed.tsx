import { youTubeEmbedUrl } from "@/lib/youtube";

export function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
      <iframe
        src={youTubeEmbedUrl(id)}
        title={title ?? "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
