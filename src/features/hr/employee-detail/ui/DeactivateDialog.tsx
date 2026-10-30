import { useEffect, useRef, useState } from "react";
import { ITButton, ITDialog, ITTextarea } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { i18n } from "@shared/i18n";
import { usePrefersReducedMotion } from "@shared/lib/usePrefersReducedMotion";
import { Langostin } from "@shared/ui/langostin";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  userName?: string;
}

/**
 * Confirmación M1 de baja con motivo: mismo diseño que `LangostinConfirm`
 * (Langostín `help`, pregunta, consecuencia y botones píldora) más el campo del
 * motivo, que `LangostinConfirm` no admite porque no puede bloquear Confirmar.
 * Mínimo 3 caracteres; envía `onConfirm(reason)` con el motivo en texto plano.
 * El foco inicial queda en Cancelar (acción destructiva).
 */
export default function DeactivateDialog({ isOpen, onClose, onConfirm, userName }: Props) {
  const { t: tt } = useTranslation(["employees", "users", "common", "langostin"]);
  const reduced = usePrefersReducedMotion();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setSubmitting(false);
    }
  }, [isOpen]);

  // El diálogo se monta en un portal: se enfoca Cancelar (el primer botón) en el siguiente cuadro.
  useEffect(() => {
    if (!isOpen) return;
    const id = window.requestAnimationFrame(() => {
      actionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    });
    return () => window.cancelAnimationFrame(id);
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

  const title = tt("employees:deactivate.title", { name: userName ?? "" });

  return (
    <ITDialog isOpen={isOpen} onClose={() => !submitting && onClose()} className="max-w-md">
      <div className="flex items-start gap-4" role="alertdialog" aria-label={title}>
        <div className="shrink-0">
          <Langostin anim="help" size={64} animated={!reduced} label={tt("langostin:guide.label")} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          <p className="m-0 mt-1 text-sm text-slate-500 dark:text-slate-400">{tt("employees:deactivate.consequence")}</p>
        </div>
      </div>

      <div className="mt-4">
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

      <div ref={actionsRef} className="mt-6 flex justify-end gap-3">
        <ITButton
          label={tt("common:actions.cancel")}
          variant="outlined"
          color="gray"
          size="sm"
          className="!rounded-full"
          onClick={onClose}
          disabled={submitting}
        />
        <ITButton
          label={submitting ? i18n.t("common:labels.processing") : tt("employees:detail.deactivate")}
          variant="rounded"
          color="danger"
          size="sm"
          onClick={handleConfirm}
          disabled={!isValid || submitting}
        />
      </div>
    </ITDialog>
  );
}
