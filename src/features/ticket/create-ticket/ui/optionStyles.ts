// Emoji de cada opción, al estilo del ejemplo de referencia: chips blancos con
// emoji a color. Las categorías nuevas usan 🏷️ y las áreas usan 🏢.
export interface OptionStyle {
  emoji: string;
}

export const CATEGORY_STYLES: Record<string, OptionStyle> = {
  Equipo: { emoji: "💻" },
  Mantenimiento: { emoji: "🔧" },
  Sistema: { emoji: "🖥️" },
  Otro: { emoji: "❓" },
};

export const DEFAULT_CATEGORY_STYLE: OptionStyle = { emoji: "🏷️" };

// Síntomas, por clave de i18n (ver SYMPTOM_KEYS).
export const SYMPTOM_STYLES: Record<string, OptionStyle> = {
  noPower: { emoji: "🔌" },
  noConnection: { emoji: "🌐" },
  slow: { emoji: "🐢" },
  noResponse: { emoji: "⏳" },
  error: { emoji: "⚠️" },
  stopped: { emoji: "🛑" },
  noise: { emoji: "🔊" },
  leak: { emoji: "💧" },
  repair: { emoji: "🛠️" },
  review: { emoji: "🔍" },
  other: { emoji: "❓" },
};

export const areaStyle = (): OptionStyle => ({ emoji: "🏢" });

// Urgencia: el emoji de color sigue el nivel.
export const PRIORITY_STYLES: Record<string, OptionStyle> = {
  LOW: { emoji: "🟢" },
  MEDIUM: { emoji: "🟡" },
  HIGH: { emoji: "🟠" },
  URGENT: { emoji: "🔴" },
};
