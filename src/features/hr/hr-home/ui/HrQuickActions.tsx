import { ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";

export interface HrQuickAction {
  id: string;
  label: string;
  caption: string;
  onClick: () => void;
  /** Acción principal, en tinta (como la primera tarjeta de la maqueta). */
  highlight?: boolean;
}

interface Props {
  actions: HrQuickAction[];
}

/**
 * Acciones rápidas del inicio de RH: las tareas que más se hacen desde ahí
 * (alta de empleado, asignar horario, aprobar tiempo extra y cerrar la
 * pre-nómina). Cada una navega o abre el diálogo que le toca.
 */
export default function HrQuickActions({ actions }: Props) {
  const { t } = useTranslation("hr-home");
  if (actions.length === 0) return null;
  return (
    <PanelCard title={t("quick.title")} description={t("quick.description")}>
      <div className="grid grid-cols-1 gap-3 sm:!grid-cols-2">
        {actions.map((action) => (
          <ITCard
            key={action.id}
            onClick={action.onClick}
            className={`bento-rise h-full cursor-pointer transition-transform hover:-translate-y-0.5 ${
              action.highlight ? "!bg-[var(--it-bento-ink-bg,var(--color-primary))]" : ""
            }`}
            contentClassName="!p-4"
          >
            <ITFlex direction="column" gap={1}>
              <ITText
                className={`block font-bold !text-[13px] ${
                  action.highlight ? "!text-white" : "!text-slate-800"
                }`}
              >
                {action.label}
              </ITText>
              <ITText
                className={`block text-[11.5px] ${
                  action.highlight ? "!text-white/75" : "text-slate-500"
                }`}
              >
                {action.caption}
              </ITText>
            </ITFlex>
          </ITCard>
        ))}
      </div>
    </PanelCard>
  );
}
