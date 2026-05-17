/**
 * SpectralFlow plugin system — minimal, fully open & user-editable.
 *
 * Each plugin is a JS snippet stored in localStorage:
 *   { id, name, description, code, enabled, createdAt, updatedAt }
 *
 * When enabled, the code runs inside the page via `new Function("api", code)`
 * and receives a small API surface defined in `createPluginApi`. Plugins
 * persist across sessions and are listed / edited in /plugins.
 *
 * Dev mode is a separate localStorage flag exposing extra UI (logs, raw API).
 */
import { toast } from "sonner";

const STORAGE_KEY = "spectralflow:plugins";
const DEV_KEY = "spectralflow:devmode";
const LOG_KEY = "spectralflow:plugin-logs";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  code: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PluginLog {
  id: string;
  pluginId: string;
  level: "log" | "warn" | "error";
  message: string;
  at: number;
}

/* ---------- storage ---------- */

export function listPlugins(): Plugin[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Plugin[]) : [];
  } catch {
    return [];
  }
}

export function savePlugins(plugins: Plugin[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
  window.dispatchEvent(new CustomEvent("spectral:plugins-changed"));
}

export function upsertPlugin(p: Plugin): void {
  const all = listPlugins();
  const idx = all.findIndex((x) => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.push(p);
  savePlugins(all);
}

export function deletePlugin(id: string): void {
  savePlugins(listPlugins().filter((p) => p.id !== id));
}

export function newPluginId(): string {
  return `plg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------- dev mode ---------- */

export function isDevMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEV_KEY) === "1";
}

export function setDevMode(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(DEV_KEY, "1");
  else window.localStorage.removeItem(DEV_KEY);
  window.dispatchEvent(new CustomEvent("spectral:devmode-changed"));
}

/* ---------- logs ---------- */

export function readLogs(): PluginLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PluginLog[]) : [];
  } catch {
    return [];
  }
}

export function clearLogs(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOG_KEY);
  window.dispatchEvent(new CustomEvent("spectral:plugin-logs"));
}

function pushLog(pluginId: string, level: PluginLog["level"], message: string): void {
  const logs = readLogs();
  logs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    pluginId,
    level,
    message,
    at: Date.now(),
  });
  // cap to last 200
  const trimmed = logs.slice(-200);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent("spectral:plugin-logs"));
  }
}

/* ---------- runtime ---------- */

export interface PluginApi {
  /** Plugin metadata. */
  plugin: { id: string; name: string };
  /** Show a toast notification. */
  toast: (msg: string, opts?: { type?: "success" | "error" | "info" }) => void;
  /** Persist a log line — viewable in /plugins. */
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  /** Listen for an app-wide custom event. Returns an unregister fn. */
  on: (event: string, cb: (detail: unknown) => void) => () => void;
  /** Emit an app-wide custom event. */
  emit: (event: string, detail?: unknown) => void;
  /** Add a stylesheet (returns a remove fn). */
  addStyle: (css: string) => () => void;
  /** Read/write per-plugin scoped storage. */
  storage: {
    get: <T = unknown>(key: string) => T | null;
    set: (key: string, value: unknown) => void;
    remove: (key: string) => void;
  };
}

function createPluginApi(plugin: Plugin, cleanups: Array<() => void>): PluginApi {
  const fmt = (args: unknown[]) =>
    args
      .map((a) => {
        if (typeof a === "string") return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");
  return {
    plugin: { id: plugin.id, name: plugin.name },
    toast: (msg, opts) => {
      const type = opts?.type ?? "info";
      if (type === "success") toast.success(msg);
      else if (type === "error") toast.error(msg);
      else toast(msg);
    },
    log: (...args) => pushLog(plugin.id, "log", fmt(args)),
    warn: (...args) => pushLog(plugin.id, "warn", fmt(args)),
    error: (...args) => pushLog(plugin.id, "error", fmt(args)),
    on: (event, cb) => {
      const handler = (e: Event) => cb((e as CustomEvent).detail);
      window.addEventListener(event, handler);
      const off = () => window.removeEventListener(event, handler);
      cleanups.push(off);
      return off;
    },
    emit: (event, detail) => {
      window.dispatchEvent(new CustomEvent(event, { detail }));
    },
    addStyle: (css) => {
      const tag = document.createElement("style");
      tag.dataset.plugin = plugin.id;
      tag.textContent = css;
      document.head.appendChild(tag);
      const remove = () => tag.remove();
      cleanups.push(remove);
      return remove;
    },
    storage: {
      get: (key) => {
        try {
          const raw = window.localStorage.getItem(`plg:${plugin.id}:${key}`);
          return raw ? (JSON.parse(raw) as never) : null;
        } catch {
          return null;
        }
      },
      set: (key, value) => {
        window.localStorage.setItem(`plg:${plugin.id}:${key}`, JSON.stringify(value));
      },
      remove: (key) => {
        window.localStorage.removeItem(`plg:${plugin.id}:${key}`);
      },
    },
  };
}

export interface RunningPlugin {
  plugin: Plugin;
  stop: () => void;
}

/** Compile and run a single plugin. Returns a stop handle. */
export function runPlugin(plugin: Plugin): RunningPlugin {
  const cleanups: Array<() => void> = [];
  const api = createPluginApi(plugin, cleanups);
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function("api", `"use strict";\n${plugin.code}`);
    const maybeStop = fn(api);
    if (typeof maybeStop === "function") cleanups.push(maybeStop as () => void);
    pushLog(plugin.id, "log", `Plugin "${plugin.name}" démarré`);
  } catch (err) {
    pushLog(plugin.id, "error", err instanceof Error ? err.message : String(err));
  }
  return {
    plugin,
    stop: () => {
      cleanups.forEach((c) => {
        try {
          c();
        } catch {
          /* swallow */
        }
      });
      pushLog(plugin.id, "log", `Plugin "${plugin.name}" arrêté`);
    },
  };
}

export const PLUGIN_EXAMPLE = `// Bienvenue dans un plugin SpectralFlow !
// L'objet "api" te donne accès à toast, log, on/emit, addStyle, storage.
// Renvoie une fonction de nettoyage si tu ajoutes des listeners manuels.

api.toast("Salut depuis " + api.plugin.name + " 👋", { type: "success" });

// Exemple : teinte le bouton créer en jaune
const remove = api.addStyle(\`
  [aria-label="Créer un post"] {
    background: gold !important;
    color: black !important;
  }
\`);

// Exemple : log un message chaque fois qu'un post est créé
api.on("spectral:create", () => api.log("Composer ouvert"));

return () => {
  remove();
  api.log("Nettoyage OK");
};
`;
