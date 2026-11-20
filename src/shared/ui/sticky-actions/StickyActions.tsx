import type { ReactNode } from "react";

interface Props {
  /** Botones píldora (Cancelar, Guardar…); se alinean a la derecha. */
  children: ReactNode;
  className?: string;
}

/**
 * Barra de acciones pegada ARRIBA del contenido (regla del dueño, 2026-11-19):
 * los botones de cancelar/guardar/confirmar van arriba y quedan visibles al
 * hacer scroll, lejos del botón flotante de Langostín (abajo a la derecha).
 * Fondo con el color de tarjeta del kit y sombra tenue hacia abajo.
 */
export default function StickyActions({ children, className = "" }: Props) {
  return (
    <div
      className={`sticky top-2 z-20 -mx-1 mb-4 flex flex-wrap items-center justify-end gap-2 rounded-[20px] px-4 py-3 backdrop-blur ${className}`}
      style={{
        background: "color-mix(in srgb, var(--it-card-bg, #ffffff) 94%, transparent)",
        boxShadow: "0 12px 26px -18px color-mix(in srgb, var(--color-text-default, #0f172a) 30%, transparent)",
      }}
    >
      {children}
    </div>
  );
}
