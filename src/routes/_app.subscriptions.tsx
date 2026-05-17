import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/subscriptions")({
  component: SubscriptionsPage,
  head: () => ({
    meta: [
      { title: "Abonnements — SpectralFlow" },
      {
        name: "description",
        content: "Gère tes abonnements SpectralFlow et découvre les créateurs que tu suis.",
      },
      { property: "og:title", content: "Abonnements — SpectralFlow" },
      {
        property: "og:description",
        content: "Gère tes abonnements et les profils que tu suis sur SpectralFlow.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/subscriptions" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/subscriptions" }],
  }),
});

function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<
    {
      target_id: string;
      profile: { username: string; display_name: string | null; avatar_url: string | null } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "target_id,profile:profiles!subscriptions_target_id_fkey(username,display_name,avatar_url)",
      )
      .eq("subscriber_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSubscriptions(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const unsubscribe = async (targetId: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .match({ subscriber_id: user?.id, target_id: targetId });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Désabonné");
    setSubscriptions((prev) => prev.filter((item) => item.target_id !== targetId));
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center text-muted-foreground">
        Connecte-toi pour gérer tes abonnements.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold">Abonnements</h1>
        <p className="text-sm text-muted-foreground">
          Ta liste de créateurs suivis, avec la possibilité de te désabonner à tout moment.
        </p>
      </div>
      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
            Tu n'es abonné à personne pour l'instant.
          </div>
        ) : (
          subscriptions.map((subscription) => {
            const profile = subscription.profile;
            const username = profile?.username ?? "inconnu";
            return (
              <div
                key={subscription.target_id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{profile?.display_name || username}</p>
                    <p className="text-xs text-muted-foreground">@{username}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => unsubscribe(subscription.target_id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Se désabonner
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
