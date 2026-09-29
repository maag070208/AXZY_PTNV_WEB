import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITButton, ITDatePicker, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBuilding, FaCoins, FaFileCsv, FaShoppingCart } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import { KpiTile } from "@shared/ui/kpi-tile";
import { kitchenApi, fmtMoney, type CostCenterSpending } from "@entities/kitchen";
import { fileName } from "@shared/i18n";

const HEAD = "text-[10px] font-black uppercase tracking-widest text-slate-400";
const GRID = "grid grid-cols-[minmax(200px,2fr)_repeat(4,minmax(90px,1fr))] items-center gap-3";

const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Gasto por centro de costo: OC con recepción en el periodo, agrupadas por centro. */
export default function CostCenterSpendingPanel() {
  const { t } = useTranslation("kitchen");
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [report, setReport] = useState<CostCenterSpending | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    kitchenApi
      .costCenterSpending(from ? localDay(from) : null, to ? localDay(to) : null)
      .then(setReport)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = report?.rows ?? [];
  const totals = report?.totals ?? { orders: 0, subtotal: 0, tax: 0, total: 0 };

  const exportCsv = () => {
    const header = [t("costCenterSpending.columns.center"), t("costCenterSpending.columns.orders"), t("invoices.totals.subtotal"), t("invoices.totals.tax"), t("invoices.totals.total")];
    const lines = rows.map((r) => [
      r.costCenter ? `${r.costCenter.code} ${r.costCenter.name}` : t("costCenterSpending.unassigned"),
      String(r.orders),
      String(r.subtotal),
      String(r.tax),
      String(r.total),
    ]);
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...lines].map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName("kitchenCostCenterSpending")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <div className="grid !grid-cols-1 gap-3 md:!grid-cols-3">
        <KpiTile label={t("costCenterSpending.kpi.orders")} value={totals.orders} icon={<FaShoppingCart size={15} />} tone="violet" />
        <KpiTile label={t("costCenterSpending.kpi.tax")} value={fmtMoney(totals.tax)} icon={<FaCoins size={15} />} tone="amber" />
        <KpiTile label={t("costCenterSpending.kpi.total")} value={fmtMoney(totals.total)} icon={<FaBuilding size={15} />} tone="emerald" />
      </div>

      <PanelCard
        title={t("costCenterSpending.title")}
        description={t("costCenterSpending.hint")}
        actions={
          <ITButton variant="outlined" color="gray" size="sm" disabled={rows.length === 0} onClick={exportCsv}>
            <ITFlex align="center" gap={1}>
              <FaFileCsv size={11} />
              <ITText className="font-bold text-[11px]">{t("costCenterSpending.exportCsv")}</ITText>
            </ITFlex>
          </ITButton>
        }
      >
        <div className="grid gap-3 md:!grid-cols-2">
          <ITDatePicker name="spendingFrom" label={t("costCenterSpending.from")} value={from ?? undefined} onChange={(e) => { const v = e.target.value; if (v instanceof Date) setFrom(v); }} className="w-full" />
          <ITDatePicker name="spendingTo" label={t("costCenterSpending.to")} value={to ?? undefined} onChange={(e) => { const v = e.target.value; if (v instanceof Date) setTo(v); }} className="w-full" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className={`${GRID} border-b border-slate-100 pb-2`}>
              <span className={HEAD}>{t("costCenterSpending.columns.center")}</span>
              <span className={`${HEAD} text-right`}>{t("costCenterSpending.columns.orders")}</span>
              <span className={`${HEAD} text-right`}>{t("invoices.totals.subtotal")}</span>
              <span className={`${HEAD} text-right`}>{t("invoices.totals.tax")}</span>
              <span className={`${HEAD} text-right`}>{t("invoices.totals.total")}</span>
            </div>
            {rows.map((row) => {
              const key = row.costCenter?.id ?? "unassigned";
              return (
                <div key={key} className={`${GRID} border-b border-slate-50 py-2.5 last:border-0`}>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold text-slate-800">{row.costCenter?.name ?? t("costCenterSpending.unassigned")}</span>
                    <span className="block text-[10px] font-mono text-slate-400">{row.costCenter?.code ?? "—"}</span>
                  </span>
                  <span className="text-right text-[12px] font-bold tabular-nums text-slate-700">{row.orders}</span>
                  <span className="text-right text-[12px] tabular-nums text-slate-600">{fmtMoney(row.subtotal)}</span>
                  <span className="text-right text-[12px] tabular-nums text-slate-600">{fmtMoney(row.tax)}</span>
                  <span className="text-right text-[13px] font-black tabular-nums text-slate-900">{fmtMoney(row.total)}</span>
                </div>
              );
            })}
            {!loading && rows.length === 0 && <ITText className="block py-6 text-center text-[12px] text-slate-400">{t("costCenterSpending.empty")}</ITText>}
            {loading && <ITText className="block py-6 text-center text-[12px] text-slate-400">{t("common.loading")}</ITText>}
          </div>
        </div>
      </PanelCard>
    </ITFlex>
  );
}
