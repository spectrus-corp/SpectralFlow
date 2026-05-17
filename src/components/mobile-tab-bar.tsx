import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MessageCircle, User, Settings, Plus } from "lucide-react";

const left = [
  { title: "Flux", url: "/feed", icon: Home },
  { title: "Chat", url: "/chat", icon: MessageCircle },
] as const;

const right = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profil", url: "/profile", icon: User },
];

/**
 * Bottom tab bar (mobile only) — TikTok-style with a central "create" FAB.
 * The create button dispatches a global `spectral:create` event that the
 * feed page listens to in order to open its composer drawer.
 */
export function MobileTabBar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!currentPath.startsWith("/feed")) {
      navigate({ to: "/feed" });
    }
    // Defer so feed mounts its listener first.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("spectral:create"));
    }, 60);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/85 px-2 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale"
    >
      {left.map((item) => (
        <TabLink key={item.url} item={item} currentPath={currentPath} />
      ))}

      <button
        onClick={handleCreate}
        aria-label="Créer un post"
        className="relative -mt-6 flex h-12 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-lg shadow-primary/40 transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {right.map((item) => (
        <TabLink key={item.url} item={item} currentPath={currentPath} />
      ))}
    </nav>
  );
}

function TabLink({
  item,
  currentPath,
}: {
  item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
  currentPath: string;
}) {
  const active = currentPath.startsWith(item.url);
  return (
    <Link
      to={item.url}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <item.icon
        className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_var(--color-primary)]" : ""}`}
      />
      <span>{item.title}</span>
    </Link>
  );
}
