import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Compass,
  Home,
  MessageCircle,
  Settings,
  Star,
  User,
  Zap,
  LogOut,
  Users,
  Wrench,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

const primaryItems = [
  { title: "Flux", url: "/feed", icon: Home },
  { title: "Découvrir", url: "/discover", icon: Compass },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Notifications", url: "/notifications", icon: Bell },
] as const;

const secondaryItems = [
  { title: "Abonnements", url: "/subscriptions", icon: Star },
  { title: "Communautés", url: "/communities", icon: Users },
  { title: "Favoris", url: "/bookmarks", icon: Bookmark },
  { title: "Plugins", url: "/plugins", icon: Wrench },
  { title: "Paramètres", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/feed" className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground neon-glow">
            <Zap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">
              Spectral<span className="text-neon">Flow</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => {
                const active = currentPath.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const active = currentPath.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Déconnexion">
              <LogOut className="h-5 w-5" />
              {!collapsed && (
                <span className="truncate text-sm text-muted-foreground">{user?.email}</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
