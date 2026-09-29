import { useMemo } from "react";
import { ITBadget, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { kitchenApi, fmtQty, stockStatusColor, type RestockRow } from "@entities/kitchen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { dyn } from "@shared/i18n/dyn";

/** Lo que está bajo mínimo y cuánto conviene pedir (sugerido = máx − disponible). */
export default function KitchenRestockPanel() {
  const { t } = useTranslation("kitchen");

  const fetchData = useMemo(
    () => makeClientTableFetch<RestockRow>(() => kitchenApi.restock(), { name: {}, code: {} }),
    []
  );

  const columns: Column<RestockRow>[] = [
    {
      key: "name",
      label: t("columns.name"),
      type: "string",
      width: 260,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0}>
          <ITText className="text-[12px] font-black text-slate-800">{r.name}</ITText>
          <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {r.code} · {r.category.name}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "available",
      label: t("columns.available"),
      type: "number",
      width: 130,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-600">
          {fmtQty(r.available)} {r.unit.name}
        </ITText>
      ),
    },
    {
      key: "minStock",
      label: t("columns.minMax"),
      type: "number",
      width: 120,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-500">
          {fmtQty(r.minStock)} / {r.maxStock == null ? "—" : fmtQty(r.maxStock)}
        </ITText>
      ),
    },
    {
      key: "stockStatus",
      label: t("columns.stockStatus"),
      type: "catalog",
      width: 130,
      sortable: false,
      render: (r) => (
        <ITBadget color={stockStatusColor(r.stockStatus)} size="sm">
          {dyn(t)(`stockStatus.${r.stockStatus}`)}
        </ITBadget>
      ),
    },
    {
      key: "suggested",
      label: t("columns.suggested"),
      type: "number",
      width: 130,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] font-black text-emerald-700">
          {fmtQty(r.suggested)} {r.unit.name}
        </ITText>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      defaultItemsPerPage={50}
      itemsPerPageOptions={[10, 25, 50, 100]}
      size="lg"
      virtualized
      virtualizedMaxHeight={560}
      rowHeight={54}
    />
  );
}
