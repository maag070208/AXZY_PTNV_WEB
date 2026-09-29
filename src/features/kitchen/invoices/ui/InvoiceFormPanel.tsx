import { KpiTile } from "@shared/ui/kpi-tile";
import { ITAlert, ITBadget, ITButton, ITDatePicker, ITFlex, ITGrid, ITInput,
  ITInputNumber, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaCoins, FaListUl, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { PanelCard } from "@shared/ui/panel-card";
import { useInvoiceForm } from "../model/useInvoiceForm";
import { numOrNull, numText } from "@entities/kitchen";

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Registrar una factura de proveedor (con o sin orden de compra). */
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
        <KpiTile label={t("invoices.kpi.total")} value={money(fx.total)} icon={<FaCoins size={15} />} tone="emerald" />
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
                <ITGrid item xs={12} md={6}>
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
                <ITGrid item xs={6} md={3}>
                  <ITInputNumber decimals={2} prefix="$"
                    name={`invCost-${line.key}`}
                    label={t("invoices.form.unitCost")}
                    value={numOrNull(line.unitCost)}
                    onChange={(v) => fx.patchLine(line.key, { unitCost: numText(v) })}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={1}>
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
