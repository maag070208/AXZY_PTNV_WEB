import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITAlert, ITButton, ITCard, ITConfirmDialog, ITFlex, ITGrid, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaArrowLeft, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { fmtQty } from "@entities/kitchen";
import { useInvoice } from "../model/useInvoice";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

const HEAD = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Detalle de una factura con el cotejo de tres vías (pedido / recibido / facturado). */
export default function InvoiceDetailPanel({ id }: { id?: string }) {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
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

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITFlex align="center" justify="between" wrap="wrap" gap={3}>
        <ITFlex align="center" gap={3}>
          <ITButton variant="text" color="gray" size="sm" onClick={() => navigate("/kitchen/invoices")}>
            <FaArrowLeft size={12} />
          </ITButton>
          <ITFlex direction="column" gap={0}>
            <ITFlex align="center" gap={2}>
              <ITText className="text-[16px] font-black text-slate-800">{invoice.number}</ITText>
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

      <ITCard className="!p-5 border border-slate-200">
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
      </ITCard>

      <ITCard className="!p-5 border border-slate-200">
        <ITText className={`${HEAD} block mb-3`}>{t("invoices.match")}</ITText>
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
              </ITGrid>
            </ITGrid>
          ))}
        </ITFlex>
      </ITCard>

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
