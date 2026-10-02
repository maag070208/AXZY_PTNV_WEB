import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaFileExcel, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type Device, type DeviceType } from "@entities/inventory";
import { useCan } from "@entities/user";

export default function DevicesPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const canCreate = useCan("devices.create");

  useEffect(() => {
    inventoryApi.types().then(setTypes);
  }, []);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Device>(() => inventoryApi.devices({ stock: true }), {
        name: { value: (d) => [d.name, d.brand, d.model] },
        typeId: { match: "equals", sortValue: (d) => d.type?.name },
        available: { value: (d) => d.stock?.AVAILABLE ?? 0 },
        loaned: { value: (d) => d.stock?.ON_LOAN ?? 0 },
        retirement: { value: (d) => d.stock?.RETIRED ?? 0 },
        total: { value: (d) => d.stock?.total ?? 0 },
      }),
    []
  );

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: t("devices.colName"),
      width: 280,
      sortable: false,
      filter: true,
      render: (d: Device) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[11px] font-bold text-slate-800">{d.name}</ITText>
          <ITText className="text-[10px] text-slate-400">{d.brand} {d.model}</ITText>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "typeId",
      label: t("devices.colType"),
      width: 180,
      sortable: false,
      filter: "catalog" as const,
      catalogOptions: {
        // Todos los tipos: también hay dispositivos de tipos inactivos.
        data: types,
        loading: false,
        error: false,
      },
      render: (d: Device) => <ITBadget color="gray" size="lg">{d.type?.name ?? ""}</ITBadget>,
    },
    {
      type: "number",
      key: "available",
      label: t("devices.colAvail"),
      width: 110,
      sortable: false,
      render: (d: Device) => <ITText className="text-[11px] font-bold text-emerald-600">{d.stock?.AVAILABLE ?? 0}</ITText>,
    },
    {
      type: "number",
      key: "loaned",
      label: t("devices.colLoaned"),
      width: 110,
      sortable: false,
      render: (d: Device) => <ITText className="text-[11px] font-bold text-amber-600">{d.stock?.ON_LOAN ?? 0}</ITText>,
    },
    {
      type: "number",
      key: "retirement",
      label: t("devices.colRetirement"),
      width: 110,
      sortable: false,
      render: (d: Device) => <ITText className="text-[11px] font-bold text-red-500">{d.stock?.RETIRED ?? 0}</ITText>,
    },
    {
      type: "number",
      key: "total",
      label: t("devices.colTotal"),
      width: 110,
      sortable: false,
      render: (d: Device) => <ITText className="text-[11px] font-black text-slate-800">{d.stock?.total ?? 0}</ITText>,
    },
    {
      type: "string",
      key: "action",
      label: "",
      width: 140,
      render: (d: Device) => (
        <ITFlex gap={1} justify="center">
         <ITButton variant="outlined" color="primary" size="lg" onClick={() => navigate(`/inventory/devices/${d.id}`)}>
          <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
        </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      noPadding
      title={t("devices.title")}
      description={t("devices.description")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("devices.title") }]}
      backAction={() => navigate("/inventory")}
      actions={
        <ITFlex align="center" gap={2} wrap="wrap">
          {/* Carga masiva: solo para quien puede dar de alta dispositivos. */}
          {canCreate && (
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/inventory/devices/import")}
            >
              <ITFlex align="center" gap={1}>
                <FaFileExcel size={12} />
                <ITText className="font-bold text-[11px]">{t("devices.importExcel")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/devices/new")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("devices.new")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        layout="fixed"
        density="compact"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
        onRowClick={(row) => navigate(`/inventory/devices/${(row as unknown as Device).id}`)}
      />
    </ITPage>
  );
}