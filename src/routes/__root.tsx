import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

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
      { name: "keywords", content: "SpectralFlow, réseau social vidéo, chat en temps réel, YouTube, flux immersif, cyberpunk" },
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
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SpectralFlow — Réseau social cyberpunk" },
      {
        name: "twitter:description",
        content:
          "SpectralFlow est un réseau social hybride qui mêle flux vidéo immersif, partage YouTube et chat temps réel.",
      },
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
          description:
            "Réseau social cyberpunk : flux vidéo immersif, YouTube et chat temps réel.",
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
  const router = useRouter();

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
