import { useEffect, useMemo, useState } from "react";
import { ITDataTable, ITFlex, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  HOTEL_TRANSFER_STATUSES,
  hotelLinenApi,
  type HotelTransferRow,
  type HotelWarehouse,
} from "@entities/hotel-linen";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import TransferStatusChip from "./TransferStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

interface TableProps {
  inbox: boolean;
  warehouses: HotelWarehouse[];
  onOpen: (id: string) => void;
}

function TransfersTable({ inbox, warehouses, onOpen }: TableProps) {
  const { t } = useTranslation("hotel-linen");
  const tt = dyn(t);

  const fetchData = useMemo(
    () => (params: ITDataTableFetchParamsPost) =>
      hotelLinenApi.transfersTable(inbox ? { ...params, filters: { ...params.filters, inbox: true } } : params),
    [inbox]
  );

  const warehouseOptions = warehouses.map((w) => ({ id: w.id, name: w.name }));

  const columns: Column<HotelTransferRow>[] = [
    {
      key: "folio",
      label: t("transfers.columns.folio"),
      type: "string",
      width: 130,
      filter: !inbox,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "date",
      label: t("transfers.columns.date"),
      type: "date",
      width: 130,
      filter: inbox ? false : "date-range",
      render: (r) => <ITText className="text-[12px]">{new Date(r.date).toLocaleDateString("es-MX")}</ITText>,
    },
    {
      key: "status",
      label: t("transfers.columns.status"),
      type: "catalog",
      width: 190,
      filter: inbox ? false : "catalog",
      catalogOptions: { data: HOTEL_TRANSFER_STATUSES.map((s) => ({ id: s, name: tt(`transfers.status.${s}`) })) },
      render: (r) => <TransferStatusChip status={r.status} />,
    },
    {
      key: "from",
      label: t("transfers.columns.from"),
      type: "catalog",
      width: 180,
      filter: inbox ? false : "catalog",
      sortable: false,
      catalogOptions: { data: warehouseOptions },
      render: (r) => <ITText className="text-[12px]">{r.from?.name ?? "—"}</ITText>,
    },
    {
      key: "to",
      label: t("transfers.columns.to"),
      type: "catalog",
      width: 180,
      filter: inbox ? false : "catalog",
      sortable: false,
      catalogOptions: { data: warehouseOptions },
      render: (r) => <ITText className="text-[12px]">{r.to?.name ?? "—"}</ITText>,
    },
    {
      key: "sentBy",
      label: t("transfers.columns.sentBy"),
      type: "string",
      width: 190,
      sortable: false,
      render: (r) =>
        r.sentBy ? (
          <ITFlex align="center" gap={2}>
            <ProfileAvatar name={r.sentBy.name} size="sm" />
            <ITText className="text-[11px] font-semibold">{r.sentBy.name}</ITText>
          </ITFlex>
        ) : (
          <ITText className="text-[11px]">—</ITText>
        ),
    },
    {
      key: "receivedBy",
      label: t("transfers.columns.receivedBy"),
      type: "string",
      width: 190,
      sortable: false,
      render: (r) =>
        r.receivedBy ? (
          <ITFlex align="center" gap={2}>
            <ProfileAvatar name={r.receivedBy.name} size="sm" />
            <ITText className="text-[11px] font-semibold">{r.receivedBy.name}</ITText>
          </ITFlex>
        ) : (
          <ITText className="text-[11px]">—</ITText>
        ),
    },
    {
      key: "sentQuantity",
      label: t("transfers.columns.sent"),
      type: "number",
      width: 100,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.sentQuantity)}</ITText>,
    },
    {
      key: "receivedQuantity",
      label: t("transfers.columns.received"),
      type: "number",
      width: 100,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] tabular-nums">{r.receivedQuantity === null ? "—" : fmt(r.receivedQuantity)}</ITText>
      ),
    },
    {
      key: "difference",
      label: t("transfers.columns.difference"),
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
      key={inbox ? "inbox" : "all"}
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: HotelTransferRow) => onOpen(row.id)) as never}
      size="lg"
      defaultItemsPerPage={25}
      itemsPerPageOptions={[25, 50, 100]}
      layout="fixed"
      density="compact"
      rowHeight={56}
    />
  );
}

interface Props {
  onOpen: (id: string) => void;
}

/** Traspasos: bandeja "Por recibir" y tabla completa con filtros. */
export default function TransfersBoard({ onOpen }: Props) {
  const { t } = useTranslation("hotel-linen");
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
    <PanelCard title={t("transfers.title")} description={t("transfers.description")}>
      <ITTabs
        variant="line"
        items={[
          {
            id: "inbox",
            label: t("transfers.tabs.inbox"),
            content: <TransfersTable inbox warehouses={warehouses} onOpen={onOpen} />,
          },
          {
            id: "all",
            label: t("transfers.tabs.all"),
            content: <TransfersTable inbox={false} warehouses={warehouses} onOpen={onOpen} />,
          },
        ]}
      />
    </PanelCard>
  );
}
