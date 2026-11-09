import { useMemo } from "react";
import { ITDataTable, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { PURCHASE_ORDER_STATUSES, purchaseApi, type PurchaseLookups, type PurchaseOrderRow } from "@entities/hotel-linen";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { day, money, qty } from "../lib";
import { OrderStatusChip } from "./PurchaseChips";

interface Props {
  lookups: PurchaseLookups;
  /** Si viene, solo esos estados (cada uno con su propia consulta). */
  statuses?: readonly string[];
  reloadKey: number;
  onRow: (id: string) => void;
}

/** Tabla server-side de OC. Con `statuses` junta varios estados (recepción: aprobadas y parciales). */
export default function OrdersTab({ lookups, statuses, reloadKey, onRow }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const tt = dyn(t);
  const multi = !!statuses && statuses.length > 0;

  const fetchData = useMemo(
    () => async (params: ITDataTableFetchParamsPost) => {
      if (!multi) return purchaseApi.ordersTable(params);
      const base = { ...params, page: 1, limit: 100 };
      const parts = await Promise.all(statuses!.map((status) => purchaseApi.ordersTable({ ...base, filters: { ...params.filters, status } })));
      const data = parts.flatMap((p) => p.data).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { data, total: data.length };
    },
    [multi, statuses]
  );

  const columns: Column<PurchaseOrderRow>[] = [
    { key: "folio", label: t("orders.columns.folio"), type: "string", width: 120, filter: !multi, render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText> },
    {
      key: "supplier",
      label: t("orders.columns.supplier"),
      type: "catalog",
      width: 220,
      filter: !multi ? "catalog" : false,
      sortable: false,
      catalogOptions: { data: lookups.suppliers },
      render: (r) => <ITText className="text-[12px]">{r.supplier?.name ?? t("orders.noSupplier")}</ITText>,
    },
    {
      key: "status",
      label: t("orders.columns.status"),
      type: "catalog",
      width: 190,
      filter: !multi ? "catalog" : false,
      catalogOptions: { data: PURCHASE_ORDER_STATUSES.map((s) => ({ id: s, name: tt(`orders.status.${s}`) })) },
      render: (r) => <OrderStatusChip status={r.status} />,
    },
    { key: "createdAt", label: t("orders.columns.createdAt"), type: "date", width: 120, filter: !multi ? "date-range" : false, render: (r) => <ITText className="text-[12px]">{day(r.createdAt)}</ITText> },
    { key: "expectedDate", label: t("orders.columns.expected"), type: "date", width: 120, filter: false, render: (r) => <ITText className="text-[12px]">{day(r.expectedDate)}</ITText> },
    { key: "pending", label: t("orders.columns.pending"), type: "number", width: 110, sortable: false, filter: false, render: (r) => <ITText className="text-[12px] tabular-nums">{qty(r.pendingQuantity)}</ITText> },
    { key: "total", label: t("orders.columns.total"), type: "number", width: 140, sortable: false, filter: false, render: (r) => <ITText className="text-[12px] font-bold tabular-nums">{money(r.total)}</ITText> },
  ];

  return (
    <ITDataTable
      key={`orders-${multi ? "multi" : "all"}-${reloadKey}`}
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: PurchaseOrderRow) => onRow(row.id)) as never}
      size="lg"
      defaultItemsPerPage={25}
      itemsPerPageOptions={[25, 50, 100]}
      layout="fixed"
      density="compact"
      rowHeight={56}
    />
  );
}
