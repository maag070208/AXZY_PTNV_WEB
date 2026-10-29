import { Blobatar } from "@blobatar/react";
import type { IconType } from "react-icons";
import { LuArrowRight, LuBoxes, LuChefHat, LuClock, LuTicket } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import LottieLoader from "@shared/ui/lottie-loader/ui/LottieLoader";
import "./login.css";

/** Semillas fijas y decorativas para los avatares del panel de marca. */
const AVATAR_SEEDS = ["front-desk", "housekeeping", "kitchen", "maintenance"] as const;

const FEATURES: {
  labelKey:
    | "login.brand.features.inventory"
    | "login.brand.features.tickets"
    | "login.brand.features.attendance"
    | "login.brand.features.kitchen";
  icon: IconType;
}[] = [
  { labelKey: "login.brand.features.inventory", icon: LuBoxes },
  { labelKey: "login.brand.features.tickets", icon: LuTicket },
  { labelKey: "login.brand.features.attendance", icon: LuClock },
  { labelKey: "login.brand.features.kitchen", icon: LuChefHat },
];

/**
 * Panel izquierdo del login. En móvil se reduce a una cabecera compacta
 * (logotipo + nombre); desde `lg` muestra el mensaje de marca completo.
 *
 * Colores, bordes y fondos van en `login.css` (clases `login-*`): el CSS del
 * kit va sin capa y se impone a las utilidades de Tailwind en `h2` y bordes.
 */
export default function LoginBrandPanel() {
  const { t: tt } = useTranslation(["auth"]);

  return (
    <aside className="login-brand relative flex flex-col overflow-hidden px-6 py-6 lg:w-[52%] lg:justify-between lg:px-12 lg:py-11">
      {/* Círculos decorativos */}
      <div aria-hidden className="login-orb pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full" />
      <div aria-hidden className="login-orb login-orb--faint pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full" />

      {/* Marca: la animación del logotipo trae su propio texto, por eso va en una
          tarjeta blanca sin recortar (un círculo cortaba el nombre). */}
      <div className="relative flex items-center gap-4">
        <div className="login-logo-tile flex shrink-0 items-center justify-center rounded-2xl p-1.5 lg:rounded-3xl lg:p-2">
          <LottieLoader size="sm" label={tt("login.brand.logoAlt")} className="lg:hidden" />
          <LottieLoader size="md" label={tt("login.brand.logoAlt")} className="hidden lg:block" />
        </div>
        <div className="leading-tight">
          <p className="login-on-brand text-lg font-extrabold tracking-tight lg:text-xl">
            {tt("login.brand.name")}
          </p>
          <p className="login-on-brand-muted text-xs font-semibold uppercase tracking-[0.2em]">
            {tt("login.brand.eyebrow")}
          </p>
        </div>
      </div>

      {/* Mensaje (solo desktop) */}
      <div className="relative mt-10 hidden lg:block">
        <h2 className="login-on-brand max-w-lg text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-[2.75rem]">
          {tt("login.brand.headline")}
        </h2>
        <p className="login-on-brand-muted mt-4 max-w-md text-[15px] leading-relaxed">
          {tt("login.brand.subcopy")}
        </p>

        <div className="login-glass mt-9 flex items-center gap-4 rounded-3xl px-5 py-4">
          <div aria-hidden className="flex -space-x-2.5">
            {AVATAR_SEEDS.map((seed) => (
              <Blobatar
                key={seed}
                name={seed}
                size={44}
                alt=""
                aria-hidden
                className="login-avatar h-11 w-11 rounded-full"
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="login-on-brand font-bold">{tt("login.brand.teamTitle")}</p>
            <p className="login-on-brand-muted text-sm">{tt("login.brand.teamText")}</p>
          </div>
        </div>

        <ul className="mt-3 grid grid-cols-2 gap-3">
          {FEATURES.map(({ labelKey, icon: Icon }) => (
            <li key={labelKey} className="login-glass flex items-center gap-3 rounded-2xl px-3.5 py-3">
              <span aria-hidden className="login-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Icon size={18} />
              </span>
              <span className="login-on-brand text-sm font-semibold leading-tight">{tt(labelKey)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="login-on-brand-muted relative mt-10 hidden items-center gap-2 text-sm font-medium lg:flex">
        <span aria-hidden className="login-pulse h-2 w-2 rounded-full" />
        {tt("login.brand.realtime")}
        <LuArrowRight aria-hidden size={15} />
      </p>
    </aside>
  );
}
