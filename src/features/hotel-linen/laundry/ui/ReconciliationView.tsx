import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITDataTable, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaExclamationTriangle, FaTshirt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { laundryApi, type DailyReconciliation } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { dateStrToLocal, fmt, localToDateStr, todayStr } from "../lib";

type AreaRec = DailyReconciliation["areas"][number];
type AreaLine = AreaRec["lines"][number];
const KEYS = ["delivered", "receivedDirty", "stillInUse", "shortage"] as const;

/** Tabla de un área: entregado, sucio recibido, en uso y faltante (en rojo). */
function AreaTable({ lines }: { lines: AreaLine[] }) {
  const { t } = useTranslation("hotel-linen-laundry");
  const fetchData = useMemo(
    () =>
      makeClientTableFetch<AreaLine>(async () => lines, {
        name: { value: (l) => `${l.product.code} ${l.product.name} ${l.product.size ?? ""}`, sortValue: (l) => l.product.code },
      }),
    [lines]
  );
  const columns: Column<AreaLine>[] = [
    {
      key: "name",
      label: t("detail.item"),
      type: "string",
      width: 260,
      filter: true,
      render: (l) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
        </ITFlex>
      ),
    },
    ...KEYS.map((k) => ({
      key: k,
      label: t(`reconciliation.columns.${k}`),
      type: "number" as const,
      width: 120,
      render: (l: AreaLine) => (
        <ITText className={`text-[12px] tabular-nums ${k === "shortage" && l.shortage > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>{fmt(l[k])}</ITText>
      ),
    })),
  ];
  return (
    <ITDataTable
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      size="lg"
      defaultItemsPerPage={25}
      itemsPerPageOptions={[25, 50, 100]}
      layout="fixed"
      density="compact"
      rowHeight={56}
    />
  );
}

/** Conciliación diaria: por área, entregado a piso vs. sucio recibido y en uso; el faltante en rojo. */
export default function ReconciliationView() {
  const { t } = useTranslation("hotel-linen-laundry");
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<DailyReconciliation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    laundryApi
      .reconciliation(date)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(load, [load]);


  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={6} md={6}>
          <KpiTile label={t("reconciliation.totals.receivedDirty")} value={fmt(data?.totals.receivedDirty ?? 0)} icon={<FaTshirt size={14} />} tone={(data?.totals.receivedDirty ?? 0) > 0 ? "sky" : "neutral"} />
        </ITGrid>
        <ITGrid item xs={6} md={6}>
          <KpiTile
            label={t("reconciliation.totals.shortage")}
            value={fmt(data?.totals.shortage ?? 0)}
            icon={<FaExclamationTriangle size={14} />}
            tone={(data?.totals.shortage ?? 0) > 0 ? "rose" : "neutral"}
            hint={(data?.totals.shortage ?? 0) === 0 ? t("dirty.form.allGood") : undefined}
          />
        </ITGrid>
      </ITGrid>
      <PanelCard
        actions={
          <ITDatePicker
            name="reconciliationDate"
            label={t("reconciliation.date")}
            value={dateStrToLocal(date)}
            onChange={(e) => {
              const v = e.target.value;
              if (v instanceof Date) setDate(localToDateStr(v));
            }}
          />
        }
      />
      {!loading && data && data.areas.length === 0 && (
        <PanelCard>
          <ITFlex direction="column" align="center" gap={2} className="py-6">
            <FaTshirt size={28} className="opacity-30" />
            <ITText muted className="text-[12px]">{t("reconciliation.empty")}</ITText>
          </ITFlex>
        </PanelCard>
      )}

      {data?.areas.map((area) => (
        <PanelCard
          key={area.warehouse.id}
          title={area.warehouse.name}
          description={t("reconciliation.receipts", { count: area.receipts })}
          actions={<ITChip size="sm" color={area.totals.shortage > 0 ? "danger" : "success"} label={`${t("reconciliation.columns.shortage")}: ${fmt(area.totals.shortage)}`} />}
        >
          <AreaTable lines={area.lines} />
        </PanelCard>
      ))}
    </ITFlex>
  );
}
