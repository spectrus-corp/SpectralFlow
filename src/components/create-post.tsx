import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Youtube } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { extractYouTubeId } from "@/lib/youtube";
import { YouTubeEmbed } from "./youtube-embed";

const schema = z
  .object({
    content: z.string().max(500, "500 caractères max").optional(),
    youtubeUrl: z.string().optional(),
  })
  .refine((d) => (d.content && d.content.trim().length > 0) || (d.youtubeUrl && d.youtubeUrl.trim().length > 0), {
    message: "Ajoute du texte ou un lien YouTube",
    path: ["content"],
  });

type FormData = z.infer<typeof schema>;

export function CreatePost({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const ytUrl = watch("youtubeUrl");
  const ytId = extractYouTubeId(ytUrl);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    const ytLink = data.youtubeUrl?.trim() || null;
    if (ytLink && !extractYouTubeId(ytLink)) {
      setSubmitting(false);
      toast.error("Lien YouTube invalide");
      return;
    }
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: data.content?.trim() || null,
      youtube_url: ytLink,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    reset();
    onPosted?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-xl"
    >
      <Textarea
        placeholder="Quoi de neuf dans le flux ?"
        rows={3}
        className="resize-none border-0 bg-transparent text-base focus-visible:ring-0"
        {...register("content")}
      />
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-background/50 px-3">
        <Youtube className="h-4 w-4 shrink-0 text-primary" />
        <Input
          placeholder="Coller un lien YouTube..."
          className="border-0 bg-transparent px-0 focus-visible:ring-0"
          {...register("youtubeUrl")}
        />
      </div>
      {ytId && (
        <div className="mt-3">
          <YouTubeEmbed id={ytId} />
        </div>
      )}
      {errors.content && (
        <p className="mt-2 text-xs text-destructive">{errors.content.message}</p>
      )}
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={submitting} className="neon-glow">
          <Send className="mr-2 h-4 w-4" />
          {submitting ? "Envoi..." : "Publier"}
        </Button>
      </div>
    </form>
  );
}
