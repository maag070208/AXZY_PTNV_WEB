import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDatePicker, ITDialog, ITFlex, ITGrid, ITInput,
  ITInputNumber, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { fmtQty, numOrNull, numText, type PurchaseOrderDetail, type PurchaseOrderReceiveInput } from "@entities/kitchen";
import { useRequestKey } from "@shared/lib/useRequestKey";

interface Draft {
  quantity: string;
  lotCode: string;
  expiresAt: Date | null;
  unitCost: string;
}

const localDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface Props {
  open: boolean;
  order: PurchaseOrderDetail;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: PurchaseOrderReceiveInput, key: string) => void;
}

/** Recepción de una orden: por cada renglón pendiente, cuánto llega + lote/caducidad. */
export default function PurchaseOrderReceiveDialog({ open, order, busy, onClose, onSubmit }: Props) {
  const { t } = useTranslation("kitchen");
  const requestKey = useRequestKey();
  const pending = order.lines.filter((l) => l.pendingQuantity > 0);
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, Draft> = {};
    for (const line of pending) {
      next[line.id] = {
        quantity: String(line.pendingQuantity),
        lotCode: "",
        expiresAt: null,
        unitCost: line.unitCost == null ? "" : String(line.unitCost),
      };
    }
    setDraft(next);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.id]);

  const patch = (lineId: string, p: Partial<Draft>) =>
    setDraft((current) => ({ ...current, [lineId]: { ...current[lineId], ...p } }));

  const submit = () => {
    const inputs: PurchaseOrderReceiveInput["lines"] = [];
    for (const line of pending) {
      const d = draft[line.id];
      const quantity = Number(d?.quantity ?? 0);
      if (!(quantity > 0)) continue;
      if (quantity > line.pendingQuantity + 1e-6) {
        setError(t("purchaseOrders.overPending", { pending: fmtQty(line.pendingQuantity) }));
        return;
      }
      if (line.item.tracksExpiry && !d?.expiresAt) {
        setError(t("stockIn.expiryHint"));
        return;
      }
      inputs.push({
        lineId: line.id,
        quantity,
        ...(d.lotCode ? { lotCode: d.lotCode } : {}),
        expiresAt: d.expiresAt ? localDay(d.expiresAt) : null,
        unitCost: d.unitCost === "" ? null : Number(d.unitCost),
      });
    }
    if (inputs.length === 0) {
      setError(t("purchaseOrders.receiveNothing"));
      return;
    }
    const input: PurchaseOrderReceiveInput = { lines: inputs };
    onSubmit(input, requestKey(input));
  };

  return (
    <ITDialog isOpen={open} onClose={onClose} title={`${t("purchaseOrders.receiveTitle")} · ${order.number}`}>
      <ITFlex direction="column" gap={3}>
        <ITText className="text-[11px] text-slate-500">{t("purchaseOrders.receiveHint")}</ITText>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}

        {pending.length === 0 ? (
          <ITText className="text-[12px] text-slate-400">{t("purchaseOrders.receiveNothing")}</ITText>
        ) : (
          <ITFlex direction="column" gap={3}>
            {pending.map((line) => {
              const d = draft[line.id] ?? { quantity: "", lotCode: "", expiresAt: null, unitCost: "" };
              return (
                <div key={line.id} className="rounded-xl border border-slate-200 p-3">
                  <ITFlex align="center" justify="between" gap={2} className="mb-2">
                    <ITFlex align="center" gap={2}>
                      <ITText className="text-[12px] font-black text-slate-800">{line.item.name}</ITText>
                      <ITText className="text-[10px] font-bold uppercase text-slate-400">{line.item.unit.name}</ITText>
                    </ITFlex>
                    <ITText className="text-[11px] text-slate-500">
                      {t("purchaseOrders.columns.pending")}: {fmtQty(line.pendingQuantity)}
                    </ITText>
                  </ITFlex>
                  <ITGrid container columns={12} spacing={3} className="items-end">
                    <ITGrid item xs={6} md={3}>
                      <ITInputNumber decimals={2}
                        name={`rcv-q-${line.id}`}
                        label={t("purchaseOrders.receiveQuantity")}
                        value={numOrNull(d.quantity)}
                        onChange={(v) => patch(line.id, { quantity: numText(v) })}
                      />
                    </ITGrid>
                    <ITGrid item xs={6} md={3}>
                      <ITInput
                        name={`rcv-lot-${line.id}`}
                        label={t("purchaseOrders.receiveLot")}
                        value={d.lotCode}
                        onChange={(e) => patch(line.id, { lotCode: e.target.value })}
                      />
                    </ITGrid>
                    <ITGrid item xs={6} md={3}>
                      {line.item.tracksExpiry ? (
                        <ITDatePicker
                          name={`rcv-exp-${line.id}`}
                          label={t("purchaseOrders.receiveExpiry")}
                          value={d.expiresAt ?? undefined}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v instanceof Date) patch(line.id, { expiresAt: v });
                          }}
                          className="w-full"
                        />
                      ) : (
                        <ITFlex direction="column" gap={1}>
                          <ITText className="text-[11px] font-bold text-slate-600">{t("purchaseOrders.receiveExpiry")}</ITText>
                          <ITText className="text-[11px] text-slate-400">{t("stockIn.noExpiry")}</ITText>
                        </ITFlex>
                      )}
                    </ITGrid>
                    <ITGrid item xs={6} md={3}>
                      <ITInputNumber decimals={2} prefix="$"
                        name={`rcv-cost-${line.id}`}
                        label={t("purchaseOrders.form.unitCost")}
                        value={numOrNull(d.unitCost)}
                        onChange={(v) => patch(line.id, { unitCost: numText(v) })}
                      />
                    </ITGrid>
                  </ITGrid>
                </div>
              );
            })}
          </ITFlex>
        )}

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={onClose}>
            {t("common.cancel")}
          </ITButton>
          <ITButton variant="filled" color="primary" disabled={busy || pending.length === 0} onClick={submit}>
            <ITText className="font-bold text-[11px]">{t("purchaseOrders.receiveSubmit")}</ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
