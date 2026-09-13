// Primitivas de UI compartidas entre el tablero Kanban (KanbanPage) y el
// modal de detalle de ticket (TicketDetailModal): tipos de estado, mapas de
// etiqueta/color, y los componentes Tag/Avatar. Viven aparte para que
// ambos las importen desde un solo lugar en vez de duplicarlas.

export type Status = "PENDIENTE" | "EN_PROGRESO" | "EN_REVISION" | "COMPLETADA";

export interface Tone {
  bg: string;
  text: string;
}

// Los colores se aplican con `style` inline (valores hex reales), NO con
// clases de Tailwind: en este proyecto las clases de color armadas
// dinámicamente (desde un arreglo/mapa) no estaban compilando — por eso
// los avatares y algunas etiquetas se veían en blanco. Un color hex en
// `style` siempre se aplica, sin depender de que el build de Tailwind
// detecte nada.
export const FALLBACK_TONE: Tone = { bg: "#94a3b8", text: "#ffffff" };

export const PRIORITY_META: Record<string, { tone: Tone }> = {
  BAJA: { tone: { bg: "#94a3b8", text: "#ffffff" } },
  MEDIA: { tone: { bg: "#f59e0b", text: "#ffffff" } },
  ALTA: { tone: { bg: "#ea580c", text: "#ffffff" } },
  URGENTE: { tone: { bg: "#e11d48", text: "#ffffff" } },
};

export const STATUS_META: Record<string, { tone: Tone }> = {
  ABIERTO: { tone: { bg: "#f59e0b", text: "#ffffff" } },
  EN_SEGUIMIENTO: { tone: { bg: "#3b82f6", text: "#ffffff" } },
  CERRADO: { tone: { bg: "#059669", text: "#ffffff" } },
};

export const ASSIGNMENT_STATUS_META: Record<Status, { tone: Tone }> = {
  PENDIENTE: { tone: { bg: "#94a3b8", text: "#ffffff" } },
  EN_PROGRESO: { tone: { bg: "#3b82f6", text: "#ffffff" } },
  EN_REVISION: { tone: { bg: "#a855f7", text: "#ffffff" } },
  COMPLETADA: { tone: { bg: "#059669", text: "#ffffff" } },
};

// Paleta determinista para etiquetas de departamento y avatares: mismo
// nombre siempre obtiene el mismo color, sin tener que mantener un mapa
// manual por departamento.
//
// Acotada a tonos que combinan con el azul/marino del resto del panel
// (sidebar, botones primarios). Se quitaron los rosas/fucsias neón que
// desentonaban con el resto de la interfaz.
const TAG_PALETTE: Tone[] = [
  { bg: "#3b82f6", text: "#ffffff" }, // blue
  { bg: "#6366f1", text: "#ffffff" }, // indigo
  { bg: "#0d9488", text: "#ffffff" }, // teal
  { bg: "#0891b2", text: "#ffffff" }, // cyan
  { bg: "#059669", text: "#ffffff" }, // emerald
  { bg: "#f59e0b", text: "#ffffff" }, // amber
  { bg: "#ea580c", text: "#ffffff" }, // orange
  { bg: "#8b5cf6", text: "#ffffff" }, // violet
  { bg: "#0284c7", text: "#ffffff" }, // sky
  { bg: "#65a30d", text: "#ffffff" }, // lime-green
];

export function hashTone(key: string): Tone {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

export function metaFor(map: Record<string, { tone: Tone }>, key: string) {
  return map[key] ?? { tone: FALLBACK_TONE };
}

export function Tag({ label, tone, icon }: { label: string; tone: Tone; icon?: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      {icon}
      {label}
    </span>
  );
}

// Clases completas y estáticas por tamaño: Tailwind solo genera utilidades
// que aparecen literalmente en el código, así que un `w-${size}` armado en
// tiempo de ejecución nunca compila a nada (por eso los avatares se veían
// vacíos). Este mapa evita ese problema por completo.
const AVATAR_SIZE_CLASSES: Record<number, string> = {
  6: "w-6 h-6",
  7: "w-7 h-7",
  8: "w-8 h-8",
};

// Mismo problema que existía con el tamaño del círculo: las iniciales
// deben escalar con `size`, así que también van como clases completas y
// estáticas por tamaño (antes las cuatro ramas devolvían "text-[3px]",
// por eso las iniciales eran ilegibles sin importar el tamaño del avatar).
const AVATAR_TEXT_CLASSES: Record<number, string> = {
  6: "text-[8px]",
  7: "text-[9px]",
  8: "text-[10px]",
};

export function Avatar({ name, seed, size = 7 }: { name: string; seed: string; size?: 6 | 7 | 8 }) {
  const tone = hashTone(`avatar:${seed}`);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizeClass = AVATAR_SIZE_CLASSES[size] ?? AVATAR_SIZE_CLASSES[7];
  const textClass = AVATAR_TEXT_CLASSES[size] ?? AVATAR_TEXT_CLASSES[7];
  return (
    <div
      title={name}
      className={`${sizeClass} leading-none rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 font-black`}
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      <span className={textClass}>{initials}</span>
    </div>
  );
}