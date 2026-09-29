import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEye } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  INVOICE_STATUSES,
  useSupplierOptions,
  type SupplierInvoiceRow,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Lista de facturas de proveedor (tabla server-side). */
export default function InvoicesPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const suppliers = useSupplierOptions(true);
  const [reloadKey] = useState(0);

  const columns: Column<SupplierInvoiceRow>[] = [
    {
      key: "number",
      label: t("invoices.columns.number"),
      type: "string",
      width: 130,
      filter: true,
      sortable: false,
      render: (i) => <ITText className="text-[12px] font-mono font-bold text-slate-700">{i.number}</ITText>,
    },
    {
      key: "supplierId",
      label: t("invoices.columns.supplier"),
      type: "catalog",
      width: 190,
      filter: "search",
      sortable: false,
      catalogOptions: { data: suppliers.data.map((s) => ({ id: s.id, name: s.name })) },
      render: (i) => <ITText className="text-[12px] font-bold text-slate-800">{i.supplier.name}</ITText>,
    },
    {
      key: "purchaseOrder",
      label: t("invoices.columns.purchaseOrder"),
      type: "string",
      width: 120,
      sortable: false,
      render: (i) => <ITText className="text-[11px] font-mono text-slate-600">{i.purchaseOrder?.number ?? "—"}</ITText>,
    },
    {
      key: "date",
      label: t("invoices.columns.date"),
      type: "date",
      width: 120,
      filter: "date-range",
      sortable: false,
      render: (i) => <ITText className="text-[11px] text-slate-600">{i.date}</ITText>,
    },
    {
      key: "total",
      label: t("invoices.columns.total"),
      type: "number",
      width: 120,
      sortable: false,
      render: (i) => <ITText className="text-[12px] font-bold text-slate-700">{money(i.total)}</ITText>,
    },
    {
      key: "status",
      label: t("invoices.columns.status"),
      type: "catalog",
      width: 120,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: INVOICE_STATUSES.map((s) => ({ id: s, name: dyn(t)(`invoices.status.${s}`) })) },
      render: (i) => <InvoiceStatusBadge status={i.status} />,
    },
    {
      key: "createdBy",
      label: t("invoices.columns.createdBy"),
      type: "string",
      width: 150,
      filter: true,
      sortable: false,
      render: (i) => <ITText className="text-[11px] text-slate-600">{i.createdBy.name}</ITText>,
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 70,
      actions: (i) => (
        <ITButton variant="outlined" size="lg" color="primary" title={t("invoices.detail")} onClick={() => navigate(`/kitchen/invoices/${i.id}`)}>
          <FaEye size={12} />
        </ITButton>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={kitchenApi.invoicesTable as never}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={50}
        itemsPerPageOptions={[10, 25, 50, 100]}
        layout="fixed"
        density="compact"
        virtualized
        virtualizedMaxHeight={560}
        rowHeight={54}
      />
    </ITFlex>
  );
}
