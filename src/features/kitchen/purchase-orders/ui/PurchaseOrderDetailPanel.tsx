import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaClipboardList, FaFilePdf, FaCoins, FaFileInvoice, FaHourglassHalf, FaPaperPlane, FaPen, FaTruckLoading, FaUndo } from "react-icons/fa";
import { PanelCard } from "@shared/ui/panel-card";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { useCan } from "@entities/user";
import { fmtMoney, fmtQty, fmtRate, type PurchaseOrderDetail } from "@entities/kitchen";
import { usePurchaseOrder } from "../model/usePurchaseOrder";
import PurchaseOrderStatusBadge from "./PurchaseOrderStatusBadge";
import PurchaseOrderReceiveDialog from "./PurchaseOrderReceiveDialog";
import PurchaseOrderEmailDialog from "./PurchaseOrderEmailDialog";

const HEAD = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const money = fmtMoney;
/** Columnas del detalle: artículo · pedido · recibido · pendiente · costo · IVA · subtotal · importe. */
const LINE_GRID = "grid grid-cols-[minmax(200px,2.4fr)_1fr_.9fr_.9fr_1fr_.7fr_1fr_1.1fr] items-center gap-3";

/** Detalle de una orden: líneas con existencias, recepciones y acciones por estado. */
export default function PurchaseOrderDetailPanel({ id, onDownloadPdf, buildPdf }: { id?: string; onDownloadPdf?: (order: PurchaseOrderDetail) => Promise<void>; buildPdf?: (order: PurchaseOrderDetail) => Promise<Blob> }) {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const fx = usePurchaseOrder(id);
  const canCreate = useCan("purchase_orders.create");
  const canApprove = useCan("purchase_orders.approve");
  const canCancel = useCan("purchase_orders.cancel");
  const [pdfBusy, setPdfBusy] = useState(false);
  const canReceive = useCan("kitchen.stock_in");
  const canRegisterInvoice = useCan("invoices.register");
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (fx.loading || !fx.order) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{fx.error ?? t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const order = fx.order;
  const req = (v: string | null) => (v ? new Date(v).toLocaleString("es-MX") : "—");
  const receivable = ["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(order.status);
  const cancellable = ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(order.status);

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
              <ITText className="text-[18px] font-black text-slate-800">{order.number}</ITText>
              <PurchaseOrderStatusBadge status={order.status} />
            </ITFlex>
            <ITText className="text-[11px] text-slate-500">
              {order.supplier.name} · {t("purchaseOrders.columns.expectedAt")}: {order.expectedAt ?? "—"}
            </ITText>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" gap={2} wrap="wrap">
          {onDownloadPdf && (
            <ITButton
              variant="outlined"
              color="secondary"
              icon={<FaFilePdf size={11} className="text-rose-600" />}
              label={pdfBusy ? t("common.loading") : t("pdf.download")}
              disabled={pdfBusy}
              onClick={() => {
                setPdfBusy(true);
                void onDownloadPdf(order).finally(() => setPdfBusy(false));
              }}
            />
          )}
          {order.status === "DRAFT" && canCreate && (
            <ITButton variant="outlined" color="secondary" onClick={() => navigate(`/kitchen/purchase-orders/${order.id}/edit`)}>
              <ITFlex align="center" gap={1}>
                <FaPen size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.edit")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {order.status === "DRAFT" && canApprove && (
            <ITButton variant="filled" color="success" disabled={fx.busy} onClick={() => void fx.approve()}>
              <ITFlex align="center" gap={1}>
                <FaCheck size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.approve")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {["APPROVED", "SENT"].includes(order.status) && canCreate && buildPdf && (
            <ITButton variant="filled" color="primary" disabled={fx.busy} onClick={() => setEmailOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaPaperPlane size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.sendEmail")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {receivable && canReceive && (
            <ITButton variant="filled" color="primary" disabled={fx.busy} onClick={() => setReceiveOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaTruckLoading size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.receive")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {(order.status === "PARTIALLY_RECEIVED" || order.status === "RECEIVED") && canRegisterInvoice && (
            <ITButton
              variant="outlined"
              color="primary"
              onClick={() => navigate("/kitchen/invoices/new", { state: { purchaseOrderId: order.id } })}
            >
              <ITFlex align="center" gap={1}>
                <FaFileInvoice size={11} />
                <ITText className="font-bold text-[11px]">{t("invoices.registerFromOrder")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {cancellable && canCancel && (
            <ITButton variant="outlined" color="error" disabled={fx.busy} onClick={() => setCancelOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaUndo size={11} />
                <ITText className="font-bold text-[11px]">{t("purchaseOrders.actions.cancel")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      </ITFlex>

      <div className="grid !grid-cols-2 gap-3 md:!grid-cols-4">
        <KpiTile label={t("purchaseOrders.kpi.ordered")} value={fmtQty(order.orderedUnits)} icon={<FaClipboardList size={15} />} tone="violet" />
        <KpiTile label={t("purchaseOrders.kpi.received")} value={fmtQty(order.receivedUnits)} icon={<FaTruckLoading size={15} />} tone="emerald" />
        <KpiTile
          label={t("purchaseOrders.kpi.pending")}
          value={fmtQty(Math.max(0, order.orderedUnits - order.receivedUnits))}
          icon={<FaHourglassHalf size={15} />}
          tone={order.orderedUnits - order.receivedUnits > 0 && order.status !== "CANCELLED" ? "amber" : "neutral"}
        />
        <KpiTile label={t("purchaseOrders.kpi.total")} value={money(order.total)} icon={<FaCoins size={15} />} tone="emerald" />
      </div>

      <PanelCard title={t("purchaseOrders.infoTitle")}>
        <ITGrid container columns={12} spacing={4}>
          {[
            { label: t("purchaseOrders.columns.createdBy"), value: order.createdBy.name },
            { label: t("purchaseOrders.columns.createdAt"), value: req(order.createdAt) },
            { label: t("purchaseOrders.status.APPROVED"), value: order.approvedBy ? `${order.approvedBy.name} · ${req(order.approvedAt)}` : "—" },
            { label: t("purchaseOrders.status.SENT"), value: req(order.sentAt) },
            { label: t("purchaseOrders.form.costCenter"), value: order.costCenter ? `${order.costCenter.code} · ${order.costCenter.name}` : "—" },
            {
              label: t("purchaseOrders.form.supplierContact"),
              value: order.supplier.primaryContact
                ? [order.supplier.primaryContact.name, order.supplier.primaryContact.position, order.supplier.primaryContact.phone].filter(Boolean).join(" · ")
                : order.supplier.phone ?? "—",
            },
          ].map((f) => (
            <ITGrid key={f.label} item xs={12} md={3}>
              <ITText className={`${HEAD} block`}>{f.label}</ITText>
              <ITText className="text-[12px] font-bold text-slate-700">{f.value}</ITText>
            </ITGrid>
          ))}
          {order.notes && (
            <ITGrid item xs={12}>
              <ITText className={`${HEAD} block`}>{t("purchaseOrders.form.notes")}</ITText>
              <ITText className="text-[12px] text-slate-600">{order.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("purchaseOrders.form.detailTitle")} description={t("purchaseOrders.form.detailHint")}>
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className={`${LINE_GRID} border-b border-slate-100 pb-2`}>
              <span className={HEAD}>{t("purchaseOrders.columns.item")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.columns.quantity")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.columns.received")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.columns.pending")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.form.unitCostShort")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.form.tax")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.form.subtotal")}</span>
              <span className={`${HEAD} text-right`}>{t("purchaseOrders.form.lineTotal")}</span>
            </div>
            {order.lines.map((line) => (
              <div key={line.id} className={`${LINE_GRID} border-b border-slate-50 py-2.5 last:border-0`}>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-bold text-slate-800">{line.item.name}</span>
                  <span className="block text-[10px] font-mono text-slate-400">{line.item.code}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[12px] font-bold tabular-nums text-slate-700">
                    {fmtQty(line.quantity)} {line.item.unit.code}
                  </span>
                  {line.purchaseUnit && line.purchaseQuantity != null && (
                    <span className="block text-[10px] text-emerald-700">
                      {fmtQty(line.purchaseQuantity)} × {line.purchaseUnit}
                    </span>
                  )}
                </span>
                <span className="text-right text-[12px] font-bold tabular-nums text-emerald-700">{fmtQty(line.receivedQuantity)}</span>
                <span className="text-right text-[12px] font-bold tabular-nums text-amber-600">{fmtQty(line.pendingQuantity)}</span>
                <span className="text-right text-[12px] tabular-nums text-slate-600">{line.unitCost == null ? "—" : fmtMoney(line.unitCost)}</span>
                <span className="text-right text-[12px] tabular-nums text-slate-600">{fmtRate(line.taxRate)}</span>
                <span className="text-right text-[12px] tabular-nums text-slate-700">{fmtMoney(line.subtotal)}</span>
                <span className="text-right text-[13px] font-black tabular-nums text-slate-900">{fmtMoney(line.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <ITFlex justify="between" className="py-1">
              <ITText className="text-[12px] text-slate-500">{t("purchaseOrders.form.subtotal")}</ITText>
              <ITText className="text-[13px] font-bold tabular-nums text-slate-800">{fmtMoney(order.subtotal)}</ITText>
            </ITFlex>
            {order.taxes.map((tx) => (
              <ITFlex key={tx.rate} justify="between" className="py-1">
                <ITText className="text-[12px] text-slate-500">{t("purchaseOrders.form.taxLine", { rate: fmtRate(tx.rate) })}</ITText>
                <ITText className="text-[13px] tabular-nums text-slate-700">{fmtMoney(tx.tax)}</ITText>
              </ITFlex>
            ))}
            <ITFlex justify="between" className="mt-2 border-t border-slate-200 pt-2">
              <ITText className="text-[13px] font-black text-slate-900">{t("purchaseOrders.form.grandTotal")}</ITText>
              <ITText className="text-[18px] font-black tabular-nums text-slate-900">{fmtMoney(order.total)}</ITText>
            </ITFlex>
          </div>
        </div>
      </PanelCard>

      {order.movements.length > 0 && (
        <PanelCard title={t("purchaseOrders.receipts")}>
          <ITFlex direction="column" gap={1}>
            {order.movements.map((m) => (
              <ITFlex key={m.id} align="center" gap={3}>
                <ITText className="text-[11px] text-slate-500">{new Date(m.date).toLocaleString("es-MX")}</ITText>
                <ITText className="text-[11px] font-mono text-slate-600">{m.reference ?? "—"}</ITText>
                <ITText className="text-[11px] text-slate-500">{m.createdBy}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        </PanelCard>
      )}

      <PurchaseOrderReceiveDialog
        open={receiveOpen}
        order={order}
        busy={fx.busy}
        onClose={() => setReceiveOpen(false)}
        onSubmit={(input, key) => {
          void fx.receive(input, key);
          setReceiveOpen(false);
        }}
      />

      <PurchaseOrderEmailDialog
        isOpen={emailOpen}
        order={order}
        busy={fx.busy}
        buildPdf={buildPdf ?? (async () => new Blob())}
        onClose={() => setEmailOpen(false)}
        onSubmit={(form) => {
          void fx.email(form);
          setEmailOpen(false);
        }}
      />

      <ITConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          void fx.cancel();
          setCancelOpen(false);
        }}
        title={t("purchaseOrders.actions.cancel")}
        message={t("purchaseOrders.cancelConfirm", { number: order.number })}
        confirmLabel={t("purchaseOrders.actions.cancel")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={fx.busy}
      />

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
