import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Code2,
  Play,
  Plus,
  Power,
  Save,
  Trash2,
  Wrench,
  AlertTriangle,
  ScrollText,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  clearLogs,
  deletePlugin,
  isDevMode,
  listPlugins,
  newPluginId,
  PLUGIN_EXAMPLE,
  readLogs,
  runPlugin,
  setDevMode,
  upsertPlugin,
  type Plugin,
  type PluginLog,
} from "@/lib/plugins";

export const Route = createFileRoute("/_app/plugins")({
  component: PluginsPage,
  head: () => ({
    meta: [
      { title: "Plugins & Mode dev — SpectralFlow" },
      {
        name: "description",
        content:
          "Crée, édite et active tes propres mods open-source pour SpectralFlow, directement depuis le site.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Plugin | null>(null);
  const [dev, setDev] = useState(false);
  const [logs, setLogs] = useState<PluginLog[]>([]);

  // Initial load + sync
  useEffect(() => {
    const refresh = () => setPlugins(listPlugins());
    refresh();
    setDev(isDevMode());
    setLogs(readLogs());
    const onPlugins = () => refresh();
    const onDev = () => setDev(isDevMode());
    const onLogs = () => setLogs(readLogs());
    window.addEventListener("spectral:plugins-changed", onPlugins);
    window.addEventListener("spectral:devmode-changed", onDev);
    window.addEventListener("spectral:plugin-logs", onLogs);
    return () => {
      window.removeEventListener("spectral:plugins-changed", onPlugins);
      window.removeEventListener("spectral:devmode-changed", onDev);
      window.removeEventListener("spectral:plugin-logs", onLogs);
    };
  }, []);

  const selected = useMemo(
    () => plugins.find((p) => p.id === selectedId) ?? null,
    [plugins, selectedId],
  );

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
  }, [selected]);

  const createNew = () => {
    const p: Plugin = {
      id: newPluginId(),
      name: "Nouveau plugin",
      description: "Décris ce que fait ton mod ici.",
      code: PLUGIN_EXAMPLE,
      enabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsertPlugin(p);
    setSelectedId(p.id);
    toast.success("Plugin créé");
  };

  const save = () => {
    if (!draft) return;
    upsertPlugin({ ...draft, updatedAt: Date.now() });
    toast.success("Plugin enregistré");
  };

  const toggle = (p: Plugin) => {
    upsertPlugin({ ...p, enabled: !p.enabled, updatedAt: Date.now() });
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce plugin ?")) return;
    deletePlugin(id);
    if (selectedId === id) setSelectedId(null);
    toast.success("Plugin supprimé");
  };

  const testRun = () => {
    if (!draft) return;
    const handle = runPlugin({ ...draft, enabled: true });
    toast.info("Test lancé — il s'arrêtera dans 8s");
    window.setTimeout(() => handle.stop(), 8000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Wrench className="h-6 w-6 text-primary" /> Plugins & Mode dev
          </h1>
          <p className="text-sm text-muted-foreground">
            Écris tes propres mods open-source. Ils s'exécutent dans ton navigateur,
            avec une API simple (toast, log, événements, styles, storage).
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-2">
          <Power className="h-4 w-4 text-primary" />
          <Label htmlFor="devmode" className="text-sm">
            Mode développeur
          </Label>
          <Switch
            id="devmode"
            checked={dev}
            onCheckedChange={(v) => setDevMode(v)}
            aria-label="Activer le mode développeur"
          />
        </div>
      </header>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-100">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Les plugins s'exécutent avec les mêmes droits que SpectralFlow dans
            ton navigateur. N'active que du code que tu as lu et compris.
          </span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Sidebar list */}
        <aside className="space-y-2 rounded-2xl border border-border bg-card/60 p-3">
          <Button onClick={createNew} className="w-full neon-glow">
            <Plus className="mr-2 h-4 w-4" /> Nouveau plugin
          </Button>
          {plugins.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Aucun plugin. Crée ton premier mod !
            </p>
          )}
          <ul className="space-y-1">
            {plugins.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === p.id
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <Code2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.enabled ? "Actif" : "Inactif"}
                    </span>
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(p);
                    }}
                    className="ml-1"
                  >
                    <Switch checked={p.enabled} aria-label={`Activer ${p.name}`} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <section className="rounded-2xl border border-border bg-card/60 p-4">
          {!draft ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Code2 className="h-10 w-10 opacity-50" />
              <p>Sélectionne un plugin ou crée-en un nouveau.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="p-name">Nom</Label>
                  <Input
                    id="p-name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p-desc">Description</Label>
                  <Input
                    id="p-desc"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-code">Code (JavaScript)</Label>
                <Textarea
                  id="p-code"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                  className="min-h-[320px] font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={save} className="neon-glow">
                  <Save className="mr-2 h-4 w-4" /> Enregistrer
                </Button>
                <Button onClick={testRun} variant="secondary">
                  <Play className="mr-2 h-4 w-4" /> Tester 8s
                </Button>
                <Button
                  onClick={() => remove(draft.id)}
                  variant="destructive"
                  className="ml-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {dev && (
        <section className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ScrollText className="h-4 w-4 text-primary" /> Console plugins
            </h2>
            <Button onClick={clearLogs} variant="ghost" size="sm">
              <Eraser className="mr-2 h-4 w-4" /> Vider
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl bg-background/60 p-3 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">Aucun log pour l'instant.</p>
            ) : (
              logs
                .slice()
                .reverse()
                .map((l) => (
                  <div
                    key={l.id}
                    className={
                      l.level === "error"
                        ? "text-destructive"
                        : l.level === "warn"
                          ? "text-yellow-400"
                          : "text-foreground/80"
                    }
                  >
                    <span className="opacity-50">
                      [{new Date(l.at).toLocaleTimeString()}]
                    </span>{" "}
                    <span className="opacity-60">{l.pluginId.slice(0, 8)}</span>{" "}
                    {l.message}
                  </div>
                ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
