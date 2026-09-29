import type { ReactNode } from "react";
import {
  ITAlert,
  ITButton,
  ITCheckbox,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaPhone, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { PanelCard } from "@shared/ui/panel-card";
import { dyn } from "@shared/i18n/dyn";
import { fmtMoney, fmtQty, fmtRate, numOrNull, numText, type KitchenItemRow } from "@entities/kitchen";
import { usePurchaseOrderForm } from "../model/usePurchaseOrderForm";

const suggestedFor = (item: KitchenItemRow): number => {
  const target = item.maxStock ?? item.minStock * 2;
  const raw = Math.max(0, target - item.available);
  return item.unit.whole ? Math.ceil(raw) : Math.round(raw * 1000) / 1000;
};

/** Columnas del detalle: artículo · cantidad · costo · IVA · subtotal · IVA $ · importe · quitar. */
const DETAIL_GRID =
  "grid grid-cols-[minmax(220px,2.4fr)_minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(90px,.8fr)_minmax(80px,.7fr)_minmax(100px,.9fr)_40px] items-start gap-3";
const TH = "text-[10px] font-black uppercase tracking-widest text-slate-400";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={`${TH} mb-1`}>{label}</p>
      <div className="truncate text-[13px] font-bold text-slate-800">{children}</div>
    </div>
  );
}

