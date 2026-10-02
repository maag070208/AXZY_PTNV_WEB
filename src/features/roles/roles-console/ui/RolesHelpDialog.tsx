import type { ReactNode } from "react";
import { ITDialog } from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaGavel, FaIdCard, FaKey, FaLightbulb } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { ScopeChip } from "./shared/Scope";

interface RolesHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function Layer({ icon, step, title, body }: { icon: ReactNode; step: number; title: string; body: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0D5777]/10 text-[#0D5777]">{icon}</span>
        <span className="text-[10px] font-black text-slate-400">{step}</span>
        <span className="text-[12px] font-black text-slate-800">{title}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Ayuda de la consola: el control de acceso en tres capas (Identidad → RBAC →
 * ABAC), qué es un rol, el alcance de datos, las excepciones y buenas prácticas.
 */
export default function RolesHelpDialog({ isOpen, onClose }: RolesHelpDialogProps) {
  const { t } = useTranslation("roles");

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={t("help.title")}>
      <div className="flex max-h-[72vh] flex-col gap-5 overflow-y-auto pr-1">
        <p className="text-[12px] leading-relaxed text-slate-600">{t("help.intro")}</p>

        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          <Layer icon={<FaIdCard size={13} />} step={1} title={t("help.layers.identity.title")} body={t("help.layers.identity.body")} />
          <FaArrowRight className="hidden shrink-0 text-slate-300 md:block" />
          <Layer icon={<FaKey size={13} />} step={2} title={t("help.layers.rbac.title")} body={t("help.layers.rbac.body")} />
          <FaArrowRight className="hidden shrink-0 text-slate-300 md:block" />
          <Layer icon={<FaGavel size={13} />} step={3} title={t("help.layers.abac.title")} body={t("help.layers.abac.body")} />
        </div>

        <Section title={t("help.rolesTitle")}>
          <p className="text-[12px] leading-relaxed text-slate-600">{t("help.rolesBody")}</p>
        </Section>

        <Section title={t("help.scopeTitle")}>
          <p className="text-[12px] leading-relaxed text-slate-600">{t("help.scopeIntro")}</p>
          {(["OWN", "AREA", "ALL"] as const).map((scope) => (
            <div key={scope} className="flex items-start gap-2">
              <ScopeChip scope={scope} />
              <span className="text-[12px] leading-relaxed text-slate-600">
                {t(scope === "OWN" ? "help.scopeOwnExample" : scope === "AREA" ? "help.scopeAreaExample" : "help.scopeAllExample")}
              </span>
            </div>
          ))}
          <p className="text-[12px] leading-relaxed text-slate-600">{t("help.scopeNote")}</p>
        </Section>

        <Section title={t("help.exceptionsTitle")}>
          <p className="text-[12px] leading-relaxed text-slate-600">{t("help.exceptionsBody")}</p>
        </Section>

        <Section title={t("help.appliesTitle")}>
          <p className="text-[12px] leading-relaxed text-slate-600">{t("help.appliesBody")}</p>
        </Section>

        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <FaLightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <ul className="flex list-disc flex-col gap-1 pl-4 text-[11px] leading-relaxed text-amber-900">
            <li>{t("help.tips.leastPrivilege")}</li>
            <li>{t("help.tips.duplicate")}</li>
            <li>{t("help.tips.sod")}</li>
            <li>{t("help.tips.test")}</li>
          </ul>
        </div>
      </div>
    </ITDialog>
  );
}
