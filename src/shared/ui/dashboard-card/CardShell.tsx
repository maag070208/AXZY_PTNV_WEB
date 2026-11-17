import type { CSSProperties, ReactNode } from "react";

/** Tarjeta blanca del tablero de Personal: borde fino y esquinas redondeadas. */
const cardStyle: CSSProperties = {
  background: "var(--it-card-bg, #ffffff)",
  border: "1px solid #e6eaf0",
  borderRadius: 16,
};

interface Props {
  title: string;
  /** Contenido alineado a la derecha del encabezado. */
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function CardShell({ title, right, children, className = "" }: Props) {
  return (
    <section className={`flex min-w-0 flex-col p-5 ${className}`} style={cardStyle}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[17px] font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}
