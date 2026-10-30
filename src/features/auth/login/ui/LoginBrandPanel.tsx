import { Blobatar } from "@blobatar/react";
import type { IconType } from "react-icons";
import { LuArrowRight, LuBoxes, LuChefHat, LuClock, LuTicket } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import LottieLoader from "@shared/ui/lottie-loader/ui/LottieLoader";
import "./login.css";
import { ITText, ITFlex } from "@axzydev/axzy_ui_system";

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
    <aside className="login-brand relative flex flex-col overflow-hidden px-6 py-7 lg:w-[52%] lg:justify-between lg:px-14 lg:py-14">
      {/* Círculos decorativos */}
      <div aria-hidden className="login-orb pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full" />
      <div aria-hidden className="login-orb login-orb--faint pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full" />

      {/* Marca: la animación del logotipo trae su propio texto, por eso va en una
          tarjeta blanca sin recortar (un círculo cortaba el nombre). */}
      <div className="relative flex items-center gap-5">
        <div className="login-logo-tile flex shrink-0 items-center justify-center rounded-2xl p-2 lg:rounded-[26px] lg:p-2.5">
          <LottieLoader size="sm" label={tt("login.brand.logoAlt")} className="lg:hidden" />
          <LottieLoader size="md" label={tt("login.brand.logoAlt")} className="hidden lg:block" />
        </div>
        <div className="leading-tight">
          <ITText className="login-on-brand text-xl font-extrabold tracking-tight lg:text-2xl">
            {tt("login.brand.name")}
          </ITText>
          <ITText className="login-on-brand-muted mt-1 block text-[12px] font-semibold uppercase tracking-[0.22em]">
            {tt("login.brand.eyebrow")}
          </ITText>
        </div>
      </div>

      {/* Mensaje (solo desktop) */}
      <div className="relative mt-12 hidden lg:block">
        <ITText as="h2" className="login-on-brand max-w-xl text-[2.5rem] font-extrabold leading-[1.06] tracking-tight xl:text-[3rem]">
          {tt("login.brand.headline")}
        </ITText>
        <ITText className="login-on-brand-muted mt-5 max-w-lg text-[16px] leading-relaxed">
          {tt("login.brand.subcopy")}
        </ITText>

        <div className="login-glass mt-10 flex items-center gap-5 rounded-[26px] px-6 py-5">
          <div aria-hidden className="flex -space-x-2.5">
            {AVATAR_SEEDS.map((seed) => (
              <Blobatar
                key={seed}
                name={seed}
                size={48}
                alt=""
                aria-hidden
                className="login-avatar h-12 w-12 rounded-full"
              />
            ))}
          </div>
          <ITFlex direction="column" gap={0.5} className="min-w-0">
            <ITText className="login-on-brand text-[15px] font-bold">{tt("login.brand.teamTitle")}</ITText>
            <ITText className="login-on-brand-muted text-[13px] leading-snug">{tt("login.brand.teamText")}</ITText>
          </ITFlex>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3.5">
          {FEATURES.map(({ labelKey, icon: Icon }) => (
            <li key={labelKey} className="login-glass flex items-center gap-3.5 rounded-[20px] px-4 py-3.5">
              <ITText as="span" aria-hidden className="login-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]">
                <Icon size={20} />
              </ITText>
              <ITText as="span" className="login-on-brand text-[14.5px] font-semibold leading-tight">{tt(labelKey)}</ITText>
            </li>
          ))}
        </ul>
      </div>

      <ITText className="login-on-brand-muted relative mt-12 hidden items-center gap-2.5 text-[14px] font-medium lg:flex">
        <span aria-hidden className="login-pulse h-2 w-2 rounded-full" />
        {tt("login.brand.realtime")}
        <LuArrowRight aria-hidden size={15} />
      </ITText>
    </aside>
  );
}
