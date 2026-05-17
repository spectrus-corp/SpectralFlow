import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { PluginHost } from "@/components/plugin-host";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { installSoundGesture } from "@/lib/sound";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarHidden, setSidebarHidden] = useState(false);

  // Install one-shot global sound-unmute gesture for the whole session.
  useEffect(() => {
    installSoundGesture();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <PluginHost />
      <div className="flex min-h-screen w-full">
        {/* Desktop / tablet sidebar (can be hidden via toggle) */}
        {!sidebarHidden && (
          <div className="hidden md:block">
            <AppSidebar />
          </div>
        )}
        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
        {/* Floating sidebar toggle — always reachable, on every device */}
        <button
          onClick={() => setSidebarHidden((v) => !v)}
          aria-label={sidebarHidden ? "Afficher la barre latérale" : "Cacher la barre latérale"}
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-md backdrop-blur-xl transition-transform hover:scale-105 active:scale-95"
        >
          {sidebarHidden ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        {/* Mobile bottom tab bar */}
        <MobileTabBar />
      </div>
    </SidebarProvider>
  );
}
