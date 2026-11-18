import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITDataTable, ITDatePicker, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaHandHoldingHeart, FaTruck, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { amenityApi, type SpaDaily } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { dateStrToLocal, fmt, localToDateStr, todayStr } from "../lib";

const cell = "text-[12px] tabular-nums text-right";

/** Toallas del Spa del día: entregadas, sucias devueltas, en uso y faltante. */
export default function SpaTodayPanel() {
  const { t } = useTranslation("hotel-linen-amenity");
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<SpaDaily | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    amenityApi
      .spaDaily(date)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);
  useEffect(load, [load]);

  type SpaRow = SpaDaily["rows"][number];
  const rows = data?.rows;
  const fetchRows = useMemo(() => makeClientTableFetch<SpaRow>(() => Promise.resolve(rows ?? [])), [rows]);
  const columns: Column<SpaRow>[] = useMemo(
    () => [
      {
        key: "product.name",
        label: t("spa.item"),
        type: "string",
        width: 260,
        filter: true,
        render: (r) => (
          <ITFlex direction="column">
            <ITText className="text-[12px] font-bold">{r.product.name}</ITText>
            <ITText muted className="font-mono text-[11px]">{r.product.code}</ITText>
          </ITFlex>
        ),
      },
      { key: "delivered", label: t("spa.delivered"), type: "number", width: 100, render: (r) => <ITText className={cell}>{fmt(r.delivered)}</ITText> },
      { key: "returnedDirty", label: t("spa.returned"), type: "number", width: 100, render: (r) => <ITText className={cell}>{fmt(r.returnedDirty)}</ITText> },
      { key: "inUse", label: t("spa.inUse"), type: "number", width: 100, render: (r) => <ITText className={cell}>{fmt(r.inUse)}</ITText> },
      { key: "shortage", label: t("spa.shortage"), type: "number", width: 100, render: (r) => <ITText className={`${cell} ${r.shortage > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>{fmt(r.shortage)}</ITText> },
    ],
    [t]
  );

  const totals = data?.totals ?? { delivered: 0, returnedDirty: 0, inUse: 0, shortage: 0 };

  return (
    <PanelCard
      title={t("spa.title")}
      description={t("spa.description")}
      actions={
        <ITDatePicker
          name="spaDate"
          label={t("spa.date")}
          value={dateStrToLocal(date)}
          onChange={(e) => {
            const v = e.target.value;
            if (v instanceof Date) setDate(localToDateStr(v));
          }}
        />
      }
    >
      <ITFlex direction="column" gap={4}>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITText as="div" className="grid !grid-cols-2 gap-3 md:!grid-cols-4">
          <KpiTile size="sm" label={t("spa.delivered")} value={fmt(totals.delivered)} icon={<FaTruck size={12} />} tone={totals.delivered > 0 ? "sky" : "neutral"} />
          <KpiTile size="sm" label={t("spa.returned")} value={fmt(totals.returnedDirty)} icon={<FaUndo size={12} />} tone={totals.returnedDirty > 0 ? "violet" : "neutral"} />
          <KpiTile size="sm" label={t("spa.inUse")} value={fmt(totals.inUse)} icon={<FaHandHoldingHeart size={12} />} tone={totals.inUse > 0 ? "emerald" : "neutral"} />
          <KpiTile size="sm" label={t("spa.shortage")} value={fmt(totals.shortage)} icon={<FaExclamationTriangle size={12} />} tone={totals.shortage > 0 ? "rose" : "neutral"} />
        </ITText>
        {!loading && data && !data.warehouse && <ITText muted>{t("spa.noSpa")}</ITText>}
        {!loading && data?.warehouse && data.rows.length === 0 && <ITText muted>{t("spa.none")}</ITText>}
        {data && data.rows.length > 0 && (
          <ITDataTable
            showViewToggle={false}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchRows as never}
            size="lg"
            defaultItemsPerPage={10}
            itemsPerPageOptions={[10, 25, 50]}
            layout="fixed"
            density="compact"
            rowHeight={52}
          />
        )}
      </ITFlex>
    </PanelCard>
  );
}
