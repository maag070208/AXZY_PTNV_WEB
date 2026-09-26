import { useEffect, useState } from "react";
import { ITButton, ITDialog, ITFlex, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { i18n } from "@shared/i18n";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  userName?: string;
}

/**
 * Diálogo para capturar el motivo de baja de un usuario. Mínimo 3 caracteres;
 * envía `onConfirm(reason)` con el motivo en texto plano.
 */
export default function DeactivateDialog({ isOpen, onClose, onConfirm, userName }: Props) {
  const { t: tt } = useTranslation(["employees", "users", "common"]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const trimmed = reason.trim();
  const isValid = trimmed.length >= 3;
  const errorMsg = !isValid && reason.length > 0 ? i18n.t("employees:deactivate.reasonMin", { min: 3 }) : null;

  const handleConfirm = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={() => !submitting && onClose()}
      title={tt("employees:detail.deactivate")}
      className="max-w-md"
    >
      <ITFlex direction="column" gap={4} className="pt-2">
        <ITText className="text-[12px] text-slate-600">
          {tt("employees:detail.deactivateConfirm", { name: userName ?? "" })}
        </ITText>
        <div>
          <ITTextarea
            name="deactivate_reason"
            label={i18n.t("employees:deactivate.reasonLabel")}
            value={reason}
            onChange={setReason}
            placeholder={i18n.t("employees:deactivate.reasonPlaceholder")}
            rows={3}
            error={errorMsg ?? undefined}
            disabled={submitting}
          />
        </div>
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={onClose} disabled={submitting}>
            <ITText className="font-bold text-[11px]">{tt("common:actions.cancel")}</ITText>
          </ITButton>
          <ITButton
            variant="filled"
            color="error"
            onClick={handleConfirm}
            disabled={!isValid || submitting}
          >
            <ITText className="font-bold text-[11px]">
              {submitting ? i18n.t("common:labels.processing") : tt("employees:detail.deactivate")}
            </ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
