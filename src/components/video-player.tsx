import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Maximize2 } from "lucide-react";
import { youTubeEmbedUrl } from "@/lib/youtube";
import { isSoundEnabled, onSoundEnable } from "@/lib/sound";

interface BaseProps {
  active: boolean;
  onTap?: () => void;
  onProgress?: (pct: number) => void;
  onFirstPlay?: () => void;
  poster?: string | null;
  /** Preload full video (next/prev cards) for instant playback when scrolled to. */
  nearby?: boolean;
}

interface UploadProps extends BaseProps {
  kind: "video";
  src: string;
}

interface YTProps extends BaseProps {
  kind: "youtube";
  ytId: string;
}

export type VideoPlayerProps = UploadProps | YTProps;

/**
 * Cross-device immersive video player. NO mute UI: every video starts muted
 * (required by mobile autoplay policies), then unmutes globally as soon as
 * the user makes any gesture on the page (see lib/sound.ts).
 */
export function VideoPlayer(props: VideoPlayerProps) {
  if (props.kind === "youtube") return <YouTubePlayer {...props} />;
  return <NativeVideoPlayer {...props} />;
}

/* ---------- Native uploads ---------- */

function NativeVideoPlayer({
  src,
  active,
  onTap,
  onProgress,
  onFirstPlay,
  poster,
  nearby,
}: UploadProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControlOverlay, setShowControlOverlay] = useState(false);
  const playedOnce = useRef(false);

  // Sync mute to the global "sound enabled" gate.
  useEffect(() => {
    const apply = () => {
      const v = ref.current;
      if (!v) return;
      v.muted = !isSoundEnabled();
    };
    apply();
    return onSoundEnable(apply);
  }, []);

  // Autoplay / pause based on visibility.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.muted = !isSoundEnabled();
      // First attempt: try with desired mute state.
      const p = v.play();
      if (p !== undefined) {
        p.then(() => setPlaying(true)).catch(() => {
          // Browser blocked it — fall back to muted autoplay.
          v.muted = true;
          v.play()
            .then(() => setPlaying(true))
            .catch(() => setPlaying(false));
        });
      }
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [active]);

  const togglePlay = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
    setShowControlOverlay(true);
    window.setTimeout(() => setShowControlOverlay(false), 600);
  }, []);

  const onTimeUpdate = () => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgress(pct);
    onProgress?.(pct);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const fullscreen = () => {
    ref.current?.requestFullscreen?.();
  };

  return (
    <div
      className="relative h-full w-full bg-black"
      onClick={() => {
        onTap?.();
        togglePlay();
      }}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        loop
        autoPlay
        playsInline
        {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>)}
        muted
        preload={nearby ? "auto" : "metadata"}
        className="h-full w-full object-contain"
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          if (active) e.currentTarget.play().catch(() => {});
        }}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => {
          if (!playedOnce.current) {
            playedOnce.current = true;
            onFirstPlay?.();
          }
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
      />

      {(showControlOverlay || !playing) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-5 backdrop-blur-xl animate-scale-in">
            {playing ? (
              <Pause className="h-10 w-10 text-white" />
            ) : (
              <Play className="h-10 w-10 fill-white text-white" />
            )}
          </div>
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-xs text-white/80">
          <span>{formatTime((progress / 100) * duration)}</span>
          <button onClick={fullscreen} aria-label="Plein écran">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <div
          className="group relative h-1.5 cursor-pointer rounded-full bg-white/20"
          onClick={seek}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- YouTube embed ---------- */

function ytCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func, args }),
    "*",
  );
}

function YouTubePlayer({ ytId, active, onTap, onFirstPlay, poster, nearby }: YTProps) {
  const shouldMount = active || nearby;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playedOnce = useRef(false);

  // Drive play / pause based on activity.
  useEffect(() => {
    if (!shouldMount) return;
    const t = window.setTimeout(() => {
      if (active) {
        ytCommand(iframeRef.current, "playVideo");
        ytCommand(iframeRef.current, "unMute");
        if (!playedOnce.current) {
          playedOnce.current = true;
          onFirstPlay?.();
        }
      } else {
        ytCommand(iframeRef.current, "pauseVideo");
      }
    }, 150);
    return () => window.clearTimeout(t);
  }, [active, shouldMount, onFirstPlay]);

  // Keep YouTube unmuted whenever the iframe is mounted.
  useEffect(() => {
    if (!shouldMount) return;
    const apply = () => {
      ytCommand(iframeRef.current, "unMute");
    };
    apply();
    return onSoundEnable(apply);
  }, [shouldMount]);

  if (!shouldMount) {
    return (
      <div
        className="relative h-full w-full bg-black"
        onClick={onTap}
        style={{
          backgroundImage: poster ? `url(${poster})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="rounded-full bg-black/60 p-5 backdrop-blur-xl">
            <Play className="h-10 w-10 fill-white text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        ref={iframeRef}
        src={youTubeEmbedUrl(ytId, {
          autoplay: true,
          mute: false,
          controls: true,
          loop: true,
        })}
        title="YouTube video"
        allow="autoplay; encrypted-media; clipboard-write; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
