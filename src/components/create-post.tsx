import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Youtube, UploadCloud, X, Video } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { extractYouTubeId, youTubeThumbnail } from "@/lib/youtube";
import { publishPost, uploadVideo, generateThumbnail } from "@/lib/posts";

const ytSchema = z.object({
  content: z.string().max(500).optional(),
  youtubeUrl: z.string().min(1, "Colle un lien YouTube"),
});

const uploadSchema = z.object({
  content: z.string().max(500).optional(),
});

type YTForm = z.infer<typeof ytSchema>;
type UploadForm = z.infer<typeof uploadSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
}

/** Floating composer that supports YouTube embeds + direct video upload. */
export function CreateVideoComposer({ open, onClose, onPosted }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-lg rounded-t-3xl border border-primary/30 bg-card p-6 shadow-2xl sm:rounded-3xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-xl font-bold">
          Nouveau <span className="gradient-text">post</span>
        </h2>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="youtube">
              <Youtube className="mr-2 h-4 w-4" /> YouTube
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <UploadForm
              onPosted={() => {
                onPosted?.();
                onClose();
              }}
            />
          </TabsContent>
          <TabsContent value="youtube" className="mt-4">
            <YouTubeForm
              onPosted={() => {
                onPosted?.();
                onClose();
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UploadForm({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbDataUrl, setThumbDataUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadForm>({ resolver: zodResolver(uploadSchema) });

  const pickFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("video/")) {
      toast.error("Format vidéo non supporté");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error("Vidéo > 100 Mo");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    const thumb = await generateThumbnail(f);
    if (thumb) {
      setThumbDataUrl(thumb.dataUrl);
      setAspect(thumb.aspect);
    }
  }, []);

  const onSubmit = async (data: UploadForm) => {
    if (!user || !file) {
      toast.error("Sélectionne une vidéo");
      return;
    }
    setSubmitting(true);
    try {
      const { url } = await uploadVideo(user.id, file, setProgress);
      await publishPost(user.id, {
        content: data.content,
        mediaUrl: url,
        mediaType: "video",
        thumbnailUrl: thumbDataUrl,
        aspectRatio: aspect,
      });
      toast.success("Vidéo publiée !");
      onPosted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {!previewUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-background/40 text-muted-foreground transition hover:border-primary hover:bg-primary/5"
        >
          <Video className="h-10 w-10 text-primary" />
          <p className="text-sm">Glisse ou clique pour uploader</p>
          <p className="text-xs">MP4, WebM, MOV — 100 Mo max</p>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
          <video src={previewUrl} controls className="aspect-video w-full" />
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
              setThumbDataUrl(null);
            }}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
      />
      <Textarea
        rows={2}
        placeholder="Légende (optionnelle)…"
        className="resize-none"
        {...register("content")}
      />
      {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      {submitting && progress > 0 && <Progress value={progress} className="h-1" />}
      <Button type="submit" disabled={submitting || !file} className="w-full neon-glow">
        <Send className="mr-2 h-4 w-4" />
        {submitting ? "Publication…" : "Publier"}
      </Button>
    </form>
  );
}

function YouTubeForm({ onPosted }: { onPosted: () => void }) {
