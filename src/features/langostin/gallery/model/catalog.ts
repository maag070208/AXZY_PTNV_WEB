import type { LangostinAnim, LangostinScene } from "@shared/ui/langostin";

/** Grupos de animaciones, en el orden en que se muestran en la galería. */
export type AnimGroupId = "basics" | "help" | "states" | "work" | "fun" | "season";

export interface AnimGroup {
  readonly id: AnimGroupId;
  readonly anims: readonly LangostinAnim[];
}

export const ANIM_GROUPS: readonly AnimGroup[] = [
  { id: "basics", anims: ["idle", "wave", "work", "ok", "err", "think", "point"] },
  { id: "help", anims: ["help", "info", "success", "warn", "notify", "search", "idea"] },
  { id: "states", anims: ["loading", "empty", "sleep", "offline", "lock", "404"] },
  { id: "work", anims: ["assigned", "fixing", "urgent", "resolved", "upload"] },
  { id: "fun", anims: ["love", "thanks", "dance", "birthday", "coffee", "eat", "key", "bell"] },
  { id: "season", anims: ["beach", "christmas", "halloween"] },
];

/** Un escenario con la animación que mejor le queda (según el README de escenas). */
export interface SceneEntry {
  readonly id: LangostinScene;
  /** Animación sugerida para ese escenario. */
  readonly suggested: LangostinAnim;
}

export const SCENE_CATALOG: readonly SceneEntry[] = [
  { id: "hotel", suggested: "wave" },
  { id: "isla", suggested: "idle" },
  { id: "navidad", suggested: "christmas" },
  { id: "playa", suggested: "beach" },
  { id: "alberca", suggested: "idle" },
  { id: "cuarto", suggested: "sleep" },
  { id: "sistemas", suggested: "work" },
  { id: "noche", suggested: "coffee" },
];

/** Todas las animaciones, en orden plano (para el buscador). */
export const ALL_ANIMS: readonly LangostinAnim[] = ANIM_GROUPS.flatMap((g) => g.anims);
