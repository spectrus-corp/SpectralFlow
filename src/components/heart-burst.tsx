import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export interface BurstPoint {
  id: number;
  x: number;
  y: number;
}

/** Floating hearts animation triggered by double-tap. */
export function HeartBurst({ points, onDone }: { points: BurstPoint[]; onDone: (id: number) => void }) {
  return (
    <>
      {points.map((p) => (
        <FloatingHeart key={p.id} point={p} onDone={() => onDone(p.id)} />
      ))}
    </>
  );
}

function FloatingHeart({ point, onDone }: { point: BurstPoint; onDone: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: point.x,
        top: point.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Heart
        className={`h-24 w-24 fill-primary text-primary drop-shadow-[0_0_24px_rgba(255,102,0,0.8)] transition-all duration-700 ease-out ${
          mounted ? "-translate-y-24 scale-100 opacity-0" : "scale-50 opacity-100"
        }`}
      />
    </div>
  );
}
