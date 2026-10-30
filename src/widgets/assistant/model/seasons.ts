import type { LangostinAnim } from "@shared/ui/langostin";

export type SeasonKey = "halloween" | "navidad" | "verano" | "amor" | "patrias" | "ano";

export interface Season {
  key: SeasonKey;
  /** Animación del sprite que toca en la temporada. */
  anim: LangostinAnim;
  /** Emoji de la temporada (sombrero del botón y estado). */
  emoji: string;
  /** Color del anillo del botón flotante y del tinte del panel. */
  ring: string;
  tint: string;
  /** Emojis que caen dentro del panel (decorativo). */
  particles: string[];
}

/**
 * Temporadas de Langostín: cambian el ánimo del botón (anillo, emoji, tinte del
 * panel y emojis que caen) y la animación de la mascota. Son sólo decorativas:
 * no alteran ninguna respuesta de ayuda ni dato del sistema.
 */
export const SEASONS: Record<SeasonKey, Season> = {
  halloween: { key: "halloween", anim: "halloween", emoji: "🎃", ring: "#F28C28", tint: "rgba(242,140,40,.20)", particles: ["🦇", "🎃", "👻", "🕸️"] },
  navidad: { key: "navidad", anim: "christmas", emoji: "🎄", ring: "#E0342F", tint: "rgba(224,52,47,.14)", particles: ["❄️", "❄️", "🎄", "⭐"] },
  verano: { key: "verano", anim: "beach", emoji: "🏖️", ring: "#7FD0EB", tint: "rgba(127,208,235,.26)", particles: ["☀️", "🌊", "🐚", "🌴"] },
  amor: { key: "amor", anim: "love", emoji: "💘", ring: "#E0342F", tint: "rgba(224,52,47,.12)", particles: ["💗", "💖", "💘", "💝"] },
  patrias: { key: "patrias", anim: "dance", emoji: "🇲🇽", ring: "#3FAE5A", tint: "rgba(63,174,90,.18)", particles: ["🎉", "🌮", "🎺", "🇲🇽"] },
  ano: { key: "ano", anim: "birthday", emoji: "🎉", ring: "#F2C230", tint: "rgba(242,194,48,.22)", particles: ["🎉", "🎈", "✨", "🥂"] },
};

/**
 * Temporada según la fecha local. Copia la regla del diseño de referencia:
 * Año Nuevo (31 dic y 1 ene), Navidad (diciembre y primeros días de enero),
 * San Valentín (10–14 feb y 10 may), Fiestas patrias (13–16 sep),
 * Halloween y Día de Muertos (20 oct – 2 nov) y Verano en Baja (jun–ago).
 */
export const seasonForDate = (date: Date = new Date()): Season | null => {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return SEASONS.ano;
  if (month === 12 || (month === 1 && day <= 6)) return SEASONS.navidad;
  if (month === 2 && day >= 10 && day <= 14) return SEASONS.amor;
  if (month === 5 && day === 10) return SEASONS.amor;
  if (month === 9 && day >= 13 && day <= 16) return SEASONS.patrias;
  if ((month === 10 && day >= 20) || (month === 11 && day <= 2)) return SEASONS.halloween;
  if (month >= 6 && month <= 8) return SEASONS.verano;
  return null;
};
