import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Youtube } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Mon profil — SpectralFlow" },
      {
        name: "description",
        content:
          "Personnalise ton profil SpectralFlow : avatar, bio, chaîne YouTube et identité visuelle.",
      },
      { property: "og:title", content: "Mon profil — SpectralFlow" },
      {
        property: "og:description",
        content: "Gère ton identité publique sur SpectralFlow.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/profile" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/profile" }],
  }),
});

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  youtube_channel: string | null;
}

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ posts: 0, likes: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(data);
    const [{ count: pc }, { count: lc }] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    setStats({ posts: pc ?? 0, likes: lc ?? 0 });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        youtube_channel: profile.youtube_channel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profil mis à jour");
  };

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      toast.error(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    setProfile((p) => (p ? { ...p, avatar_url: data.publicUrl } : p));
    toast.success("Avatar mis à jour");
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const initial = (profile.display_name || profile.username).charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-primary/40">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-2xl text-primary">{initial}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground neon-glow"
              aria-label="Changer l'avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarPick}
            />
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.display_name || profile.username}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <p className="text-2xl font-bold text-neon">{stats.posts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <p className="text-2xl font-bold text-neon">{stats.likes}</p>
            <p className="text-xs text-muted-foreground">Likes envoyés</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Nom affiché</Label>
            <Input
              id="display_name"
              value={profile.display_name ?? ""}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              value={profile.bio ?? ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yt" className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-primary" /> Chaîne YouTube
            </Label>
            <Input
              id="yt"
              placeholder="https://youtube.com/@machaine"
              value={profile.youtube_channel ?? ""}
              onChange={(e) => setProfile({ ...profile, youtube_channel: e.target.value })}
            />
          </div>
          <Button onClick={save} disabled={saving} className="neon-glow">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
