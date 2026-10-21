// Tipos del sprite de Langostin (langostinSprite.js, sin dependencias).
export type LangostinAnim = "idle" | "wave" | "work" | "ok" | "err" | "think" | "point";

export const ANIMS: LangostinAnim[];

export function build(anim: string, frame: number): (string | null)[][];
export function draw(ctx: CanvasRenderingContext2D, anim: string, frame: number): void;
export function mount(canvas: HTMLCanvasElement, anim: string): number;
