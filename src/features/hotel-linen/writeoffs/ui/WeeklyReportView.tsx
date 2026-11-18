import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITDatePicker, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaFilePdf, FaMoneyBillWave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { WRITEOFF_REASONS, writeoffApi, type WeeklyWriteoffReport } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { fmt, dateStrToLocal, localToDateStr, money, mondayOf } from "../lib";

interface WeeklyRow {
  id: string;
  label: string;
  size: string | null;
  byReason: Record<string, number>;
  total: number;
  cost: number;
  isTotals?: boolean;
}

/** Reporte semanal (formato pág. 15): artículo × motivo con total y costo, solo bajas autorizadas. */
interface Props {
  /** Descarga el PDF del reporte (lo provee la página: las features no importan widgets). */
  onDownloadPdf: (report: WeeklyWriteoffReport) => void;
}

export default function WeeklyReportView({ onDownloadPdf }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const monday = mondayOf(new Date());
  const [from, setFrom] = useState(localToDateStr(monday));
  const [to, setTo] = useState(localToDateStr(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)));
  const [report, setReport] = useState<WeeklyWriteoffReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    writeoffApi
      .weekly(from, to)
      .then((r) => {
        setReport(r);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(load, [load]);

  const picker = (name: string, label: string, value: string, set: (v: string) => void) => (
    <ITDatePicker
      name={name}
      label={label}
      value={dateStrToLocal(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (v instanceof Date) set(localToDateStr(v));
      }}
    />
  );

  const fetchRows = useMemo(() => {
    const rows: WeeklyRow[] = report
      ? [
          ...report.rows.map((r) => ({ id: r.productId, label: r.name, size: r.size ?? null, byReason: r.byReason as Record<string, number>, total: r.total, cost: r.cost })),
          { id: "totals", label: t("writeoffs.weekly.totals"), size: null, byReason: report.totals.byReason as Record<string, number>, total: report.totals.total, cost: report.totals.cost, isTotals: true },
        ]
      : [];
    return makeClientTableFetch<WeeklyRow>(() => Promise.resolve(rows));
  }, [report, t]);

  const num = (v: string, bold?: boolean) => <ITText className={`block text-right text-[12px] tabular-nums ${bold ? "font-bold" : ""}`}>{v}</ITText>;
  const columns: Column<WeeklyRow>[] = useMemo(
    () => [
      {
        key: "label",
        label: t("writeoffs.weekly.item"),
        type: "string",
        width: 220,
        sortable: false,
        render: (r) => (
          <ITText className="text-[12px] font-semibold">
            {r.label}
            {r.size ? <ITText as="span" muted className="text-[11px] font-normal"> · {r.size}</ITText> : null}
          </ITText>
        ),
      },
      ...WRITEOFF_REASONS.map((c) => ({
        key: `reason-${c}`,
        label: c,
        type: "number" as const,
        width: 80,
        sortable: false,
        render: (r: WeeklyRow) => num(r.isTotals ? fmt(r.byReason[c] ?? 0) : r.byReason[c] ? fmt(r.byReason[c]) : "—", r.isTotals),
      })),
      { key: "total", label: t("writeoffs.weekly.total"), type: "number" as const, width: 90, sortable: false, render: (r: WeeklyRow) => num(fmt(r.total), true) },
      { key: "cost", label: t("writeoffs.weekly.cost"), type: "number" as const, width: 110, sortable: false, render: (r: WeeklyRow) => num(money(r.cost), r.isTotals) },
    ],
    [t]
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITGrid container columns={12} spacing={3} className="items-end">
        <ITGrid item xs={6} md={3}>{picker("weeklyFrom", t("writeoffs.weekly.from"), from, setFrom)}</ITGrid>
        <ITGrid item xs={6} md={3}>{picker("weeklyTo", t("writeoffs.weekly.to"), to, setTo)}</ITGrid>
        <ITGrid item xs={12} md={3} className="flex items-end">
          <ITButton
            variant="outlined"
            color="primary"
            icon={<FaFilePdf size={12} />}
            label={t("writeoffs.weekly.pdf")}
            disabled={!report || report.rows.length === 0}
            onClick={() => report && onDownloadPdf(report)}
          />
        </ITGrid>
      </ITGrid>

      {report && report.rows.length > 0 && (
        <ITText as="div" className="grid !grid-cols-2 gap-3 md:!grid-cols-4">
          <KpiTile size="sm" label={t("writeoffs.weekly.total")} value={fmt(report.totals.total)} icon={<FaBoxOpen size={12} />} tone="amber" />
          <KpiTile size="sm" label={t("writeoffs.weekly.cost")} value={money(report.totals.cost)} icon={<FaMoneyBillWave size={12} />} tone="rose" />
        </ITText>
      )}

      {loading && !report ? (
        <ITText muted>{t("common.loading")}</ITText>
      ) : !report || report.rows.length === 0 ? (
        <ITText muted>{t("writeoffs.weekly.empty")}</ITText>
      ) : (
        <ITDataTable
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchRows as never}
          size="lg"
          defaultItemsPerPage={50}
          itemsPerPageOptions={[50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={44}
        />
      )}
    </ITFlex>
  );
}
