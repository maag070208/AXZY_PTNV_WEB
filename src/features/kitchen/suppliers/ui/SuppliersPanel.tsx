import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEdit, FaEye } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { kitchenApi, type SupplierRow } from "@entities/kitchen";
import { useCan } from "@entities/user";

/** Lista de proveedores (tabla server-side con filtro por columna). */
export default function SuppliersPanel() {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const canManage = useCan("kitchen.manage");

  const columns: Column<SupplierRow>[] = [
    {
      key: "name",
      label: t("suppliers.columns.name"),
      type: "string",
      width: 240,
      filter: true,
      sortable: true,
      render: (s) => (
        <ITFlex direction="column" gap={0}>
          <ITText className="text-[12px] font-bold text-slate-800">{s.name}</ITText>
          {s.legalName && <ITText className="text-[10px] text-slate-400">{s.legalName}</ITText>}
        </ITFlex>
      ),
    },
    {
      key: "rfc",
      label: t("suppliers.columns.rfc"),
      type: "string",
      width: 140,
      filter: true,
      sortable: true,
      render: (s) => <ITText className="font-mono text-[11px] text-slate-600">{s.rfc ?? t("suppliers.empty")}</ITText>,
    },
    {
      key: "city",
      label: t("suppliers.columns.city"),
      type: "string",
      width: 130,
      filter: true,
      sortable: true,
      render: (s) => <ITText className="text-[11px] text-slate-600">{s.city ?? t("suppliers.empty")}</ITText>,
    },
    {
      key: "state",
      label: t("suppliers.columns.state"),
      type: "string",
      width: 130,
      filter: true,
      sortable: true,
      render: (s) => <ITText className="text-[11px] text-slate-600">{s.state ?? t("suppliers.empty")}</ITText>,
    },
    {
      key: "contact",
      label: t("suppliers.columns.contact"),
      type: "string",
      width: 220,
      filter: true,
      sortable: false,
      render: (s) =>
        s.primaryContact ? (
          <ITFlex direction="column" gap={0}>
            <ITText className="text-[11px] font-bold text-slate-700">
              {s.primaryContact.name}
              {s.primaryContact.position ? ` · ${s.primaryContact.position}` : ""}
            </ITText>
            <ITText className="text-[10px] text-slate-400">{s.primaryContact.phone ?? s.primaryContact.email ?? ""}</ITText>
          </ITFlex>
        ) : (
          <ITText className="text-[11px] text-slate-400">{t("suppliers.empty")}</ITText>
        ),
    },
    {
      key: "itemsCount",
      label: t("suppliers.columns.items"),
      type: "number",
      width: 90,
      sortable: false,
      render: (s) => <ITText className="text-[12px] font-bold text-slate-700">{s.itemsCount}</ITText>,
    },
    {
      key: "active",
      label: t("suppliers.columns.active"),
      type: "catalog",
      width: 110,
      filter: "catalog",
      sortable: true,
      catalogOptions: {
        data: [
          { id: "true", name: t("suppliers.active") },
          { id: "false", name: t("suppliers.inactive") },
        ],
      },
      render: (s) => (
        <ITBadget color={s.active ? "success" : "gray"} size="sm">
          {s.active ? t("suppliers.active") : t("suppliers.inactive")}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 100,
      actions: (s) => (
        <ITFlex align="center" gap={1}>
          <ITButton variant="outlined" size="lg" color="primary" title={t("suppliers.actions.view")} onClick={() => navigate(`/kitchen/suppliers/${s.id}`)}>
            <FaEye size={12} />
          </ITButton>
          {canManage && (
            <ITButton variant="outlined" size="lg" color="secondary" title={t("suppliers.actions.edit")} onClick={() => navigate(`/kitchen/suppliers/${s.id}/edit`)}>
              <FaEdit size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={kitchenApi.suppliersTable as never}
        defaultItemsPerPage={50}
        itemsPerPageOptions={[10, 25, 50, 100]}
        size="lg"
        virtualized
        virtualizedMaxHeight={560}
        rowHeight={58}
      />
    </ITFlex>
  );
}
