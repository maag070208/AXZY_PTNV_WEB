import { ITBadget, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  fmtQty,
  lotStatusColor,
  useKitchenCategoryOptions,
  useSupplierOptions,
  LOT_STATUSES,
  type KitchenLotRow,
  KitchenAlertKpis,
  useKitchenAlerts,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";

/** Existencias por lote: qué hay, en qué lote y cuándo caduca. */
export default function KitchenLotsPanel() {
  const { t } = useTranslation("kitchen");
  const categories = useKitchenCategoryOptions(true);
  const suppliers = useSupplierOptions(true);
  const { alerts } = useKitchenAlerts();

  const columns: Column<KitchenLotRow>[] = [
    {
      key: "lotCode",
      label: t("columns.lotCode"),
      type: "string",
      width: 140,
      filter: true,
      sortable: false,
      render: (r) => <ITText className="text-[11px] font-mono text-slate-700">{r.lotCode}</ITText>,
    },
    {
      key: "item",
      label: t("columns.item"),
      type: "string",
      width: 220,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0}>
          <ITText className="text-[12px] font-black text-slate-800">{r.item.name}</ITText>
          <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {r.item.code} · {r.item.category.name}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "categoryId",
      label: t("columns.category"),
      type: "catalog",
      width: 140,
      sortable: false,
      filter: "catalog",
      catalogOptions: { data: categories.data.map((c) => ({ id: c.id, name: c.name })) },
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.item.category.name}</ITText>,
    },
    {
      key: "supplierId",
      label: t("columns.supplier"),
      type: "catalog",
      width: 140,
      sortable: false,
      filter: "catalog",
      catalogOptions: { data: suppliers.data.map((s) => ({ id: s.id, name: s.name })) },
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.supplier?.name ?? "—"}</ITText>,
    },
    {
      key: "expiresAt",
      label: t("columns.expiresAt"),
      type: "date",
      width: 120,
      sortable: false,
      filter: "date-range",
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.expiresAt ?? "—"}</ITText>,
    },
    {
      key: "onHand",
      label: t("columns.onHand"),
      type: "number",
      width: 120,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] font-black text-slate-800">
          {fmtQty(r.onHand)} {r.item.unit.name}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("columns.status"),
      type: "catalog",
      width: 130,
      sortable: false,
      filter: "catalog",
      catalogOptions: { data: LOT_STATUSES.map((s) => ({ id: s, name: dyn(t)(`lotStatus.${s}`) })) },
      render: (r) => (
        <ITBadget color={lotStatusColor(r.status)} size="sm">
          {dyn(t)(`lotStatus.${r.status}`)}
        </ITBadget>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      <KitchenAlertKpis alerts={alerts} keys={["expiring", "expired"]} />
      <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={kitchenApi.lotsTable as never}
      defaultItemsPerPage={50}
      itemsPerPageOptions={[10, 25, 50, 100]}
      size="lg"
      virtualized
      virtualizedMaxHeight={560}
      rowHeight={54}
      />
    </ITFlex>
  );
}