/**
 * Orden de compra en dos partes, como el documento real: encabezado (folio que
 * asigna el sistema, fecha, quién la elabora, proveedor, entrega) y detalle con
 * cantidad, costo antes de IVA y la tasa de IVA de cada renglón; al final los
 * totales con el IVA desglosado por tasa.
 */
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

  const supplier = fx.supplier;
  const contact = supplier?.contacts.find((c) => c.isPrimary) ?? null;
  const days = (n: number | null) => (n == null ? "—" : n === 0 ? t("suppliers.hints.cash") : t("suppliers.hints.days", { count: n }));
  const taxOptions = [{ value: "", label: t("purchaseOrders.form.noTax") }, ...fx.taxRates.map((r) => ({ value: r.id, label: fmtRate(r.rate) }))];

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {/* Encabezado */}
      <PanelCard title={t("purchaseOrders.form.headerTitle")} description={t("purchaseOrders.form.headerHint")}>
        <div className="grid !grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 md:!grid-cols-4">
          <Field label={t("purchaseOrders.columns.number")}>
            {fx.header.number ? <span className="font-mono">{fx.header.number}</span> : <span className="text-slate-400">{t("purchaseOrders.form.folioPending")}</span>}
          </Field>
          <Field label={t("purchaseOrders.form.date")}>
            {(fx.header.createdAt ? new Date(fx.header.createdAt) : new Date()).toLocaleDateString("es-MX")}
          </Field>
          <Field label={t("purchaseOrders.form.createdBy")}>{fx.header.createdBy ?? fx.currentUserName}</Field>
          <Field label={t("purchaseOrders.form.status")}>{dyn(t)(`purchaseOrders.status.${fx.header.status}`)}</Field>
        </div>

        <div className="mt-4 grid gap-4 md:!grid-cols-4">
          <ITSearchSelect
            name="poSupplier"
            label={t("purchaseOrders.form.supplier")}
            options={fx.suppliers.map((s) => ({ value: s.id, label: s.name }))}
            value={fx.supplierId}
            onChange={(value) => fx.setSupplierId(String(value))}
          />
          <ITSelect
            name="poCostCenter"
            label={t("purchaseOrders.form.costCenter")}
            options={[
              { value: "", label: t("purchaseOrders.form.noCostCenter") },
              ...fx.costCenters.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
            ]}
            value={fx.costCenterId}
            onChange={(e) => fx.setCostCenterId(e.target.value)}
          />
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
          <ITInput name="poNotes" label={t("purchaseOrders.form.notes")} value={fx.notes} onChange={(event) => fx.setNotes(event.target.value)} />
        </div>

        {supplier && (
          <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 p-4 md:!grid-cols-4">
            <Field label={t("purchaseOrders.form.legalName")}>{supplier.legalName ?? supplier.name}</Field>
            <Field label={t("purchaseOrders.form.rfc")}>{supplier.rfc ? <span className="font-mono">{supplier.rfc}</span> : "—"}</Field>
            <Field label={t("purchaseOrders.form.supplierContact")}>
              {contact ? (
                <span className="flex items-center gap-2">
                  {contact.name}
                  {(contact.phone ?? supplier.phone) && (
                    <a className="flex items-center gap-1 text-[11px] font-normal text-sky-700" href={`tel:${contact.phone ?? supplier.phone}`}>
                      <FaPhone size={9} /> {contact.phone ?? supplier.phone}
                    </a>
                  )}
                </span>
              ) : (
                "—"
              )}
            </Field>
            <Field label={t("purchaseOrders.form.terms")}>
              {t("purchaseOrders.form.supplierTerms", { credit: days(supplier.paymentTermsDays), lead: days(supplier.leadTimeDays) })}
            </Field>
          </div>
        )}
      </PanelCard>

      {/* Detalle */}
      <PanelCard
        title={t("purchaseOrders.form.detailTitle")}
        description={t("purchaseOrders.form.detailHint")}
        actions={<ITButton variant="outlined" color="primary" size="sm" icon={<FaPlus size={10} />} label={t("purchaseOrders.form.addItem")} onClick={fx.addLine} />}
      >
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className={`${DETAIL_GRID} border-b border-slate-100 pb-2`}>
              <span className={TH}>{t("purchaseOrders.form.item")}</span>
              <span className={TH}>{t("purchaseOrders.form.quantity")}</span>
              <span className={TH}>{t("purchaseOrders.form.unitCostShort")}</span>
              <span className={TH}>{t("purchaseOrders.form.tax")}</span>
              <span className={`${TH} text-right`}>{t("purchaseOrders.form.subtotal")}</span>
              <span className={`${TH} text-right`}>{t("purchaseOrders.form.taxAmount")}</span>
              <span className={`${TH} text-right`}>{t("purchaseOrders.form.lineTotal")}</span>
              <span />
            </div>

            {fx.lines.length === 0 && (
              <ITText className="block py-6 text-center text-[12px] text-slate-400">{t("purchaseOrders.form.emptyItems")}</ITText>
            )}

            {fx.lines.map((line) => {
              const item = fx.itemById.get(line.itemId);
              const pack = fx.presentationOf(line.itemId);
              const inPack = Boolean(pack && line.usePurchaseUnit);
              const tax = fx.taxOf(line);
              const amounts = fx.amountsOf(line);
              return (
                <div key={line.key} className="border-b border-slate-50 py-3">
                  <div className={DETAIL_GRID}>
                    <ITSearchSelect
                      name={`poItem-${line.key}`}
                      options={fx.items.map((it) => ({ value: it.id, label: `${it.code} · ${it.name}` }))}
                      value={line.itemId}
                      onChange={(value) => fx.patchLine(line.key, { itemId: String(value) })}
                    />
                    <ITInputNumber
                      name={`poQty-${line.key}`}
                      decimals={item?.unit.whole && !inPack ? 0 : 2}
                      min={0}
                      placeholder={inPack ? pack!.purchaseUnit : item?.unit.code}
                      value={numOrNull(line.quantity)}
                      onChange={(v) => fx.patchLine(line.key, { quantity: numText(v) })}
                    />
                    <ITInputNumber
                      name={`poCost-${line.key}`}
                      decimals={2}
                      prefix="$"
                      min={0}
                      value={numOrNull(line.unitCost)}
                      onChange={(v) => fx.patchLine(line.key, { unitCost: numText(v) })}
                    />
                    <ITSelect
                      name={`poTax-${line.key}`}
                      options={taxOptions}
                      value={tax.id}
                      onChange={(e) => fx.patchLine(line.key, { taxRateId: e.target.value })}
                    />
                    <span className="pt-2.5 text-right text-[12px] font-bold tabular-nums text-slate-700">{fmtMoney(amounts.subtotal)}</span>
                    <span className="pt-2.5 text-right text-[12px] tabular-nums text-slate-500">{fmtMoney(amounts.tax)}</span>
                    <span className="pt-2.5 text-right text-[13px] font-black tabular-nums text-slate-900">{fmtMoney(amounts.total)}</span>
                    <ITButton variant="icon-only" color="error" size="sm" ariaLabel={t("common.remove")} onClick={() => fx.removeLine(line.key)}>
                      <FaTrash size={12} />
                    </ITButton>
                  </div>
                  {item && (
                    <ITFlex gap={3} wrap="wrap" align="center" className="mt-1.5 pl-1">
                      <ITText className="text-[11px] font-bold text-slate-500">
                        {inPack ? t("purchaseOrders.form.perPurchaseUnit", { unit: pack!.purchaseUnit }) : item.unit.name}
                      </ITText>
                      {pack && (
                        <ITCheckbox
                          name={`poPack-${line.key}`}
                          label={t("purchaseOrders.form.inPurchaseUnit", { unit: pack.purchaseUnit })}
                          checked={line.usePurchaseUnit}
                          onChange={(v) => fx.patchLine(line.key, { usePurchaseUnit: v })}
                        />
                      )}
                      {inPack && Number(line.quantity) > 0 && (
                        <ITText className="text-[11px] font-bold text-emerald-700">
                          {t("purchaseOrders.form.equivalent", { qty: fmtQty(Number(line.quantity) * pack!.factor), unit: item.unit.name })}
                        </ITText>
                      )}
                      <ITText className="text-[11px] text-slate-500">{t("purchaseOrders.form.available", { qty: fmtQty(item.available) })}</ITText>
                      <ITText className="text-[11px] text-emerald-600">{t("purchaseOrders.form.suggested", { qty: fmtQty(suggestedFor(item)) })}</ITText>
                    </ITFlex>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Totales */}
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <ITFlex justify="between" className="py-1">
              <ITText className="text-[12px] text-slate-500">{t("purchaseOrders.form.subtotal")}</ITText>
              <ITText className="text-[13px] font-bold tabular-nums text-slate-800">{fmtMoney(fx.totals.subtotal)}</ITText>
            </ITFlex>
            {fx.totals.taxes.map((tx) => (
              <ITFlex key={tx.rate} justify="between" className="py-1">
                <ITText className="text-[12px] text-slate-500">{t("purchaseOrders.form.taxLine", { rate: fmtRate(tx.rate) })}</ITText>
                <ITText className="text-[13px] tabular-nums text-slate-700">{fmtMoney(tx.amount)}</ITText>
              </ITFlex>
            ))}
            <ITFlex justify="between" className="mt-2 border-t border-slate-200 pt-2">
              <ITText className="text-[13px] font-black text-slate-900">{t("purchaseOrders.form.grandTotal")}</ITText>
              <ITText className="text-[18px] font-black tabular-nums text-slate-900">{fmtMoney(fx.totals.total)}</ITText>
            </ITFlex>
          </div>
        </div>
      </PanelCard>

      <ITFlex align="center" justify="end" gap={2}>
        <ITButton variant="outlined" color="secondary" label={t("purchaseOrders.form.cancel")} onClick={fx.cancel} />
        <ITButton
          variant="filled"
          color="primary"
          icon={<FaSave size={12} />}
          label={t("purchaseOrders.form.save")}
          disabled={!fx.canSave || fx.saving}
          onClick={() => void fx.save()}
        />
      </ITFlex>

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
