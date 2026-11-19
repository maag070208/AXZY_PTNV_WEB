import { useEffect, useState } from "react";
import { ITAlert, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { LuUserX } from "react-icons/lu";
import { DialogHeader } from "../dialog-header";
import { DialogFooter } from "../dialog-footer";
import GuestChargeFields, { type GuestChargeValue } from "./GuestChargeFields";

export interface GuestLossDialogResult extends GuestChargeValue {
  guestName?: string;
  notes?: string | null;
}

interface Props {
  open: boolean;
  /** Resumen de lo que se convierte (p. ej. "3 × Toalla de baño · hab. 105"). */
  summary: string;
  /** Pide el nombre del huésped (los adicionales no lo guardan; el préstamo sí). */
  askGuest: boolean;
  onClose: () => void;
  /** Debe lanzar el error para que el diálogo lo muestre y siga abierto. */
  onSubmit: (value: GuestLossDialogResult) => Promise<void>;
}

/** Convierte un préstamo no devuelto o un adicional faltante en pérdida de huésped, sin recapturar datos. */
export default function GuestLossDialog({ open, summary, askGuest, onClose, onSubmit }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const [guest, setGuest] = useState("");
  const [charge, setCharge] = useState<GuestChargeValue>({ chargeStatus: "NOT_CHARGED", chargeAmount: null });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setGuest("");
    setCharge({ chargeStatus: "NOT_CHARGED", chargeAmount: null });
    setNotes("");
    setError(null);
  }, [open]);

  const valid = !askGuest || guest.trim().length > 0;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...charge, ...(askGuest ? { guestName: guest.trim() } : {}), notes: notes.trim() || null });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={open} onClose={onClose}>
      <DialogHeader icon={<LuUserX />} title={t("guestLoss.convert.title")} subtitle={t("guestLoss.convert.subtitle")} />
      <ITFlex direction="column" gap={3} className="min-w-[380px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITText>{summary}</ITText>
        {askGuest && <ITInput name="guestLossGuest" label={t("guestLoss.guestName")} value={guest} onChange={(e) => setGuest(e.target.value)} />}
        <GuestChargeFields value={charge} onChange={setCharge} />
        <ITInput name="guestLossNotes" label={t("guestLoss.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <DialogFooter onCancel={onClose} onConfirm={() => void submit()} confirmLabel={t("guestLoss.convert.confirm")} busy={busy} disabled={!valid} />
      </ITFlex>
    </ITDialog>
  );
}
