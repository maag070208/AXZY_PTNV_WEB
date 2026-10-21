// Tipos del sprite de Pinzas (pinzasSprite.js, sin dependencias).
export type PinzasAnim = "idle" | "wave" | "work" | "ok" | "err" | "think" | "point";

export const ANIMS: PinzasAnim[];

export function build(anim: string, frame: number): (string | null)[][];
export function draw(ctx: CanvasRenderingContext2D, anim: string, frame: number): void;
export function mount(canvas: HTMLCanvasElement, anim: string): number;
