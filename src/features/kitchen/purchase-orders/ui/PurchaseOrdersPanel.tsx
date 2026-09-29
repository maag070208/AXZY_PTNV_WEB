import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEdit, FaEye, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  PURCHASE_ORDER_STATUSES,
  useSupplierOptions,
  type PurchaseOrderRow,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import PurchaseOrderStatusBadge from "./PurchaseOrderStatusBadge";

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Lista de órdenes de compra (tabla server-side). */
export default function PurchaseOrdersPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const suppliers = useSupplierOptions(true);
  const [reloadKey] = useState(0);

  const columns: Column<PurchaseOrderRow>[] = [
    {
      key: "number",
      label: t("purchaseOrders.columns.number"),
      type: "string",
      width: 110,
      filter: true,
      sortable: true,
      render: (o) => <ITText className="text-[12px] font-mono font-bold text-slate-700">{o.number}</ITText>,
    },
    {
      key: "supplierId",
      label: t("purchaseOrders.columns.supplier"),
      type: "catalog",
      width: 200,
      filter: "search",
      sortable: false,
      catalogOptions: { data: suppliers.data.map((s) => ({ id: s.id, name: s.name })) },
      render: (o) => <ITText className="text-[12px] font-bold text-slate-800">{o.supplier.name}</ITText>,
    },
    {
      key: "status",
      label: t("purchaseOrders.columns.status"),
      type: "catalog",
      width: 150,
      filter: "catalog",
      sortable: true,
      catalogOptions: {
        data: PURCHASE_ORDER_STATUSES.map((s) => ({ id: s, name: dyn(t)(`purchaseOrders.status.${s}`) })),
      },
      render: (o) => <PurchaseOrderStatusBadge status={o.status} />,
    },
    {
      key: "expectedAt",
      label: t("purchaseOrders.columns.expectedAt"),
      type: "date",
      width: 120,
      filter: "date-range",
      sortable: true,
      render: (o) => <ITText className="text-[11px] text-slate-600">{o.expectedAt ?? "—"}</ITText>,
    },
    {
      key: "progress",
      label: t("purchaseOrders.columns.progress"),
      type: "string",
      width: 140,
      sortable: false,
      render: (o) => (
        <ITText className="text-[12px] font-bold text-slate-700">
          {o.receivedUnits} / {o.orderedUnits}
        </ITText>
      ),
    },
    {
      key: "total",
      label: t("purchaseOrders.columns.total"),
      type: "number",
      width: 120,
      sortable: false,
      render: (o) => <ITText className="text-[12px] font-bold text-slate-700">{money(o.total)}</ITText>,
    },
    {
      key: "createdBy",
      label: t("purchaseOrders.columns.createdBy"),
      type: "string",
      width: 150,
      filter: true,
      sortable: false,
      render: (o) => <ITText className="text-[11px] text-slate-600">{o.createdBy.name}</ITText>,
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 110,
      actions: (o) => (
        <ITFlex align="center" gap={1}>
          <ITButton
            variant="outlined"
            size="lg"
            color="primary"
            title={t("purchaseOrders.detail")}
            onClick={() => navigate(`/kitchen/purchase-orders/${o.id}`)}
          >
            <FaEye size={12} />
          </ITButton>
          {o.status === "DRAFT" && (
            <ITButton
              variant="outlined"
              size="lg"
              color="secondary"
              title={t("purchaseOrders.actions.edit")}
              onClick={() => navigate(`/kitchen/purchase-orders/${o.id}/edit`)}
            >
              <FaEdit size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      <ITFlex justify="end">
        <ITButton variant="filled" color="primary" onClick={() => navigate("/kitchen/purchase-orders/new")}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("purchaseOrders.new")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={kitchenApi.purchaseOrdersTable as never}
        reloadTrigger={reloadKey}
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
