import { useEffect, useRef } from "react";
import { draw } from "@shared/ui/langostin/langostinSprite";
import type { LangostinAnim } from "@shared/ui/langostin";
import { subscribeFrames } from "../model/ticker";

interface Props {
  anim: LangostinAnim;
  /** Tamaño del sprite en px (cuadrado). */
  size?: number;
  className?: string;
  label?: string;
}

/** Sprite de la galería: usa el reloj global, así no hay un timer por ficha. */
export default function SpriteTile({ anim, size = 56, className, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    draw(ctx, anim, 0);
    return subscribeFrames((frame) => draw(ctx, anim, frame));
  }, [anim]);

  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      className={className}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      role="img"
      aria-label={label ?? anim}
    />
  );
}
