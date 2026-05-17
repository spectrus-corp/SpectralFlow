import { useEffect } from "react";
import { listPlugins, runPlugin, type RunningPlugin } from "@/lib/plugins";

/**
 * Mounts all enabled plugins for the duration of the app session.
 * Re-syncs whenever the plugin list changes (custom event from /plugins).
 */
export function PluginHost() {
  useEffect(() => {
    let running: RunningPlugin[] = [];

    const start = () => {
      running.forEach((r) => r.stop());
      running = listPlugins()
        .filter((p) => p.enabled)
        .map((p) => runPlugin(p));
    };

    start();
    const onChange = () => start();
    window.addEventListener("spectral:plugins-changed", onChange);
    return () => {
      window.removeEventListener("spectral:plugins-changed", onChange);
      running.forEach((r) => r.stop());
    };
  }, []);

  return null;
}
