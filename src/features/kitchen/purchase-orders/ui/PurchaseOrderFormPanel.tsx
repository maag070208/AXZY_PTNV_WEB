import { ITAlert, ITBadget, ITButton, ITCard, ITDatePicker, ITFlex, ITGrid, ITInput, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { SectionHeader } from "@shared/ui/section-header";
import { SummaryBadge } from "@shared/ui/summary-badge";
import { fmtQty, type KitchenItemRow } from "@entities/kitchen";
import { usePurchaseOrderForm } from "../model/usePurchaseOrderForm";

const suggestedFor = (item: KitchenItemRow): number => {
  const target = item.maxStock ?? item.minStock * 2;
  const raw = Math.max(0, target - item.available);
  return item.unit.whole ? Math.ceil(raw) : Math.round(raw * 1000) / 1000;
};

/** Alta/edición de una orden de compra (el borrador es editable). */
export default function PurchaseOrderFormPanel({ id }: { id?: string }) {
  const fx = usePurchaseOrderForm(id);
  const { t } = fx;

  if (fx.loading) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const total = fx.lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const orderedUnits = fx.lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITText className="text-[13px] font-black text-slate-800">
          {id ? t("purchaseOrders.edit") : t("purchaseOrders.new")}
        </ITText>
        <ITFlex align="center" gap={2}>
          <SummaryBadge label={t("purchaseOrders.summary.items")} value={String(fx.lines.length)} />
          <SummaryBadge label={t("purchaseOrders.summary.ordered")} value={fmtQty(orderedUnits)} />
          <SummaryBadge label={t("purchaseOrders.summary.total")} value={`$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
        </ITFlex>
      </ITFlex>

      <ITCard className="!overflow-hidden !p-0 border border-slate-200 shadow-sm">
        <SectionHeader icon={<FaSave size={14} />} title={t("purchaseOrders.title")} description={t("purchaseOrders.description")} />
        <div className="p-5">
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITSearchSelect
                name="poSupplier"
                label={t("purchaseOrders.form.supplier")}
                options={fx.suppliers.map((s) => ({ value: s.id, label: s.name }))}
                value={fx.supplierId}
                onChange={(value) => fx.setSupplierId(String(value))}
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITDatePicker
                name="poExpectedAt"
                label={t("purchaseOrders.form.expectedAt")}
                value={fx.expectedAt ?? undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value instanceof Date) fx.setExpectedAt(value);
                }}
                className="w-full"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="poNotes"
                label={t("purchaseOrders.form.notes")}
                value={fx.notes}
                onChange={(event) => fx.setNotes(event.target.value)}
              />
            </ITGrid>
          </ITGrid>
        </div>
      </ITCard>

      <ITCard className="!overflow-hidden !p-0 border border-slate-200 shadow-sm">
        <SectionHeader
          icon={<FaPlus size={14} />}
          title={t("purchaseOrders.form.itemsTitle")}
          right={
            <ITButton variant="outlined" color="primary" size="sm" onClick={fx.addLine}>
              <ITFlex align="center" gap={1}>
                <FaPlus size={10} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.form.addItem")}</ITText>
              </ITFlex>
            </ITButton>
          }
        />
        <div className="p-5">
          <ITFlex direction="column" gap={3}>
            {fx.lines.map((line) => {
              const item = fx.itemById.get(line.itemId);
              return (
                <ITGrid key={line.key} container columns={12} spacing={3} className="items-end">
                  <ITGrid item xs={12} md={4}>
                    <ITSearchSelect
                      name={`poItem-${line.key}`}
                      label={t("purchaseOrders.form.item")}
                      options={fx.items.map((it) => ({ value: it.id, label: `${it.code} · ${it.name}` }))}
                      value={line.itemId}
                      onChange={(value) => fx.patchLine(line.key, { itemId: String(value) })}
                    />
                  </ITGrid>
                  <ITGrid item xs={6} md={2}>
                    <ITInput
                      name={`poQty-${line.key}`}
                      type="number"
                      label={item ? `${t("purchaseOrders.form.quantity")} (${item.unit.name})` : t("purchaseOrders.form.quantity")}
                      value={line.quantity}
                      onChange={(event) => fx.patchLine(line.key, { quantity: event.target.value })}
                    />
                  </ITGrid>
                  <ITGrid item xs={6} md={2}>
                    <ITInput
                      name={`poCost-${line.key}`}
                      type="number"
                      label={t("purchaseOrders.form.unitCost")}
                      value={line.unitCost}
                      onChange={(event) => fx.patchLine(line.key, { unitCost: event.target.value })}
                    />
                  </ITGrid>
                  <ITGrid item xs={10} md={3}>
                    {item && (
                      <ITFlex gap={2} wrap="wrap" className="pb-2">
                        <ITText className="text-[11px] text-slate-500">
                          {t("purchaseOrders.form.available", { qty: fmtQty(item.available) })}
                        </ITText>
                        <ITText className="text-[11px] text-emerald-600">
                          {t("purchaseOrders.form.suggested", { qty: fmtQty(suggestedFor(item)) })}
                        </ITText>
                        <ITBadget color="gray" size="sm">
                          {item.unit.name}
                        </ITBadget>
                      </ITFlex>
                    )}
                  </ITGrid>
                  <ITGrid item xs={2} md={1}>
                    <ITFlex justify="end">
                      <ITButton variant="text" color="error" size="sm" onClick={() => fx.removeLine(line.key)}>
                        <FaTrash size={12} />
                      </ITButton>
                    </ITFlex>
                  </ITGrid>
                </ITGrid>
              );
            })}
            {fx.lines.length === 0 && <ITText className="text-[11px] text-slate-400">{t("purchaseOrders.form.emptyItems")}</ITText>}
          </ITFlex>
        </div>
      </ITCard>

      <ITFlex align="center" justify="end" gap={2}>
        <ITButton variant="outlined" color="secondary" onClick={fx.cancel}>
          {t("purchaseOrders.form.cancel")}
        </ITButton>
        <ITButton variant="filled" color="primary" disabled={!fx.canSave || fx.saving} onClick={() => void fx.save()}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{t("purchaseOrders.form.save")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
