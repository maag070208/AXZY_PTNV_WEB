import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITCheckbox, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaShoppingCart } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { KitchenAlertKpis, kitchenApi, fmtQty, stockStatusColor, useKitchenAlerts, type RestockRow } from "@entities/kitchen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { dyn } from "@shared/i18n/dyn";

/** Lo que está bajo mínimo, cuánto hay y cuánto conviene pedir (resta el tránsito). */
export default function KitchenRestockPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const canCreate = useCan("purchase_orders.create");
  const { alerts } = useKitchenAlerts();
  /** Artículos seleccionados para la orden: itemId → cantidad sugerida. */
  const [selected, setSelected] = useState<Map<string, number>>(new Map());

  const fetchData = useMemo(
    () => makeClientTableFetch<RestockRow>(() => kitchenApi.restock(), { name: {}, code: {} }),
    []
  );

  const toggle = (row: RestockRow) =>
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(row.id)) next.delete(row.id);
      else next.set(row.id, row.suggested);
      return next;
    });

  const createOrder = () => {
    const items = [...selected.entries()].map(([itemId, quantity]) => ({ itemId, quantity }));
    navigate("/kitchen/purchase-orders/new", { state: { items } });
  };

  const columns: Column<RestockRow>[] = [
    ...(canCreate
      ? [
          {
            key: "select",
            label: "",
            type: "actions" as const,
            width: 60,
            actions: (r: RestockRow) => (
              <ITCheckbox name={`restock-${r.id}`} checked={selected.has(r.id)} onChange={() => toggle(r)} />
            ),
          },
        ]
      : []),
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
      width: 120,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-600">
          {fmtQty(r.available)} {r.unit.name}
        </ITText>
      ),
    },
    {
      key: "inTransit",
      label: t("purchaseOrders.columns.inTransit"),
      type: "number",
      width: 120,
      sortable: false,
      render: (r) => (
        <ITText className={`text-[11px] ${r.inTransit > 0 ? "font-bold text-sky-600" : "text-slate-400"}`}>
          {fmtQty(r.inTransit)}
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
    <ITFlex direction="column" gap={3}>
      <KitchenAlertKpis alerts={alerts} keys={["low", "over"]} />
      {canCreate && (
        <ITFlex justify="end">
          <ITButton variant="filled" color="primary" disabled={selected.size === 0} onClick={createOrder}>
            <ITFlex align="center" gap={1}>
              <FaShoppingCart size={12} />
              <ITText className="font-bold text-[11px]">
                {t("purchaseOrders.createFromRestock")} ({selected.size})
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      )}

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
    </ITFlex>
  );
}
