import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { youTubeEmbedUrl } from "@/lib/youtube";

interface BaseProps {
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onTap?: () => void;
  onProgress?: (pct: number) => void;
  onFirstPlay?: () => void;
  poster?: string | null;
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
 * Unified video player:
 * - autoplay when `active`, pause when not visible
 * - tap = play/pause toggle (also fires onTap for double-tap likes)
 * - mute / unmute control mirrors parent state
 * - progress bar + scrub for native uploads
 * - YouTube uses iframe with autoplay/mute params, no scrub
 */
export function VideoPlayer(props: VideoPlayerProps) {
  if (props.kind === "youtube") return <YouTubePlayer {...props} />;
  return <NativeVideoPlayer {...props} />;
}

function NativeVideoPlayer({
  src,
  active,
  muted,
  onToggleMute,
  onTap,
  onProgress,
  onFirstPlay,
  poster,
}: UploadProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControlOverlay, setShowControlOverlay] = useState(false);
  const playedOnce = useRef(false);

  // Sync mute
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  // Autoplay when active
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    }
  }, [active]);

  const togglePlay = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
    setShowControlOverlay(true);
    setTimeout(() => setShowControlOverlay(false), 600);
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
        playsInline
        muted={muted}
        preload="metadata"
        className="h-full w-full object-contain"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => {
          if (!playedOnce.current) {
            playedOnce.current = true;
            onFirstPlay?.();
          }
        }}
      />

      {/* Big play/pause icon overlay */}
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

      {/* Bottom controls */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-xs text-white/80">
          <span>{formatTime((progress / 100) * duration)}</span>
          <div className="flex gap-2">
            <button onClick={onToggleMute} aria-label={muted ? "Activer le son" : "Couper le son"}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={fullscreen} aria-label="Plein écran">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
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

function YouTubePlayer({ ytId, active, muted, onToggleMute, onTap, poster }: YTProps) {
  // Re-mount iframe each time activeness changes so autoplay reliably fires
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((t) => t + 1);
  }, [active, muted]);

  if (!active) {
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
        key={tick}
        src={youTubeEmbedUrl(ytId, { autoplay: true, mute: muted, controls: true, loop: true })}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
      {/* Mute toggle overlay (YouTube hides own mute behind controls) */}
      <button
        onClick={onToggleMute}
        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur-xl"
        aria-label={muted ? "Activer le son" : "Couper le son"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
