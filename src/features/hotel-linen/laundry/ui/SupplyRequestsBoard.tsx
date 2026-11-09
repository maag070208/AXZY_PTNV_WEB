import { useEffect, useMemo, useState } from "react";
import { ITDataTable, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  SUPPLY_REQUEST_STATUSES,
  hotelLinenApi,
  laundryApi,
  type HotelWarehouse,
  type SupplyRequestRow,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { AREA_KINDS, fmt, fmtDate } from "../lib";
import FulfillDialog from "./FulfillDialog";
import SupplyStatusChip from "./SupplyStatusChip";

interface TableProps {
  toSupply: boolean;
  areas: HotelWarehouse[];
  onRow: (id: string) => void;
}

function RequestsTable({ toSupply, areas, onRow }: TableProps) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);

  // "Por surtir" junta los dos estados abiertos (la API filtra por un solo estado).
  const fetchData = useMemo(
    () => async (params: ITDataTableFetchParamsPost) => {
      if (!toSupply) return laundryApi.requestsTable(params);
      const base = { ...params, page: 1, limit: 100 };
      const [a, b] = await Promise.all(
        (["SUBMITTED", "PARTIALLY_FULFILLED"] as const).map((status) =>
          laundryApi.requestsTable({ ...base, filters: { ...params.filters, status } })
        )
      );
      const data = [...a.data, ...b.data].sort((x, y) => x.date.localeCompare(y.date));
      return { data, total: data.length };
    },
    [toSupply]
  );

  const columns: Column<SupplyRequestRow>[] = [
    {
      key: "folio",
      label: t("requests.columns.folio"),
      type: "string",
      width: 120,
      filter: !toSupply,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "area",
      label: t("requests.columns.area"),
      type: "catalog",
      width: 200,
      filter: !toSupply ? "catalog" : false,
      sortable: false,
      catalogOptions: { data: areas.map((w) => ({ id: w.id, name: w.name })) },
      render: (r) => <ITText className="text-[12px]">{r.area.name}</ITText>,
    },
    {
      key: "date",
      label: t("requests.columns.date"),
      type: "date",
      width: 120,
      filter: !toSupply ? "date-range" : false,
      render: (r) => <ITText className="text-[12px]">{fmtDate(r.date)}</ITText>,
    },
    {
      key: "shift",
      label: t("requests.columns.shift"),
      type: "string",
      width: 120,
      sortable: false,
      render: (r) => <ITText className="text-[12px]">{r.shift ? tt(`shift.${r.shift}`) : "—"}</ITText>,
    },
    {
      key: "status",
      label: t("requests.columns.status"),
      type: "catalog",
      width: 190,
      filter: !toSupply ? "catalog" : false,
      catalogOptions: { data: SUPPLY_REQUEST_STATUSES.map((s) => ({ id: s, name: tt(`requests.status.${s}`) })) },
      render: (r) => <SupplyStatusChip status={r.status} />,
    },
    {
      key: "requestedQty",
      label: t("requests.columns.requested"),
      type: "number",
      width: 110,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.requestedQty)}</ITText>,
    },
    {
      key: "pendingQty",
      label: t("requests.columns.pending"),
      type: "number",
      width: 110,
      sortable: false,
      render: (r) => (
        <ITText className={`text-[12px] tabular-nums ${r.pendingQty > 0 ? "font-bold text-[var(--color-warning)]" : ""}`}>
          {fmt(r.pendingQty)}
        </ITText>
      ),
    },
  ];

  return (
    <ITDataTable
      key={toSupply ? "supply" : "all"}
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: SupplyRequestRow) => onRow(row.id)) as never}
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
  requestCosign: (title: string) => Promise<string | null>;
}

/** Pedidos de área: bandeja "Por surtir" (lavandería) y tabla completa con filtros. */
export default function SupplyRequestsBoard({ onOpen, requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const canFulfill = useCan("hotel_linen.fulfill");
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);
  const [fulfillId, setFulfillId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    hotelLinenApi
      .warehouses()
      .then((list) => active && setAreas(list.filter((w) => AREA_KINDS.includes(w.kind))))
      .catch(() => active && setAreas([]));
    return () => {
      active = false;
    };
  }, []);

  const all = <RequestsTable key={`all-${reload}`} toSupply={false} areas={areas} onRow={onOpen} />;
  const items = [
    ...(canFulfill
      ? [
          {
            id: "supply",
            label: t("requests.tabs.toSupply"),
            content: <RequestsTable key={`supply-${reload}`} toSupply areas={areas} onRow={setFulfillId} />,
          },
        ]
      : []),
    { id: "all", label: t("requests.tabs.all"), content: all },
  ];

  return (
    <PanelCard title={t("requests.title")} description={t("requests.description")}>
      <ITTabs variant="line" items={items} />
      <FulfillDialog
        requestId={fulfillId}
        requestCosign={requestCosign}
        onClose={() => setFulfillId(null)}
        onDone={() => {
          setFulfillId(null);
          setReload((n) => n + 1);
        }}
      />
    </PanelCard>
  );
}
