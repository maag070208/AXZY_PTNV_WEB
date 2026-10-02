import { useState } from "react";
import { ITAlert, ITButton, ITConfirmDialog, ITFlex, ITGrid, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaBalanceScale, FaCoins, FaListUl, FaUndo } from "react-icons/fa";
import { PanelCard } from "@shared/ui/panel-card";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { useCan } from "@entities/user";
import { fmtMoney, fmtQty, fmtRate } from "@entities/kitchen";
import { useInvoice } from "../model/useInvoice";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

const HEAD = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const off = (value: number | null) => value != null && Math.abs(value) > 0.005;

/** Detalle de una factura con el cotejo de tres vías (pedido / recibido / facturado). */
export default function InvoiceDetailPanel({ id }: { id?: string }) {
  const { t } = useTranslation("kitchen");
  const fx = useInvoice(id);
  const canRegister = useCan("invoices.register");
  const [cancelOpen, setCancelOpen] = useState(false);

  if (fx.loading || !fx.invoice) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{fx.error ?? t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const invoice = fx.invoice;
  const diffs = invoice.lines.filter((l) => l.priceDiff != null && Math.abs(l.priceDiff) > 0.0001).length;

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITFlex align="center" justify="between" wrap="wrap" gap={3}>
        <ITFlex align="center" gap={3}>
          <ITFlex direction="column" gap={0}>
            <ITFlex align="center" gap={2}>
              <ITText className="text-[18px] font-black text-slate-800">{invoice.number}</ITText>
              <InvoiceStatusBadge status={invoice.status} />
            </ITFlex>
            <ITText className="text-[11px] text-slate-500">
              {invoice.supplier.name} · {invoice.date}
              {invoice.purchaseOrder ? ` · ${invoice.purchaseOrder.number}` : ""}
            </ITText>
          </ITFlex>
        </ITFlex>
        {invoice.status === "ACTIVE" && canRegister && (
          <ITButton variant="outlined" color="error" disabled={fx.busy} onClick={() => setCancelOpen(true)}>
            <ITFlex align="center" gap={1}>
              <FaUndo size={11} />
              <ITText className="font-bold text-[11px]">{t("invoices.actions.cancel")}</ITText>
            </ITFlex>
          </ITButton>
        )}
      </ITFlex>

      <div className="grid !grid-cols-1 gap-3 md:!grid-cols-3">
        <KpiTile label={t("invoices.kpi.total")} value={money(invoice.total)} icon={<FaCoins size={15} />} tone="emerald" />
        <KpiTile label={t("invoices.kpi.lines")} value={invoice.lines.length} icon={<FaListUl size={15} />} tone="violet" />
        <KpiTile label={t("invoices.kpi.diffs")} value={diffs} icon={<FaBalanceScale size={15} />} tone={diffs > 0 ? "amber" : "neutral"} />
      </div>

      <PanelCard title={t("invoices.infoTitle")}>
        <ITGrid container columns={12} spacing={4}>
          {[
            { label: t("invoices.columns.total"), value: money(invoice.total) },
            { label: t("invoices.columns.uuid"), value: invoice.uuid ?? "—" },
            { label: t("invoices.columns.createdBy"), value: `${invoice.createdBy.name} · ${new Date(invoice.createdAt).toLocaleDateString("es-MX")}` },
          ].map((f) => (
            <ITGrid key={f.label} item xs={12} md={4}>
              <ITText className={`${HEAD} block`}>{f.label}</ITText>
              <ITText className="text-[12px] font-bold text-slate-700">{f.value}</ITText>
            </ITGrid>
          ))}
          {invoice.notes && (
            <ITGrid item xs={12}>
              <ITText className={`${HEAD} block`}>{t("invoices.form.notes")}</ITText>
              <ITText className="text-[12px] text-slate-600">{invoice.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("invoices.match")}>
        <ITFlex direction="column" gap={2}>
          <ITGrid container columns={12} spacing={2} className="hidden border-b border-slate-100 pb-2 md:grid">
            <ITGrid item md={3}><ITText className={HEAD}>{t("invoices.columns.item")}</ITText></ITGrid>
            <ITGrid item md={2}><ITText className={HEAD}>{t("invoices.columns.invoiced")}</ITText></ITGrid>
            <ITGrid item md={1}><ITText className={HEAD}>{t("invoices.columns.ordered")}</ITText></ITGrid>
            <ITGrid item md={1}><ITText className={HEAD}>{t("invoices.columns.received")}</ITText></ITGrid>
            <ITGrid item md={2}><ITText className={HEAD}>{t("invoices.columns.unitCost")}</ITText></ITGrid>
            <ITGrid item md={3}><ITText className={HEAD}>{t("invoices.columns.priceDiff")}</ITText></ITGrid>
          </ITGrid>
          {invoice.lines.map((line) => (
            <ITGrid key={line.id} container columns={12} spacing={2} className="items-center border-b border-slate-50 pb-2">
              <ITGrid item xs={12} md={3}>
                <ITText className="text-[12px] font-bold text-slate-800">{line.item.name}</ITText>
                <ITText className="text-[10px] uppercase text-slate-400">{line.item.unit.name}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITText className="text-[12px] font-bold text-emerald-700">
                  {fmtQty(line.quantity)} @ {money(line.unitCost)}
                </ITText>
              </ITGrid>
              <ITGrid item xs={3} md={1}><ITText className="text-[11px] text-slate-600">{line.ordered == null ? "—" : fmtQty(line.ordered)}</ITText></ITGrid>
              <ITGrid item xs={3} md={1}><ITText className="text-[11px] text-slate-600">{line.received == null ? "—" : fmtQty(line.received)}</ITText></ITGrid>
              <ITGrid item xs={6} md={2}><ITText className="text-[11px] text-slate-600">{money(line.unitCost)}</ITText></ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText className={`text-[11px] font-bold ${line.priceDiff && Math.abs(line.priceDiff) > 0.0001 ? "text-amber-600" : "text-slate-400"}`}>
                  {line.priceDiff == null ? "—" : money(line.priceDiff)}
                </ITText>
                <ITText className={`block text-[10px] ${off(line.taxDiff) ? "text-amber-600" : "text-slate-400"}`}>
                  {t("invoices.matchTax", { rate: fmtRate(line.taxRate), diff: money(line.taxDiff ?? 0) })}
                </ITText>
              </ITGrid>
            </ITGrid>
          ))}
        </ITFlex>

        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <ITGrid container columns={3} spacing={2} className="border-b border-slate-200 pb-2">
              <ITGrid item xs={1}><ITText className={HEAD}>{t("invoices.totals.concept")}</ITText></ITGrid>
              <ITGrid item xs={1}><ITText className={`${HEAD} text-right`}>{t("invoices.totals.invoice")}</ITText></ITGrid>
              <ITGrid item xs={1}><ITText className={`${HEAD} text-right`}>{t("invoices.totals.order")}</ITText></ITGrid>
            </ITGrid>
            {[
              { label: t("invoices.totals.subtotal"), invoice: invoice.taxTotals.subtotal, order: invoice.taxTotals.order?.subtotal ?? null },
              { label: t("invoices.totals.tax"), invoice: invoice.taxTotals.tax, order: invoice.taxTotals.order?.tax ?? null },
              { label: t("invoices.totals.total"), invoice: invoice.taxTotals.total, order: invoice.taxTotals.order?.total ?? null },
            ].map((row) => (
              <ITGrid key={row.label} container columns={3} spacing={2} className="items-center py-1">
                <ITGrid item xs={1}><ITText className="text-[12px] text-slate-500">{row.label}</ITText></ITGrid>
                <ITGrid item xs={1}><ITText className="text-right text-[12px] font-bold tabular-nums text-slate-800">{fmtMoney(row.invoice)}</ITText></ITGrid>
                <ITGrid item xs={1}><ITText className="text-right text-[12px] tabular-nums text-slate-600">{row.order == null ? "—" : fmtMoney(row.order)}</ITText></ITGrid>
              </ITGrid>
            ))}
            {invoice.taxTotals.order && (
              <ITFlex justify="between" className="mt-2 border-t border-slate-200 pt-2">
                <ITText className="text-[12px] font-bold text-slate-600">{t("invoices.totals.taxDiff")}</ITText>
                <ITText className={`text-[14px] font-black tabular-nums ${off(invoice.taxTotals.taxDiff) ? "text-amber-600" : "text-emerald-600"}`}>
                  {fmtMoney(invoice.taxTotals.taxDiff ?? 0)}
                </ITText>
              </ITFlex>
            )}
          </div>
        </div>
      </PanelCard>

      <ITConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          void fx.cancel();
          setCancelOpen(false);
        }}
        title={t("invoices.actions.cancel")}
        message={t("invoices.cancelConfirm", { number: invoice.number })}
        confirmLabel={t("invoices.actions.cancel")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={fx.busy}
      />

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
