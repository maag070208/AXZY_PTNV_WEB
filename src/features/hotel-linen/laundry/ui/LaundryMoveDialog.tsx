import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInputNumber, ITSegmentedControl, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  LAUNDRY_TRANSITIONS,
  laundryApi,
  type LaundryBoardProduct,
  type LaundryMove,
  type LaundryStage,
  type LaundryTreatment,
} from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { fmt } from "../lib";

interface Props {
  /** Producto a mover; `null` = cerrado. */
  row: LaundryBoardProduct | null;
  onClose: () => void;
  onDone: () => void;
}

/** "Pasar a…": mueve piezas de una etapa a otra respetando las transiciones válidas. */
export default function LaundryMoveDialog({ row, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [qty, setQty] = useState<number | null>(null);
  const [lotId, setLotId] = useState("");
  const [treatment, setTreatment] = useState<LaundryTreatment>("ORDINARY");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Etapas de origen con existencia y con alguna transición posible.
  const fromStages = row ? Object.keys(LAUNDRY_TRANSITIONS).filter((s) => (row.stages[s] ?? 0) > 0) : [];

  useEffect(() => {
    if (!row) return;
    const first = Object.keys(LAUNDRY_TRANSITIONS).find((s) => (row.stages[s] ?? 0) > 0) ?? "";
    setFrom(first);
    setTo(first ? LAUNDRY_TRANSITIONS[first][0] : "");
    setQty(null);
    setLotId("");
    setTreatment("ORDINARY");
    setError(null);
  }, [row]);

  const pickFrom = (stage: string) => {
    setFrom(stage);
    setTo(LAUNDRY_TRANSITIONS[stage]?.[0] ?? "");
    setLotId("");
    setQty(null);
  };

  const available = row && from ? (lotId ? (row.lots.find((l) => l.lotId === lotId)?.stages[from] ?? 0) : (row.stages[from] ?? 0)) : 0;
  const lotOptions = row && from ? row.lots.filter((l) => (l.stages[from] ?? 0) > 0) : [];
  const valid = !!row && !!from && !!to && qty !== null && qty > 0 && qty <= available;
  const showTreatment = from === "DIRTY" && to === "IN_PROCESS";

  const submit = async () => {
    if (!row || !valid) return;
    setBusy(true);
    setError(null);
    try {
      const move: LaundryMove = {
        productId: row.product.id,
        lotId: lotId || null,
        quantity: qty as number,
        from: from as LaundryMove["from"],
        to: to as LaundryMove["to"],
        treatment: showTreatment ? treatment : null,
      };
      await laundryApi.process([move]);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={row !== null} onClose={onClose} title={t("laundry.move.title", { name: row?.product.name ?? "" })}>
      <ITFlex direction="column" gap={3} className="min-w-[420px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {fromStages.length === 0 ? (
          <ITText muted>{t("laundry.move.nothing")}</ITText>
        ) : (
          <>
            <ITSelect
              name="moveFrom"
              label={t("laundry.move.from")}
              options={fromStages.map((s) => ({ value: s, label: `${tt(`laundry.stage.${s}`)} (${fmt(row?.stages[s] ?? 0)})` }))}
              value={from}
              onChange={(e) => pickFrom(e.target.value)}
            />
            <ITSelect
              name="moveTo"
              label={t("laundry.move.to")}
              options={(LAUNDRY_TRANSITIONS[from] ?? []).map((s: LaundryStage) => ({ value: s, label: tt(`laundry.stage.${s}`) }))}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            {showTreatment && (
              <ITSegmentedControl
                size="sm"
                options={[
                  { value: "ORDINARY", label: t("laundry.treatment.ORDINARY") },
                  { value: "STAIN", label: t("laundry.treatment.STAIN") },
                ]}
                value={treatment}
                onChange={(v) => setTreatment(v as LaundryTreatment)}
              />
            )}
            <ITSelect
              name="moveLot"
              label={t("laundry.move.lot")}
              options={[
                { value: "", label: t("laundry.move.lotAuto") },
                ...lotOptions.map((l) => ({ value: l.lotId, label: `${l.code} (${fmt(l.stages[from] ?? 0)})` })),
              ]}
              value={lotId}
              onChange={(e) => {
                setLotId(e.target.value);
                setQty(null);
              }}
            />
            <ITInputNumber
              name="moveQty"
              label={t("laundry.move.quantity", { max: fmt(available) })}
              decimals={0}
              min={0}
              value={qty}
              onChange={(v) => setQty(v ?? null)}
            />
            {qty !== null && qty > available && <ITAlert variant="warning">{t("laundry.move.over", { max: fmt(available) })}</ITAlert>}
            <ITFlex justify="end" gap={2}>
              <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
              <ITButton variant="filled" color="primary" label={t("laundry.move.confirm")} disabled={busy || !valid} onClick={() => void submit()} />
            </ITFlex>
          </>
        )}
      </ITFlex>
    </ITDialog>
  );
}
