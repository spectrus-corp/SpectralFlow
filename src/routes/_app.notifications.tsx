import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications — SpectralFlow" },
      {
        name: "description",
        content: "Configure et active les notifications SpectralFlow pour ton appareil.",
      },
      { property: "og:title", content: "Notifications — SpectralFlow" },
      {
        property: "og:description",
        content: "Gère l'autorisation des notifications pour recevoir des alertes en temps réel.",
      },
      { property: "og:url", content: "https://spectralflow.lovable.app/notifications" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://spectralflow.lovable.app/notifications" }],
  }),
});

function NotificationsPage() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied",
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications non supportées par ce navigateur.");
      return;
    }

    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      toast.success("Notifications activées !");
    } else {
      toast.error("Permissions de notification non accordées.");
    }
  };

  const description =
    permission === "granted"
      ? "Les notifications sont activées. Tu recevras des alertes pour les messages et les nouveaux posts des personnes suivies."
      : permission === "denied"
        ? "Les notifications sont refusées. Va dans les paramètres de ton navigateur pour activer SpectralFlow."
        : "Autorise les notifications pour recevoir des alertes sur ton téléphone ou ton PC.";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3 text-primary">
          <Bell className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold">Autorisation de notification</p>
            <p className="text-sm text-muted-foreground">
              Si ton navigateur est compatible, autorise SpectralFlow à t'envoyer des notifications
              pour recevoir les alertes en temps réel.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
            Statut : {permission}
          </span>
          <button
            onClick={requestPermission}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {permission === "granted" ? "Déjà activé" : "Activer maintenant"}
          </button>
        </div>
      </div>
    </div>
  );
}
