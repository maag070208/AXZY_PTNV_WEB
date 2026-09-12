import {
  ITAlert,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITFlex,
  ITInput,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { CartaResponsiva } from "@entities/carta";

interface Props {
  carta: CartaResponsiva;
  isReturned: boolean;
  returnedBy: string;
  onReturnedByChange: (v: string) => void;
  returnCondition: string;
  onReturnConditionChange: (v: string) => void;
  submitting: boolean;
  error: string | null;
  onDismissError: () => void;
  confirmUndo: boolean;
  onConfirmUndoChange: (v: boolean) => void;
  onReturn: () => Promise<string | null>;
  onUndo: () => Promise<string | null>;
  onNavigateToCartas: () => void;
}

export default function DevolverCartaForm({
  carta,
  isReturned,
  returnedBy,
  onReturnedByChange,
  returnCondition,
  onReturnConditionChange,
  submitting,
  error,
  onDismissError,
  confirmUndo,
  onConfirmUndoChange,
  onReturn,
  onUndo,
  onNavigateToCartas,
}: Props) {
  const { t } = useTranslation("cartas");

  return (
    <ITStack direction="column" spacing={6}>
      {isReturned && (
        <ITAlert variant="success" title={t("return.registered")}>
          <ITStack direction="column" spacing={1}>
            <ITText as="span" muted>
              {t("return.date")}:{" "}
              {carta.returnDate
                ? new Date(carta.returnDate).toLocaleDateString("es-MX")
                : "—"}
            </ITText>
            <ITText as="span" muted>
              {t("return.keptBy")}: {carta.returnedBy}
            </ITText>
            <ITText as="span" muted>
              {t("return.conditionsLabel")}: {carta.returnCondition}
            </ITText>
          </ITStack>
        </ITAlert>
      )}

      {error && (
        <ITAlert variant="error" dismissible onDismiss={onDismissError}>
          {error}
        </ITAlert>
      )}

      {!isReturned && (
        <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
          <ITStack direction="column" spacing={4}>
            <ITInput
              name="returnedBy"
              label={t("return.guard")}
              value={returnedBy}
              onChange={(e) => onReturnedByChange(e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
            />
            <ITTextarea
              name="returnCondition"
              label={t("return.conditions")}
              value={returnCondition}
              onChange={onReturnConditionChange}
              placeholder="Bueno, con detalles menores en pantalla..."
              rows={4}
            />

            <ITFlex justify="end" gap={2}>
              <ITButton variant="outlined" onClick={onNavigateToCartas}>
                {t("return.cancel")}
              </ITButton>
              <ITButton
                variant="filled"
                color="primary"
                onClick={() => {
                  onReturn().then((ok) => ok && onNavigateToCartas());
                }}
                disabled={
                  submitting ||
                  !returnedBy.trim() ||
                  !returnCondition.trim()
                }
              >
                <ITFlex align="center" gap={1}>
                  <FaUndo size={12} />
                  <ITText className="font-bold text-[11px]">
                    {submitting ? t("return.processing") : t("return.markReturned")}
                  </ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITStack>
        </ITCard>
      )}

      {isReturned && (
        <ITFlex justify="end">
          <ITButton
            variant="outlined"
            color="warning"
            onClick={() => onConfirmUndoChange(true)}
            disabled={submitting}
          >
            <ITFlex align="center" gap={1}>
              <FaUndo size={12} />
              <ITText className="font-bold text-[11px]">{t("return.undo")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      )}

      <ITConfirmDialog
        isOpen={confirmUndo}
        onClose={() => onConfirmUndoChange(false)}
        onConfirm={() => {
          onUndo().then((ok) => ok && onNavigateToCartas());
        }}
        title={t("return.undoDialogTitle")}
        message={t("return.undoDialogMessage")}
        confirmLabel={t("return.undoDialogTitle")}
        cancelLabel={t("return.back")}
        variant="warning"
        loading={submitting}
      />
    </ITStack>
  );
}