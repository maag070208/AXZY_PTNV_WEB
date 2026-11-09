import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITInputNumber, ITSegmentedControl, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, type EquipmentCondition, type EquipmentLoan } from "@entities/hotel-linen";

interface Props {
  loan: EquipmentLoan | null;
  onClose: () => void;
  onDone: () => void;
}

/** Retiro del equipo con su estado: B (bueno), D (dañado) o F (faltante), y cargo sugerido. */
export default function ReturnEquipmentDialog({ loan, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const [condition, setCondition] = useState<EquipmentCondition>("GOOD");
  const [charge, setCharge] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCondition("GOOD");
    setCharge(null);
    setNotes("");
    setError(null);
  }, [loan]);

  const submit = async () => {
    if (!loan) return;
    setBusy(true);
    setError(null);
    try {
      await receptionApi.returnEquipment(loan.id, { condition, chargeAmount: condition === "GOOD" ? null : charge, notes: notes.trim() || null });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={loan !== null} onClose={onClose} title={t("equipment.return.title", { tag: loan?.unit.tag ?? "" })}>
      <ITFlex direction="column" gap={3} className="min-w-[400px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITSegmentedControl
          size="sm"
          options={[
            { value: "GOOD", label: t("equipment.return.GOOD") },
            { value: "DAMAGED", label: t("equipment.return.DAMAGED") },
            { value: "MISSING", label: t("equipment.return.MISSING") },
          ]}
          value={condition}
          onChange={(v) => setCondition(v as EquipmentCondition)}
        />
        {condition !== "GOOD" && (
          <ITInputNumber name="equipCharge" label={t("equipment.return.charge")} decimals={2} min={0} value={charge} onChange={(v) => setCharge(v ?? null)} />
        )}
        {condition === "DAMAGED" && <ITText muted>{t("equipment.return.ticketHint")}</ITText>}
        <ITInput name="equipNotes" label={t("equipment.return.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("equipment.return.confirm")} disabled={busy} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
