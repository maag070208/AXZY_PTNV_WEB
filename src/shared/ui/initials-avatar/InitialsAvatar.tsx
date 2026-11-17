import { initialsOf } from "@shared/utils/text";

/** Pares fondo/texto pastel; el color se escoge por el nombre para que sea estable. */
const PALETTE: Array<[string, string]> = [
  ["#e3f1dc", "#3f7a2a"],
  ["#fbe4e4", "#b83a3a"],
  ["#ece6f8", "#6a4bc4"],
  ["#fdf0d3", "#a8730f"],
  ["#e1edf8", "#2f6aa3"],
  ["#e6efe6", "#4b6b4b"],
  ["#fbe6da", "#b4561f"],
];

const hash = (s: string) => [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);

const avatarColors = (name: string) => PALETTE[hash(name) % PALETTE.length];

/** Círculo con las iniciales de la persona sobre un fondo pastel. */
export default function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const [bg, fg] = avatarColors(name);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}
    >
      {initialsOf(name)}
    </span>
  );
}
