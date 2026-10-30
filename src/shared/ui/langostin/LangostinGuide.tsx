import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePrefersReducedMotion } from "@shared/lib/usePrefersReducedMotion";
import { useIsMobile } from "@shared/lib/useIsMobile";
import Langostin from "./Langostin";
import type { LangostinAnim } from "./langostinSprite";

export type LangostinGuideStatus = "idle" | "saving" | "saved" | "error";

interface Props {
  /** Texto (ya traducido) por `name` del campo enfocado. */
  hints: Record<string, string>;
  status?: LangostinGuideStatus;
  /** Texto del estado; si falta se usa el genérico de `langostin.guide.*`. */
  statusText?: string;
  /** Identifica el formulario (y a la persona) para recordar que se cerró. */
  storageKey: string;
  /** Texto cuando no hay campo con pista enfocado. */
  defaultText?: string;
}

const PREFIX = "langostin-guide:";

const readDismissed = (key: string): boolean => {
  try {
    return window.localStorage.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
};

const writeDismissed = (key: string) => {
  try {
    window.localStorage.setItem(PREFIX + key, "1");
  } catch {
    // Sin almacenamiento disponible: solo se cierra en esta sesión.
  }
};

/**
 * Guía flotante (nivel L2 + L3): abajo a la derecha explica el campo enfocado
 * del formulario y reacciona al estado de guardado. Cerrable; la preferencia
 * se recuerda por `storageKey`. En móvil es una burbuja compacta sobre el borde
 * inferior, sin tapar los botones.
 */
export default function LangostinGuide({ hints, status = "idle", statusText, storageKey, defaultText }: Props) {
  const { t } = useTranslation("langostin");
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(() => readDismissed(storageKey));
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    setDismissed(readDismissed(storageKey));
  }, [storageKey]);

  // Sigue el campo con el cursor: se busca por el atributo `name` del input.
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const name = (event.target as HTMLInputElement | null)?.name;
      if (name) setFocused(name);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  const close = useCallback(() => {
    writeDismissed(storageKey);
    setDismissed(true);
  }, [storageKey]);

  if (dismissed) return null;

  const hint = focused ? hints[focused] : undefined;
  const statusDefaults: Record<Exclude<LangostinGuideStatus, "idle">, string> = {
    saving: t("guide.saving"),
    saved: t("guide.saved"),
    error: t("guide.error"),
  };
  const text = status !== "idle" ? (statusText ?? statusDefaults[status]) : (hint ?? defaultText ?? t("guide.default"));

  const anim: LangostinAnim =
    status === "saving" ? "work" : status === "saved" ? "ok" : status === "error" ? "err" : hint ? "point" : "help";

  return (
    <div
      className={`pointer-events-none fixed right-3 z-50 flex items-end gap-2 md:bottom-6 md:right-6 md:gap-3 ${isMobile ? "bottom-20" : ""}`}
    >
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto relative rounded-2xl rounded-br-sm border border-slate-200 bg-[var(--it-card-bg)] text-slate-600 shadow-lg dark:border-slate-700 dark:text-slate-200 ${
          isMobile ? "max-w-[14rem] px-3 py-2 pr-7 text-xs" : "max-w-xs px-4 py-3 pr-8 text-sm"
        }`}
      >
        {text}
        <button
          type="button"
          onClick={close}
          aria-label={t("guide.close")}
          className="absolute right-1.5 top-1 cursor-pointer border-0 bg-transparent px-1 text-base leading-none text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>
      <div className="pointer-events-auto drop-shadow-lg">
        <Langostin anim={anim} size={isMobile ? 48 : 72} animated={!reduced} label={t("guide.label")} />
      </div>
    </div>
  );
}
