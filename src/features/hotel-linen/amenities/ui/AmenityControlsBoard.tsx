import { useEffect, useState } from "react";
import { ITDataTable, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { AMENITY_CONTROL_STATUSES, amenityApi, hotelLinenApi, type AmenityControlRow, type HotelWarehouse } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import AmenityStatusChip from "./AmenityStatusChip";
import { fmtDay } from "../lib";

/** Lista de controles semanales de amenidades (server-side). */
export default function AmenityControlsBoard({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation("hotel-linen-amenity");
  const tt = dyn(t);
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);

  useEffect(() => {
    let active = true;
    hotelLinenApi
      .warehouses()
      .then((list) => active && setAreas(list.filter((w) => w.kind === "ZONE")))
      .catch(() => active && setAreas([]));
    return () => {
      active = false;
    };
  }, []);

  const columns: Column<AmenityControlRow>[] = [
    {
      key: "folio",
      label: t("columns.folio"),
      type: "string",
      width: 120,
      filter: true,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "area",
      label: t("columns.area"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: areas.map((w) => ({ id: w.id, name: w.name })) },
      render: (r) => <ITText className="text-[12px]">{r.area.name}</ITText>,
    },
    {
      key: "week",
      label: t("columns.week"),
      type: "date",
      width: 200,
      filter: "date-range",
      render: (r) => <ITText className="text-[12px]">{`${fmtDay(r.weekFrom)} – ${fmtDay(r.weekTo)}`}</ITText>,
    },
    {
      key: "occupiedNights",
      label: t("columns.occupied"),
      type: "number",
      width: 120,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{r.occupiedNights}</ITText>,
    },
    {
      key: "flaggedLines",
      label: t("columns.flagged"),
      type: "number",
      width: 130,
      sortable: false,
      render: (r) => (
        <ITText className={`text-[12px] tabular-nums ${r.flaggedLines > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>
          {r.flaggedLines}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("columns.status"),
      type: "catalog",
      width: 190,
      filter: "catalog",
      catalogOptions: { data: AMENITY_CONTROL_STATUSES.map((s) => ({ id: s, name: tt(`status.${s}`) })) },
      render: (r) => <AmenityStatusChip status={r.status} />,
    },
  ];

  return (
    <PanelCard title={t("board.title")} description={t("board.description")}>
      <ITDataTable
        showViewToggle={false}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={amenityApi.table as never}
        onRowClick={((row: AmenityControlRow) => onOpen(row.id)) as never}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={56}
      />
    </PanelCard>
  );
}
