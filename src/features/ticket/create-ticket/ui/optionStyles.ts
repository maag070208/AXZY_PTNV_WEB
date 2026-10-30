// Emoji de cada opción: chips blancos con emoji a color. Cada categoría tiene
// uno distinto —si todas repiten el mismo, los chips se ven iguales y no se
// distinguen de un vistazo— y las que se creen después caen a una tabla por
// palabra clave; lo último es 🏷️.
export interface OptionStyle {
  emoji: string;
}

export const CATEGORY_STYLES: Record<string, OptionStyle> = {
  Audio: { emoji: "🔊" },
  Chapa: { emoji: "🚪" },
  Contpaq: { emoji: "🧾" },
  "Equipo de computo": { emoji: "💻" },
  Equipo: { emoji: "💻" },
  Evento: { emoji: "📅" },
  Impresora: { emoji: "🖨️" },
  Internet: { emoji: "🌐" },
  Mantenimiento: { emoji: "🔧" },
  Office: { emoji: "📄" },
  Otro: { emoji: "❓" },
  Sistema: { emoji: "🖥️" },
  Softrestaurant: { emoji: "🍽️" },
  Television: { emoji: "📺" },
  Video: { emoji: "🎥" },
  Wifi: { emoji: "📶" },
};

/** Emoji por palabra clave: cubre categorías nuevas sin tocar el código. */
const CATEGORY_KEYWORDS: Array<[RegExp, string]> = [
  [/audio|bocina|bafle|sonido|micro/i, "🔊"],
  [/video|c[áa]mara|pantalla|proyector|tv|televis/i, "📺"],
  [/impres|toner|escan/i, "🖨️"],
  [/internet|red|wifi|router|switch/i, "🌐"],
  [/compu|laptop|pc|server|servidor|equipo/i, "💻"],
  [/chapa|puerta|cerradura|acceso/i, "🚪"],
  [/contpaq|contabilidad|factur/i, "🧾"],
  [/office|documento|correo|word|excel/i, "📄"],
  [/manten|reparac|taller/i, "🔧"],
  [/sistema|software|programa|aplicaci/i, "🖥️"],
  [/evento|sal[óo]n|reservaci/i, "📅"],
  [/restaurant|cocina|bar|alimento/i, "🍽️"],
  [/mueble|limpieza|ba[ñn]o|plomer/i, "🧰"],
];

export const DEFAULT_CATEGORY_STYLE: OptionStyle = { emoji: "🏷️" };

/** Estilo de una categoría: exacto, por palabra clave, o el genérico. */
export const categoryStyle = (name: string): OptionStyle => {
  const exact = CATEGORY_STYLES[name];
  if (exact) return exact;
  const hit = CATEGORY_KEYWORDS.find(([re]) => re.test(name));
  return hit ? { emoji: hit[1] } : DEFAULT_CATEGORY_STYLE;
};

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
