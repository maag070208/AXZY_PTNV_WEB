import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITChip, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaFileExcel, FaPlus } from "react-icons/fa";
import { LuBox, LuCircleCheck, LuHandHelping, LuWrench } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type Device, type DeviceType } from "@entities/inventory";
import { useCan } from "@entities/user";
import { useGoBack } from "@shared/lib/useGoBack";
import { LangostinState } from "@shared/ui/langostin";
import { ListSummaryStrip, type ListSummaryItem } from "@shared/ui/list-summary-strip";

type Filter = "all" | "available" | "loaned" | "maintenance";

/** ¿El modelo tiene piezas en el estado del mosaico elegido? */
const FILTER_MATCH: Record<Filter, (d: Device) => boolean> = {
  all: () => true,
  available: (d) => (d.stock?.AVAILABLE ?? 0) > 0,
  loaned: (d) => (d.stock?.ON_LOAN ?? 0) > 0,
  maintenance: (d) => (d.stock?.IN_MAINTENANCE ?? 0) > 0,
};

/** Número de una columna de existencias: chip pastel si hay piezas, guion tenue si no. */
function StockChip({ value, color }: { value: number; color: "success" | "warning" | "danger" }) {
  if (value <= 0) return <ITText className="text-[12px] text-slate-400">0</ITText>;
  return (
    <ITChip size="sm" color={color}>
      {value}
    </ITChip>
  );
}

export default function DevicesPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const canCreate = useCan("devices.create");

  const load = useCallback(() => {
    setFailed(false);
    setDevices(null);
    inventoryApi
      .devices({ stock: true })
      .then(setDevices)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    inventoryApi.types().then(setTypes);
    load();
  }, [load]);

  // Totales reales del listado (suma de las existencias de cada modelo).
  const summary = useMemo<ListSummaryItem[]>(() => {
    const rows = devices ?? [];
    const sum = (pick: (d: Device) => number) => rows.reduce((acc, d) => acc + pick(d), 0);
    const models = (f: Filter) => rows.filter(FILTER_MATCH[f]).length;
    return [
      {
        id: "all",
        label: t("devices.summaryTotal"),
        value: sum((d) => d.stock?.total ?? 0),
        tone: "sea",
        icon: <LuBox size={15} />,
        caption: t("devices.summaryModels", { count: rows.length }),
      },
      {
        id: "available",
        label: t("devices.summaryAvailable"),
        value: sum((d) => d.stock?.AVAILABLE ?? 0),
        tone: "mint",
        icon: <LuCircleCheck size={15} />,
        caption: t("devices.summaryModels", { count: models("available") }),
      },
      {
        id: "loaned",
        label: t("devices.summaryLoaned"),
        value: sum((d) => d.stock?.ON_LOAN ?? 0),
        tone: "sun",
        icon: <LuHandHelping size={15} />,
        caption: t("devices.summaryModels", { count: models("loaned") }),
      },
      {
        id: "maintenance",
        label: t("devices.summaryMaintenance"),
        value: sum((d) => d.stock?.IN_MAINTENANCE ?? 0),
        tone: "lavender",
        icon: <LuWrench size={15} />,
        caption: t("devices.summaryModels", { count: models("maintenance") }),
      },
    ];
  }, [devices, t]);

  // El mosaico elegido filtra las filas; `reloadTrigger` obliga a la tabla a volver a pedirlas.
  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Device>(async () => (devices ?? []).filter(FILTER_MATCH[filter]), {
        name: { value: (d) => [d.name, d.brand, d.model] },
        typeId: { match: "equals", sortValue: (d) => d.type?.name },
        available: { value: (d) => d.stock?.AVAILABLE ?? 0 },
        loaned: { value: (d) => d.stock?.ON_LOAN ?? 0 },
        retirement: { value: (d) => d.stock?.RETIRED ?? 0 },
        total: { value: (d) => d.stock?.total ?? 0 },
      }),
    [devices, filter]
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
          <ITText className="text-[12px] font-bold text-slate-800">{d.name}</ITText>
          <ITText className="text-[11px] text-slate-400">{d.brand} {d.model}</ITText>
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
      render: (d: Device) => <ITChip size="sm" color="gray">{d.type?.name ?? ""}</ITChip>,
    },
    {
      type: "number",
      key: "available",
      label: t("devices.colAvail"),
      width: 110,
      sortable: false,
      render: (d: Device) => <StockChip value={d.stock?.AVAILABLE ?? 0} color="success" />,
    },
    {
      type: "number",
      key: "loaned",
      label: t("devices.colLoaned"),
      width: 110,
      sortable: false,
      render: (d: Device) => <StockChip value={d.stock?.ON_LOAN ?? 0} color="warning" />,
    },
    {
      type: "number",
      key: "retirement",
      label: t("devices.colRetirement"),
      width: 110,
      sortable: false,
      render: (d: Device) => <StockChip value={d.stock?.RETIRED ?? 0} color="danger" />,
    },
    {
      type: "number",
      key: "total",
      label: t("devices.colTotal"),
      width: 110,
      sortable: false,
      render: (d: Device) => <ITText className="text-[13px] font-black text-slate-800">{d.stock?.total ?? 0}</ITText>,
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

  const newButton = (
    <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/devices/new")}>
      <ITFlex align="center" gap={1}>
        <FaPlus size={12} />
        <ITText className="font-bold text-[11px]">{t("devices.new")}</ITText>
      </ITFlex>
    </ITButton>
  );

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("devices.title")}
      description={t("devices.description")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("devices.title") }]}
      backAction={() => goBack("/inventory")}
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
          {newButton}
        </ITFlex>
      }
    >
      {failed ? (
        <LangostinState
          kind="error"
          description={t("common:errors.load")}
          action={
            <ITButton variant="outlined" color="primary" onClick={load}>
              <ITText className="font-bold text-[11px]">{t("ui.retry")}</ITText>
            </ITButton>
          }
        />
      ) : devices === null ? (
        <LangostinState kind="loading" />
      ) : devices.length === 0 ? (
        <LangostinState kind="empty" title={t("devices.empty")} description={t("devices.emptyHint")} action={newButton} />
      ) : (
        <>
          <ListSummaryStrip items={summary} activeId={filter} onSelect={(id) => setFilter(id as Filter)} />
          <ITDataTable
            columns={columns as any}
            fetchData={fetchData as any}
            reloadTrigger={filter}
            onRowClick={(row) => navigate(`/inventory/devices/${(row as unknown as Device).id}`)}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50, 100]}
            layout="fixed"
            density="compact"
            rowHeight={50}
            virtualized
            virtualizedMaxHeight={460}
          />
        </>
      )}
    </ITPage>
  );
}
