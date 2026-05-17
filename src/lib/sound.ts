/**
 * Module-level "sound enabled" gate.
 *
 * Browsers block unmuted autoplay until the user interacts with the page.
 * We start every video muted (mandatory for autoplay on iOS/Android/Chrome),
 * then on the very first user gesture (click / touch / key) we flip a flag
 * and notify all mounted players to unmute themselves.
 *
 * No mute toggle UI is exposed to the user — sound is always on after their
 * first interaction with the page.
 */

let enabled = false;
const listeners = new Set<() => void>();
let installed = false;

export function isSoundEnabled(): boolean {
  return enabled;
}

export function enableSoundNow(): void {
  if (enabled) return;
  enabled = true;
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* swallow */
    }
  });
}

export function onSoundEnable(cb: () => void): () => void {
  listeners.add(cb);
  if (enabled) cb();
  return () => listeners.delete(cb);
}

/** Install a one-shot global gesture listener (call once on app mount). */
export function installSoundGesture(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const handler = () => enableSoundNow();
  const opts: AddEventListenerOptions = { once: true, capture: true, passive: true };
  window.addEventListener("pointerdown", handler, opts);
  window.addEventListener("touchstart", handler, opts);
  window.addEventListener("keydown", handler, opts);
}
