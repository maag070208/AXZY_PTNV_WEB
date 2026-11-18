import { useEffect, useMemo, useState } from "react";
import { ITDataTable, ITFlex, ITSelect, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  HOTEL_TRANSFER_STATUSES,
  amenityDeliveryApi,
  hotelLinenApi,
  type AmenityDeliveryRow,
  type HotelWarehouse,
} from "@entities/hotel-linen";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import AmenityDeliveryStatusChip from "./AmenityDeliveryStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

const personCell = (p: { name: string } | null) =>
  p ? (
    <ITFlex align="center" gap={2}>
      <ProfileAvatar name={p.name} size="sm" />
      <ITText className="text-[11px] font-semibold">{p.name}</ITText>
    </ITFlex>
  ) : (
    <ITText className="text-[11px]">—</ITText>
  );

function DeliveriesTable({ warehouses, onOpen }: { warehouses: HotelWarehouse[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation("hotel-linen-amenity-delivery");
  const tt = dyn(t);
  const fetchData = useMemo(() => (params: ITDataTableFetchParamsPost) => amenityDeliveryApi.table(params), []);
  const areaOptions = warehouses.filter((w) => w.kind === "ZONE").map((w) => ({ id: w.id, name: w.name }));

  const columns: Column<AmenityDeliveryRow>[] = [
    {
      key: "folio",
      label: t("columns.folio"),
      type: "string",
      width: 120,
      filter: true,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "date",
      label: t("columns.date"),
      type: "date",
      width: 130,
      filter: "date-range",
      render: (r) => <ITText className="text-[12px]">{new Date(r.date).toLocaleDateString("es-MX")}</ITText>,
    },
    {
      key: "status",
      label: t("columns.status"),
      type: "catalog",
      width: 190,
      filter: "catalog",
      catalogOptions: { data: HOTEL_TRANSFER_STATUSES.map((s) => ({ id: s, name: tt(`status.${s}`) })) },
      render: (r) => <AmenityDeliveryStatusChip status={r.status} />,
    },
    {
      key: "to",
      label: t("columns.to"),
      type: "catalog",
      width: 180,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: areaOptions },
      render: (r) => <ITText className="text-[12px] font-semibold">{r.to?.name ?? "—"}</ITText>,
    },
    { key: "recipient", label: t("columns.recipient"), type: "string", width: 190, sortable: false, render: (r) => personCell(r.recipient) },
    {
      key: "sentQuantity",
      label: t("columns.sent"),
      type: "number",
      width: 100,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.sentQuantity)}</ITText>,
    },
    {
      key: "receivedQuantity",
      label: t("columns.received"),
      type: "number",
      width: 100,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{r.receivedQuantity === null ? "—" : fmt(r.receivedQuantity)}</ITText>,
    },
    {
      key: "difference",
      label: t("columns.difference"),
      type: "number",
      width: 100,
      sortable: false,
      render: (r) => (
        <ITText className={`text-[12px] tabular-nums ${r.difference ? "font-bold text-[var(--color-warning)]" : ""}`}>
          {r.difference === null ? "—" : fmt(r.difference)}
        </ITText>
      ),
    },
  ];

  return (
    <ITDataTable
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: AmenityDeliveryRow) => onOpen(row.id)) as never}
      size="lg"
      defaultItemsPerPage={25}
      itemsPerPageOptions={[25, 50, 100]}
      layout="fixed"
      density="compact"
      rowHeight={56}
    />
  );
}

/** Historial de una ropería: últimas entregas con su destinataria. */
function AreaHistory({ warehouses, onOpen }: { warehouses: HotelWarehouse[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation("hotel-linen-amenity-delivery");
  const [areaId, setAreaId] = useState("");
  const [rows, setRows] = useState<AmenityDeliveryRow[]>([]);

  useEffect(() => {
    if (!areaId) {
      setRows([]);
      return;
    }
    let active = true;
    amenityDeliveryApi
      .history(areaId)
      .then((list) => active && setRows(list))
      .catch(() => active && setRows([]));
    return () => {
      active = false;
    };
  }, [areaId]);

  return (
    <ITFlex direction="column" gap={3}>
      <ITSelect
        name="historyArea"
        label={t("columns.to")}
        options={warehouses.filter((w) => w.kind === "ZONE").map((w) => ({ value: w.id, label: w.name }))}
        value={areaId}
        onChange={(e) => setAreaId(e.target.value)}
      />
      {!areaId ? (
        <ITText muted>{t("history.pickArea")}</ITText>
      ) : rows.length === 0 ? (
        <ITText muted>{t("history.empty")}</ITText>
      ) : (
        rows.map((r) => (
          <ITFlex key={r.id} align="center" gap={3} className="cursor-pointer" onClick={() => onOpen(r.id)}>
            <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>
            <ITText className="text-[12px]">{new Date(r.date).toLocaleDateString("es-MX")}</ITText>
            <AmenityDeliveryStatusChip status={r.status} />
            <ITText className="text-[12px]">{r.recipient?.name ?? "—"}</ITText>
            <ITText className="text-[12px] tabular-nums">{fmt(r.sentQuantity)}</ITText>
          </ITFlex>
        ))
      )}
    </ITFlex>
  );
}

interface Props {
  onOpen: (id: string) => void;
}

/** Entregas de amenidades: tabla server-side e historial por ropería. */
export default function AmenityDeliveriesBoard({ onOpen }: Props) {
  const { t } = useTranslation("hotel-linen-amenity-delivery");
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);

  useEffect(() => {
    let active = true;
    hotelLinenApi
      .warehouses()
      .then((list) => active && setWarehouses(list))
      .catch(() => active && setWarehouses([]));
    return () => {
      active = false;
    };
  }, []);

  return (
    <PanelCard title={t("title")} description={t("description")}>
      <ITTabs
        variant="line"
        items={[
          { id: "deliveries", label: t("tabs.deliveries"), content: <DeliveriesTable warehouses={warehouses} onOpen={onOpen} /> },
          { id: "history", label: t("tabs.history"), content: <AreaHistory warehouses={warehouses} onOpen={onOpen} /> },
        ]}
      />
    </PanelCard>
  );
}
