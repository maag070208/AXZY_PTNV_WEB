import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex, ITGrid, ITSelect } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  ADJUSTMENT_STATUSES,
  ADJUSTMENT_TYPES,
  hotelLinenApi,
  reportApi,
  type AdjustmentGroup,
  type AdjustmentReport,
  type AdjustmentStatus,
  type AdjustmentType,
  type HotelProduct,
  type HotelWarehouse,
} from "@entities/hotel-linen";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { FaBalanceScale } from "react-icons/fa";
import { defaultFrom, fmt, fmtDateTime, fmtDay, money, productLabel, todayStr } from "../lib";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

type Row = AdjustmentReport["rows"][number];

/** Ajustes al inventario (entradas, salidas y bajas) con motivo, costo y aprobación. */
export default function AdjustmentsTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [reasons, setReasons] = useState<AdjustmentReport["reasons"]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [type, setType] = useState<AdjustmentType | "">("");
  const [status, setStatus] = useState<AdjustmentStatus | "">("");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<AdjustmentReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([hotelLinenApi.products(), hotelLinenApi.warehouses()])
      .then(([p, w]) => {
        setProducts(p);
        setWarehouses(w);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    reportApi
      .adjustments({ from, to, productId, warehouseId, reasonId, type: type || undefined, status: status || undefined })
      .then((r) => {
        setReport(r);
        setReasons(r.reasons);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [from, to, productId, warehouseId, reasonId, type, status]);

  const reasonLabel = (r: Row["reason"]) => (r ? r.name : "—");
  const signed = (r: Row) => `${r.direction === "IN" ? "+" : "−"}${fmt(r.quantity)}`;
  const cost = (n: number | null) => (n === null ? "—" : money(n));

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    return {
      title: t("adjustments.title"),
      subtitle: `${fmtDay(report.from)} – ${fmtDay(report.to)}`,
      columns: [
        { key: "date", label: t("adjustments.date") },
        { key: "folio", label: t("adjustments.folio") },
        { key: "warehouse", label: t("adjustments.warehouse") },
        { key: "product", label: t("adjustments.product") },
        { key: "direction", label: t("adjustments.direction") },
        { key: "quantity", label: t("adjustments.quantity"), align: "right" },
        { key: "unitCost", label: t("adjustments.unitCost"), align: "right" },
        { key: "totalCost", label: t("adjustments.totalCost"), align: "right" },
        { key: "reason", label: t("adjustments.reason") },
        { key: "createdBy", label: t("adjustments.createdBy") },
        { key: "approvedBy", label: t("adjustments.approvedBy") },
        { key: "status", label: t("adjustments.status") },
      ],
      rows: [
        ...report.rows.map((r) => ({
          date: fmtDateTime(r.date),
          folio: r.folio,
          warehouse: r.warehouse?.name ?? "—",
          product: productLabel(r.product),
          direction: t(`adjustments.type.${r.type}`),
          quantity: signed(r),
          unitCost: cost(r.unitCost),
          totalCost: money(r.totalCost),
          reason: reasonLabel(r.reason),
          createdBy: r.createdBy.name,
          approvedBy: r.approvedBy?.name ?? "—",
          status: t(`adjustments.statusName.${r.status}`),
        })),
        {
          date: t("adjustments.totals"), folio: "", warehouse: "", product: "", direction: "",
          quantity: fmt(report.total.pieces), unitCost: "", totalCost: money(report.total.cost),
          reason: "", createdBy: "", approvedBy: "", status: "",
        },
      ],
    };
  }, [report, t]);

  const columns: ReportCol<Row>[] = [
    { key: "date", label: t("adjustments.date"), width: 160, value: (r) => r.date, render: (r) => fmtDateTime(r.date) },
    { key: "folio", label: t("adjustments.folio"), width: 130, value: (r) => r.folio },
    { key: "warehouse", label: t("adjustments.warehouse"), width: 150, value: (r) => r.warehouse?.name ?? "—" },
    { key: "product", label: t("adjustments.product"), width: 220, value: (r) => productLabel(r.product) },
    { key: "direction", label: t("adjustments.direction"), width: 110, value: (r) => t(`adjustments.type.${r.type}`) },
    { key: "quantity", label: t("adjustments.quantity"), numeric: true, width: 90, value: (r) => (r.direction === "IN" ? r.quantity : -r.quantity), render: signed },
    { key: "unitCost", label: t("adjustments.unitCost"), numeric: true, width: 100, value: (r) => r.unitCost ?? 0, render: (r) => cost(r.unitCost) },
    { key: "totalCost", label: t("adjustments.totalCost"), numeric: true, width: 110, value: (r) => r.totalCost, render: (r) => money(r.totalCost) },
    { key: "reason", label: t("adjustments.reason"), width: 170, value: (r) => reasonLabel(r.reason) },
    { key: "createdBy", label: t("adjustments.createdBy"), width: 150, value: (r) => r.createdBy.name },
    { key: "approvedBy", label: t("adjustments.approvedBy"), width: 150, value: (r) => r.approvedBy?.name ?? "—" },
    { key: "status", label: t("adjustments.status"), width: 130, value: (r) => t(`adjustments.statusName.${r.status}`) },
  ];

  const groupColumns = (label: string): ReportCol<AdjustmentGroup>[] => [
    { key: "name", label, width: 240, value: (g) => g.name ?? t("adjustments.noValue") },
    { key: "pieces", label: t("adjustments.quantity"), numeric: true, value: (g) => g.pieces, render: (g) => fmt(g.pieces) },
    { key: "cost", label: t("adjustments.totalCost"), numeric: true, value: (g) => g.cost, render: (g) => money(g.cost) },
  ];

  const opt = (all: string, list: { value: string; label: string }[]) => [{ value: "", label: all }, ...list];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} md={3}>
          <ITSelect name="adjProduct" label={t("adjustments.product")} options={opt(t("adjustments.allProducts"), products.map((p) => ({ value: p.id, label: `${p.code} · ${productLabel(p)}` })))} value={productId} onChange={(e) => setProductId(e.target.value)} />
        </ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITSelect name="adjWarehouse" label={t("adjustments.warehouse")} options={opt(t("adjustments.allWarehouses"), warehouses.map((w) => ({ value: w.id, label: w.name })))} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
        </ITGrid>
        <ITGrid item xs={12} md={2}>
          <ITSelect name="adjReason" label={t("adjustments.reason")} options={opt(t("adjustments.allReasons"), reasons.map((r) => ({ value: r.id, label: r.name })))} value={reasonId} onChange={(e) => setReasonId(e.target.value)} />
        </ITGrid>
        <ITGrid item xs={6} md={2}>
          <ITSelect name="adjType" label={t("adjustments.typeLabel")} options={opt(t("adjustments.allTypes"), ADJUSTMENT_TYPES.map((v) => ({ value: v, label: t(`adjustments.type.${v}`) })))} value={type} onChange={(e) => setType(e.target.value as AdjustmentType | "")} />
        </ITGrid>
        <ITGrid item xs={6} md={2}>
          <ITSelect name="adjStatus" label={t("adjustments.status")} options={opt(t("adjustments.allStatuses"), ADJUSTMENT_STATUSES.map((v) => ({ value: v, label: t(`adjustments.statusName.${v}`) })))} value={status} onChange={(e) => setStatus(e.target.value as AdjustmentStatus | "")} />
        </ITGrid>
      </ITGrid>
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-ajustes-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <div className="grid !grid-cols-2 gap-4 md:!grid-cols-4">
            <KpiTile label={t("adjustments.totalPieces")} value={fmt(report.total.pieces)} icon={<FaBalanceScale size={14} />} tone={report.total.pieces > 0 ? "amber" : "neutral"} hint={money(report.total.cost)} />
          </div>
          <PanelCard title={t("adjustments.title")} description={t("adjustments.totalsNote")}>
            <ReportTable
              rows={report.rows}
              empty={t("adjustments.none")}
              columns={columns}
              totals={[
                { label: t("adjustments.quantity"), value: fmt(report.total.pieces) },
                { label: t("adjustments.totalCost"), value: money(report.total.cost) },
              ]}
            />
          </PanelCard>
          {report.byReason.length > 0 && (
            <PanelCard title={t("adjustments.byReason")}>
              <ReportTable rows={report.byReason} columns={groupColumns(t("adjustments.reason"))} />
            </PanelCard>
          )}
          {report.byWarehouse.length > 0 && (
            <PanelCard title={t("adjustments.byWarehouse")}>
              <ReportTable rows={report.byWarehouse} columns={groupColumns(t("adjustments.warehouse"))} />
            </PanelCard>
          )}
        </>
      )}
    </ITFlex>
  );
}
