import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Signal perdu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée dans le néant.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Retour au flux
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SpectralFlow — Réseau social cyberpunk" },
      {
        name: "keywords",
        content:
          "SpectralFlow, réseau social vidéo, chat en temps réel, YouTube, flux immersif, cyberpunk",
      },
      {
        name: "description",
        content:
          "SpectralFlow : un réseau social immersif mêlant flux vidéo YouTube, chat temps réel et esthétique cyberpunk néon.",
      },
      { property: "og:locale", content: "fr_FR" },
      { property: "og:site_name", content: "SpectralFlow" },
      { property: "og:title", content: "SpectralFlow — Réseau social cyberpunk" },
      {
        property: "og:description",
        content:
          "SpectralFlow est un réseau social hybride qui mêle flux vidéo immersif, partage YouTube et chat temps réel.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://spectralflow.lovable.app/icon.svg" },
      { property: "og:image:alt", content: "SpectralFlow — réseau social vidéo cyberpunk" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SpectralFlow — Réseau social cyberpunk" },
      {
        name: "twitter:description",
        content:
          "SpectralFlow est un réseau social hybride qui mêle flux vidéo immersif, partage YouTube et chat temps réel.",
      },
      { name: "twitter:image", content: "https://spectralflow.lovable.app/icon.svg" },
      { name: "twitter:site", content: "@spectralflow" },
      { name: "theme-color", content: "#060b1f" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d396ce62-f64f-49e3-b701-f5f77a5e14ba/id-preview-b36659ad--8396a31c-5a2d-4c81-8c85-dba5524814b4.lovable.app-1778940846333.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d396ce62-f64f-49e3-b701-f5f77a5e14ba/id-preview-b36659ad--8396a31c-5a2d-4c81-8c85-dba5524814b4.lovable.app-1778940846333.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SpectralFlow",
          url: "https://spectralflow.lovable.app",
          description: "Réseau social cyberpunk : flux vidéo immersif, YouTube et chat temps réel.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SpectralFlow",
          url: "https://spectralflow.lovable.app",
          logo: "https://spectralflow.lovable.app/icon.svg",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootShellContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootShellContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <>
      <NotificationRequestBanner user={user} />
      <NotificationListener user={user} />
      <Outlet />
      <Toaster />
    </>
  );
}

function NotificationRequestBanner({
  user,
}: {
  user: import("@supabase/supabase-js").User | null;
}) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (
    !user ||
    typeof window === "undefined" ||
    !("Notification" in window) ||
    permission !== "default"
  ) {
    return null;
  }

  const requestPermission = async () => {
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      toast.success("SpectralFlow peut maintenant t'envoyer des notifications.");
    } else if (next === "denied") {
      toast.error("Notifications désactivées. Active-les dans le navigateur si tu changes d'avis.");
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-card/95 p-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">Active les notifications de SpectralFlow</p>
          <p className="text-sm text-muted-foreground">
            Autorise les notifications pour recevoir des alertes de messages et de nouveaux posts de
            tes abonnements.
          </p>
        </div>
        <button
          onClick={requestPermission}
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Autoriser les notifications
        </button>
      </div>
    </div>
  );
}

function NotificationListener({ user }: { user: import("@supabase/supabase-js").User | null }) {
  useEffect(() => {
    if (!user) return;

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const followedIds = new Set<string>();
    const conversationIds = new Set<string>();

    const notify = (title: string, body: string) => {
      toast(title);
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, { body });
      }
    };

    const loadState = async () => {
      const [subsRes, convsRes] = await Promise.all([
        supabase.from("subscriptions").select("target_id").eq("subscriber_id", user.id),
        supabase
          .from("conversations")
          .select("id,user_a,user_b")
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
      ]);

      if (subsRes.error || convsRes.error) return;
      (subsRes.data ?? []).forEach((row: { target_id: string }) => followedIds.add(row.target_id));
      (convsRes.data ?? []).forEach((row: { id: string }) => conversationIds.add(row.id));
    };

    loadState();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const newPost = payload.new as { user_id: string; id: string };
        if (!newPost || newPost.user_id === user.id) return;
        if (!followedIds.has(newPost.user_id)) return;
        notify(
          "Nouveau post d'un abonnement",
          "Un utilisateur que tu suis vient de publier une nouvelle vidéo.",
        );
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const message = payload.new as {
            conversation_id: string;
            sender_id: string;
            content: string;
          };
          if (!message || message.sender_id === user.id) return;

          if (!conversationIds.has(message.conversation_id)) {
            const { data: conversation } = await supabase
              .from("conversations")
              .select("id,user_a,user_b")
              .eq("id", message.conversation_id)
              .maybeSingle();

            if (!conversation) return;
            if (conversation.user_a !== user.id && conversation.user_b !== user.id) return;
            conversationIds.add(conversation.id);
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", message.sender_id)
            .maybeSingle();

          const senderName = profile?.username ? `@${profile.username}` : "quelqu'un";
          notify(`Nouveau message de ${senderName}`, "Ouvre la messagerie pour lire et répondre.");
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          const conversation = payload.new as { id: string; user_a: string; user_b: string };
          if (!conversation) return;
          if (conversation.user_a === user.id || conversation.user_b === user.id) {
            conversationIds.add(conversation.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "subscriptions",
          filter: `subscriber_id=eq.${user.id}`,
        },
        (payload) => {
          const subscription = payload.new as { target_id: string };
          if (subscription?.target_id) followedIds.add(subscription.target_id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "subscriptions",
          filter: `subscriber_id=eq.${user.id}`,
        },
        (payload) => {
          const subscription = payload.old as { target_id: string };
          if (subscription?.target_id) followedIds.delete(subscription.target_id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
