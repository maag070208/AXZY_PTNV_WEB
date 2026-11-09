import { useMemo, useState } from "react";
import {
  ITAlert,
  ITChip,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITSegmentedControl,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBoxes, FaExclamationTriangle, FaTruck } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, type HotelLot, type HotelStockLight, type HotelStockSummaryRow } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";

type QuickKind = "ALL" | "LINEN" | "CONSUMABLE" | "EQUIPMENT";

/** Columnas por tipo de almacén (clave = `kind` del almacén en `byKind`). */
const KIND_COLUMNS = [
  { key: "CENTRAL", label: "warehouse" },
  { key: "NEW_LINEN", label: "newLinen" },
  { key: "LAUNDRY", label: "laundry" },
  { key: "ZONE", label: "zones" },
  { key: "POINT", label: "points" },
  { key: "SPA", label: "spa" },
] as const;

const LIGHT_COLOR: Record<HotelStockLight, "success" | "warning" | "danger" | "gray"> = {
  green: "success",
  yellow: "warning",
  red: "danger",
  none: "gray",
};

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

/** Existencias de blancos: KPIs, tabla por artículo × tipo de almacén y detalle de lotes. */
export default function LinenStockBoard() {
  const { t } = useTranslation("hotel-linen");
  const tt = dyn(t);
  const [quick, setQuick] = useState<QuickKind>("ALL");
  const [rows, setRows] = useState<HotelStockSummaryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lotsDialog, setLotsDialog] = useState<{
    row: HotelStockSummaryRow | null;
    lots: HotelLot[];
    loading: boolean;
    error: string | null;
  }>({ row: null, lots: [], loading: false, error: null });

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<HotelStockSummaryRow>(
        async () => {
          try {
            const list = await hotelLinenApi.stockSummary(quick === "ALL" ? undefined : quick);
            setRows(list);
            setError(null);
            return list;
          } catch (e) {
            setError((e as Error).message);
            setRows([]);
            return [];
          }
        },
        {
          name: { value: (r) => `${r.code} ${r.name}`, sortValue: (r) => r.code },
          light: { match: "equals", sortValue: (r) => r.pct ?? -1 },
          pct: { sortValue: (r) => r.pct ?? -1 },
          ...Object.fromEntries(KIND_COLUMNS.map((k) => [k.key, { sortValue: (r: HotelStockSummaryRow) => r.byKind[k.key] ?? 0 }])),
        }
      ),
    [quick]
  );

  const openLots = (row: HotelStockSummaryRow) => {
    setLotsDialog({ row, lots: [], loading: true, error: null });
    hotelLinenApi
      .lots(row.productId)
      .then((lots) => setLotsDialog({ row, lots, loading: false, error: null }))
      .catch((e: Error) => setLotsDialog({ row, lots: [], loading: false, error: e.message }));
  };

  const belowPar = rows.filter((r) => r.light === "red" || r.light === "yellow").length;
  const inTransit = rows.reduce((s, r) => s + r.inTransit, 0);
  const totalPieces = rows.reduce((s, r) => s + r.total, 0);

  const numberCell = (n: number) => <ITText className="text-[12px] tabular-nums">{n ? fmt(n) : "—"}</ITText>;

  const columns: Column<HotelStockSummaryRow>[] = [
    {
      key: "name",
      label: t("stock.columns.item"),
      type: "string",
      width: 260,
      filter: true,
      render: (r) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{r.name}</ITText>
          <ITText muted className="font-mono text-[11px]">
            {r.size ? `${r.code} · ${r.size}` : r.code}
          </ITText>
        </ITFlex>
      ),
    },
    ...KIND_COLUMNS.map((k) => ({
      key: k.key,
      label: t(`stock.columns.${k.label}`),
      type: "number" as const,
      width: 105,
      render: (r: HotelStockSummaryRow) => numberCell(r.byKind[k.key] ?? 0),
    })),
    {
      key: "inTransit",
      label: t("stock.columns.inTransit"),
      type: "number",
      width: 110,
      render: (r) => numberCell(r.inTransit),
    },
    {
      key: "total",
      label: t("stock.columns.total"),
      type: "number",
      width: 100,
      render: (r) => <ITText className="text-[12px] font-bold tabular-nums">{fmt(r.total)}</ITText>,
    },
    {
      key: "par",
      label: t("stock.columns.par"),
      type: "number",
      width: 90,
      render: (r) => numberCell(r.par),
    },
    {
      key: "pct",
      label: t("stock.columns.pct"),
      type: "number",
      width: 90,
      render: (r) => (
        <ITText className="text-[12px] tabular-nums">{r.pct === null ? "—" : `${Math.round(r.pct * 100)}%`}</ITText>
      ),
    },
    {
      key: "light",
      label: t("stock.columns.light"),
      type: "catalog",
      width: 130,
      filter: "catalog",
      catalogOptions: { data: (["green", "yellow", "red", "none"] as const).map((l) => ({ id: l, name: tt(`stock.light.${l}`) })) },
      render: (r) => <ITChip size="sm" color={LIGHT_COLOR[r.light]} label={tt(`stock.light.${r.light}`)} />,
    },
  ];

  const quickOptions: Array<{ value: QuickKind; label: string }> = [
    { value: "ALL", label: t("common.all") },
    { value: "LINEN", label: tt("kind.LINEN") },
    { value: "CONSUMABLE", label: tt("kind.CONSUMABLE") },
    { value: "EQUIPMENT", label: tt("kind.EQUIPMENT") },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} md={4}>
          <KpiTile
            label={t("stock.kpi.belowPar")}
            value={belowPar}
            icon={<FaExclamationTriangle size={14} />}
            tone={belowPar > 0 ? "amber" : "neutral"}
            hint={belowPar === 0 ? t("stock.kpi.allGood") : undefined}
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <KpiTile
            label={t("stock.kpi.inTransit")}
            value={fmt(inTransit)}
            icon={<FaTruck size={14} />}
            tone={inTransit > 0 ? "sky" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <KpiTile label={t("stock.kpi.totalPieces")} value={fmt(totalPieces)} icon={<FaBoxes size={14} />} tone="emerald" />
        </ITGrid>
      </ITGrid>

      <PanelCard
        title={t("stock.title")}
        description={t("stock.description")}
        actions={<ITSegmentedControl size="sm" options={quickOptions} value={quick} onChange={(v) => setQuick(v as QuickKind)} />}
      >
        <ITFlex direction="column" gap={3}>
          {error && (
            <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </ITAlert>
          )}
          <ITDataTable
            key={`stock-${quick}`}
            showViewToggle={false}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchData as never}
            onRowClick={((row: HotelStockSummaryRow) => openLots(row)) as never}
            size="lg"
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50, 100]}
            layout="fixed"
            density="compact"
            rowHeight={56}
            virtualized
            virtualizedMaxHeight={520}
          />
        </ITFlex>
      </PanelCard>

      <ITDialog
        isOpen={lotsDialog.row !== null}
        onClose={() => setLotsDialog({ row: null, lots: [], loading: false, error: null })}
        title={t("stock.lots.title", { name: lotsDialog.row?.name ?? "" })}
      >
        <ITFlex direction="column" gap={3} className="min-w-[420px]">
          {lotsDialog.error && <ITAlert variant="error">{lotsDialog.error}</ITAlert>}
          {lotsDialog.loading && <ITText muted>{t("common.loading")}</ITText>}
          {!lotsDialog.loading && !lotsDialog.error && lotsDialog.lots.length === 0 && (
            <ITText muted>{t("stock.lots.empty")}</ITText>
          )}
          {lotsDialog.lots.map((lot) => (
            <ITFlex key={lot.id} direction="column" gap={1}>
              <ITFlex justify="between" align="center">
                <ITText className="font-mono text-[12px] font-bold">{lot.code}</ITText>
                <ITChip size="sm" color={lot.balance > 0 ? "success" : "gray"} label={t("stock.lots.balance", { n: fmt(lot.balance) })} />
              </ITFlex>
              <ITText muted className="text-[11px]">
                {t("stock.lots.received", { date: new Date(lot.receivedAt).toLocaleDateString("es-MX"), n: fmt(lot.initialQuantity) })}
              </ITText>
              <ITFlex wrap="wrap" gap={1}>
                {lot.warehouses.map((w) => (
                  <ITChip key={w.warehouseId} size="sm" label={`${w.name}: ${fmt(w.quantity)}`} />
                ))}
              </ITFlex>
            </ITFlex>
          ))}
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
