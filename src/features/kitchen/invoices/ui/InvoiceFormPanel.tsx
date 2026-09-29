import { ITAlert, ITBadget, ITButton, ITCard, ITDatePicker, ITFlex, ITGrid, ITInput, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { SectionHeader } from "@shared/ui/section-header";
import { SummaryBadge } from "@shared/ui/summary-badge";
import { useInvoiceForm } from "../model/useInvoiceForm";

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
          <ITText className="text-[13px] font-black text-slate-800">{t("invoices.new")}</ITText>
          {fx.purchaseOrderId && (
            <ITBadget color="info" size="sm">
              {t("invoices.columns.purchaseOrder")}
            </ITBadget>
          )}
        </ITFlex>
        <SummaryBadge label={t("invoices.columns.total")} value={money(fx.total)} />
      </ITFlex>

      <ITCard className="!overflow-hidden !p-0 border border-slate-200 shadow-sm">
        <SectionHeader icon={<FaSave size={14} />} title={t("invoices.title")} description={t("invoices.costUpdated")} />
        <div className="p-5">
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
        </div>
      </ITCard>

      <ITCard className="!overflow-hidden !p-0 border border-slate-200 shadow-sm">
        <SectionHeader
          icon={<FaPlus size={14} />}
          title={t("invoices.form.itemsTitle")}
          right={
            <ITButton variant="outlined" color="primary" size="sm" onClick={fx.addLine}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={10} />
                <ITText className="font-bold text-[11px]">{t("invoices.form.addItem")}</ITText>
              </ITFlex>
            </ITButton>
          }
        />
        <div className="p-5">
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
                  <ITInput
                    name={`invQty-${line.key}`}
                    type="number"
                    label={t("invoices.form.quantity")}
                    value={line.quantity}
                    onChange={(e) => fx.patchLine(line.key, { quantity: e.target.value })}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITInput
                    name={`invCost-${line.key}`}
                    type="number"
                    label={t("invoices.form.unitCost")}
                    value={line.unitCost}
                    onChange={(e) => fx.patchLine(line.key, { unitCost: e.target.value })}
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
        </div>
      </ITCard>

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
