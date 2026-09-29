import { KpiTile } from "@shared/ui/kpi-tile";
import { ITAlert, ITBadget, ITButton, ITDatePicker, ITFlex, ITGrid, ITInput,
  ITInputNumber, ITSearchSelect, ITSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaCoins, FaListUl, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { PanelCard } from "@shared/ui/panel-card";
import { useInvoiceForm } from "../model/useInvoiceForm";
import { fmtMoney, fmtRate, numOrNull, numText } from "@entities/kitchen";

/** Diferencia capturada vs calculada; en ámbar si no cuadra. */
function Diff({ value }: { value: number | null }) {
  if (value == null) return <ITText className="block text-[10px] text-slate-400">—</ITText>;
  const off = Math.abs(value) > 0.005;
  return (
    <ITText className={`block text-[10px] font-bold ${off ? "text-amber-600" : "text-emerald-600"}`}>
      {off ? fmtMoney(value) : "✓"}
    </ITText>
  );
}

/** Registrar una factura de proveedor (con o sin orden de compra) y cotejar su IVA. */
export default function InvoiceFormPanel() {
  const fx = useInvoiceForm();
  const { t } = fx;

  if (fx.loading) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const taxOptions = [{ value: "", label: t("invoices.form.noTax") }, ...fx.taxRates.map((r) => ({ value: r.id, label: fmtRate(r.rate) }))];

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex align="center" gap={2}>
          {fx.purchaseOrderId && (
            <ITBadget color="info" size="sm">
              {t("invoices.columns.purchaseOrder")}
            </ITBadget>
          )}
        </ITFlex>
      </ITFlex>
      <div className="grid !grid-cols-1 gap-3 sm:!grid-cols-2">
        <KpiTile label={t("invoices.kpi.lines")} value={fx.lines.length} icon={<FaListUl size={15} />} tone="violet" />
        <KpiTile label={t("invoices.kpi.total")} value={fmtMoney(fx.computed.total)} icon={<FaCoins size={15} />} tone="emerald" />
      </div>

      <PanelCard title={t("invoices.title")} description={t("invoices.costUpdated")}>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITSearchSelect
                name="invSupplier"
                label={t("invoices.form.supplier")}
                options={fx.suppliers.map((s) => ({ value: s.id, label: s.name }))}
                value={fx.supplierId}
                onChange={(value) => fx.setSupplierId(String(value))}
              />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="invNumber" label={t("invoices.form.number")} value={fx.number} onChange={(e) => fx.setNumber(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="invUuid" label={t("invoices.form.uuid")} value={fx.uuid} onChange={(e) => fx.setUuid(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITDatePicker
                name="invDate"
                label={t("invoices.form.date")}
                value={fx.date}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v instanceof Date) fx.setDate(v);
                }}
                className="w-full"
              />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="invNotes" label={t("invoices.form.notes")} value={fx.notes} onChange={(e) => fx.setNotes(e.target.value)} />
            </ITGrid>
          </ITGrid>
        </PanelCard>

      <PanelCard title={t("invoices.form.itemsTitle")} actions={<ITButton variant="outlined" color="primary" size="sm" onClick={fx.addLine}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={10} />
                <ITText className="font-bold text-[11px]">{t("invoices.form.addItem")}</ITText>
              </ITFlex>
            </ITButton>}>
          <ITFlex direction="column" gap={3}>
            {fx.lines.map((line) => (
              <ITGrid key={line.key} container columns={12} spacing={3} className="items-end">
                <ITGrid item xs={12} md={4}>
                  <ITSearchSelect
                    name={`invItem-${line.key}`}
                    label={t("invoices.form.item")}
                    options={fx.items.map((it) => ({ value: it.id, label: `${it.code} · ${it.name}` }))}
                    value={line.itemId}
                    onChange={(value) => fx.patchLine(line.key, { itemId: String(value) })}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITInputNumber decimals={2}
                    name={`invQty-${line.key}`}
                    label={t("invoices.form.quantity")}
                    value={numOrNull(line.quantity)}
                    onChange={(v) => fx.patchLine(line.key, { quantity: numText(v) })}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITInputNumber decimals={2} prefix="$"
                    name={`invCost-${line.key}`}
                    label={t("invoices.form.unitCost")}
                    value={numOrNull(line.unitCost)}
                    onChange={(v) => fx.patchLine(line.key, { unitCost: numText(v) })}
                  />
                </ITGrid>
                <ITGrid item xs={10} md={3}>
                  <ITSelect
                    name={`invTax-${line.key}`}
                    label={t("invoices.form.taxRate")}
                    options={taxOptions}
                    value={line.taxRateId}
                    onChange={(e) => fx.patchLine(line.key, { taxRateId: e.target.value })}
                  />
                </ITGrid>
                <ITGrid item xs={2} md={1}>
                  <ITFlex justify="end">
                    <ITButton variant="text" color="error" size="sm" onClick={() => fx.removeLine(line.key)}>
                      <FaTrash size={12} />
                    </ITButton>
                  </ITFlex>
                </ITGrid>
              </ITGrid>
            ))}
            {fx.lines.length === 0 && <ITText className="text-[11px] text-slate-400">{t("invoices.form.emptyItems")}</ITText>}
          </ITFlex>
        </PanelCard>

      <PanelCard title={t("invoices.totals.title")} description={t("invoices.totals.hint")}>
        <ITGrid container columns={12} spacing={4} className="items-end">
          <ITGrid item xs={12} md={6}>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <ITFlex justify="between" className="py-1">
                <ITText className="text-[12px] text-slate-500">{t("invoices.totals.subtotal")}</ITText>
                <ITText className="text-[13px] font-bold tabular-nums text-slate-800">{fmtMoney(fx.computed.subtotal)}</ITText>
              </ITFlex>
              {fx.computed.taxes.map((tx) => (
                <ITFlex key={tx.rate} justify="between" className="py-1">
                  <ITText className="text-[12px] text-slate-500">{t("invoices.totals.taxLine", { rate: fmtRate(tx.rate) })}</ITText>
                  <ITText className="text-[13px] tabular-nums text-slate-700">{fmtMoney(tx.amount)}</ITText>
                </ITFlex>
              ))}
              <ITFlex justify="between" className="mt-2 border-t border-slate-200 pt-2">
                <ITText className="text-[13px] font-black text-slate-900">{t("invoices.totals.total")}</ITText>
                <ITText className="text-[18px] font-black tabular-nums text-slate-900">{fmtMoney(fx.computed.total)}</ITText>
              </ITFlex>
            </div>
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITGrid container columns={12} spacing={3} className="items-start">
              <ITGrid item xs={4}>
                <ITInputNumber
                  name="invCapturedSubtotal"
                  label={t("invoices.totals.capturedSubtotal")}
                  decimals={2}
                  prefix="$"
                  value={numOrNull(fx.capturedSubtotal)}
                  onChange={(v) => fx.setCapturedSubtotal(numText(v))}
                />
                <Diff value={fx.subtotalDiff} />
              </ITGrid>
              <ITGrid item xs={4}>
                <ITInputNumber
                  name="invCapturedTax"
                  label={t("invoices.totals.capturedTax")}
                  decimals={2}
                  prefix="$"
                  value={numOrNull(fx.capturedTax)}
                  onChange={(v) => fx.setCapturedTax(numText(v))}
                />
                <Diff value={fx.taxDiff} />
              </ITGrid>
              <ITGrid item xs={4}>
                <ITInputNumber
                  name="invCapturedTotal"
                  label={t("invoices.totals.capturedTotal")}
                  decimals={2}
                  prefix="$"
                  value={numOrNull(fx.capturedTotal)}
                  onChange={(v) => fx.setCapturedTotal(numText(v))}
                />
                <Diff value={fx.totalDiff} />
              </ITGrid>
            </ITGrid>
            <ITText className="mt-2 block text-[10px] text-slate-400">{t("invoices.totals.diffHint")}</ITText>
          </ITGrid>
        </ITGrid>
      </PanelCard>

      <ITFlex align="center" justify="end" gap={2}>
        <ITButton variant="outlined" color="secondary" onClick={fx.cancel}>
          {t("invoices.form.cancel")}
        </ITButton>
        <ITButton variant="filled" color="primary" disabled={!fx.canSave || fx.saving} onClick={() => void fx.save()}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{t("invoices.form.save")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
