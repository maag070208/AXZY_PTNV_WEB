import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex, ITGrid, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, reportApi, type HotelProduct, type HotelWarehouse, type KardexReport } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { defaultFrom, fmt, fmtDateTime, fmtDay, productLabel, todayStr } from "../lib";
import { PanelCard } from "@shared/ui/panel-card";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

const place = (w: { code: string; name: string } | null) => (w ? w.name : "—");

/** Kardex por artículo (y almacén opcional) con lote y saldo corrido. */
export default function KardexTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const tt = dyn(t);
  const labelOf = (sourceDocType: string | null, type: string) => {
    if (sourceDocType === "HOTEL_WRITEOFF_HOLD") return t("kardex.docHold");
    if (sourceDocType === "HOTEL_WRITEOFF_RELEASE") return t("kardex.docRelease");
    if (sourceDocType === "HOTEL_AMENITY_CONTROL") return t("kardex.docAmenity");
    return tt(`kardex.movementType.${type}`, { defaultValue: type });
  };
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<KardexReport | null>(null);
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
    if (!productId) return;
    reportApi
      .kardex(productId, from, to, warehouseId || undefined)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [productId, warehouseId, from, to]);

  const shown = productId ? report : null;
  const doc = useMemo<ReportDoc | null>(() => {
    if (!shown) return null;
    return {
      title: t("kardex.title"),
      subtitle: `${productLabel(shown.product)} · ${fmtDay(shown.from)} – ${fmtDay(shown.to)} · ${t("kardex.opening")}: ${fmt(shown.opening)}`,
      columns: [
        { key: "date", label: t("kardex.date") },
        { key: "folio", label: t("kardex.folio") },
        { key: "type", label: t("kardex.type") },
        { key: "route", label: t("kardex.route") },
        { key: "lot", label: t("kardex.lot") },
        { key: "delta", label: t("kardex.delta"), align: "right" },
        { key: "balance", label: t("kardex.balance"), align: "right" },
      ],
      rows: shown.entries.map((e) => ({
        date: fmtDateTime(e.date),
        folio: e.folio,
        type: labelOf(e.sourceDocType, e.type),
        route: `${place(e.from)} → ${place(e.to)}`,
        lot: e.lot.code,
        delta: `${e.delta > 0 ? "+" : ""}${fmt(e.delta)}`,
        balance: fmt(e.balance),
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, t, tt]);

  type Row = KardexReport["entries"][number];
  const columns: ReportCol<Row>[] = [
    { key: "date", label: t("kardex.date"), width: 170, value: (e) => e.date, render: (e) => fmtDateTime(e.date) },
    { key: "folio", label: t("kardex.folio"), width: 130, value: (e) => e.folio },
    { key: "type", label: t("kardex.type"), width: 170, value: (e) => labelOf(e.sourceDocType, e.type) },
    { key: "route", label: t("kardex.route"), width: 240, value: (e) => `${place(e.from)} → ${place(e.to)}` },
    { key: "lot", label: t("kardex.lot"), width: 120, value: (e) => e.lot.code },
    { key: "delta", label: t("kardex.delta"), numeric: true, width: 100, value: (e) => e.delta, render: (e) => `${e.delta > 0 ? "+" : ""}${fmt(e.delta)}` },
    { key: "balance", label: t("kardex.balance"), numeric: true, width: 100, value: (e) => e.balance, render: (e) => fmt(e.balance) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} md={4}>
          <ITSelect name="kardexProduct" label={t("kardex.product")} options={[{ value: "", label: t("kardex.pickProduct") }, ...products.map((p) => ({ value: p.id, label: `${p.code} · ${productLabel(p)}` }))]} value={productId} onChange={(e) => setProductId(e.target.value)} />
        </ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITSelect name="kardexWarehouse" label={t("kardex.warehouse")} options={[{ value: "", label: t("kardex.allWarehouses") }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
        </ITGrid>
      </ITGrid>
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-kardex-${shown?.product.code ?? ""}-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {!productId && <ITText muted>{t("kardex.pickHint")}</ITText>}
      {shown && (
        <PanelCard
          title={`${shown.product.code} · ${productLabel(shown.product)}`}
          description={`${t("kardex.opening")}: ${fmt(shown.opening)}`}
        >
          <ReportTable rows={shown.entries} empty={t("kardex.none")} columns={columns} />
        </PanelCard>
      )}
    </ITFlex>
  );
}
