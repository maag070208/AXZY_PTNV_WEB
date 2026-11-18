import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  /** Mientras guarda: deshabilita el botón principal y muestra "Guardando…". */
  busy?: boolean;
  disabled?: boolean;
  /** Acción destructiva: el botón principal va en rojo. */
  danger?: boolean;
  /** Oculta Cancelar (diálogos de solo lectura). */
  hideCancel?: boolean;
}

/** Pie común de los diálogos de Blancos: Cancelar (gris, redondo) → acción principal, a la derecha. */
export default function DialogFooter({ onCancel, onConfirm, confirmLabel, busy = false, disabled = false, danger = false, hideCancel = false }: Props) {
  const { t } = useTranslation("common");
  return (
    <ITFlex justify="end" gap={2} className="mt-4">
      {!hideCancel && (
        <ITButton variant="outlined" color="gray" className="!rounded-full" disabled={busy} onClick={onCancel}>
          <ITText className="!text-[12px] font-bold">{t("actions.cancel")}</ITText>
        </ITButton>
      )}
      <ITButton variant="rounded" color={danger ? "danger" : "primary"} disabled={busy || disabled} onClick={onConfirm}>
        <ITText className="!text-[12px] font-bold">{busy ? t("actions.saving") : confirmLabel}</ITText>
      </ITButton>
    </ITFlex>
  );
}
