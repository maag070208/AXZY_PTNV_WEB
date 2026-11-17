import type { ReactNode } from "react";

export type PillTone = "success" | "warning" | "danger";

const TONES: Record<PillTone, { bg: string; fg: string }> = {
  success: { bg: "#e6f4ea", fg: "var(--color-success)" },
  warning: { bg: "#fef1e3", fg: "#b45309" },
  danger: { bg: "#fbeaea", fg: "var(--color-danger)" },
};

/** Píldora suave de estado (verde / ámbar / rojo). */
export default function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const c = TONES[tone];
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: c.bg, color: c.fg }}>
      {children}
    </span>
  );
}
