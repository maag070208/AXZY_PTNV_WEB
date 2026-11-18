import { useEffect, useMemo, useState } from "react";
import { ITDataTable, ITFlex, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, roomReviewApi, useHotelZoneOptions, type HotelRoomOption, type RoomReview } from "@entities/hotel-linen";
import { usePeopleOptions } from "@entities/user";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { ToneChip } from "@shared/ui/tone-chip";
import { fmtDateTime } from "../lib";
import ConsolidatedView from "./ConsolidatedView";
import DiffChip from "./DiffChip";

function ReviewsTable({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation("hotel-linen-room-review");
  const tt = dyn(t);
  const zones = useHotelZoneOptions();
  const people = usePeopleOptions();
  const [rooms, setRooms] = useState<HotelRoomOption[]>([]);

  useEffect(() => {
    let active = true;
    receptionApi
      .rooms()
      .then((list) => active && setRooms(list))
      .catch(() => active && setRooms([]));
    return () => {
      active = false;
    };
  }, []);

  const fetchData = useMemo(() => (params: ITDataTableFetchParamsPost) => roomReviewApi.table(params), []);

  const columns: Column<RoomReview>[] = [
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
      width: 170,
      filter: "date-range",
      render: (r) => <ITText className="text-[12px]">{fmtDateTime(r.reviewedAt)}</ITText>,
    },
    {
      key: "room",
      label: t("columns.room"),
      type: "catalog",
      width: 110,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: rooms.map((r) => ({ id: r.id, name: `${r.zone?.name ?? ""} ${r.number}`.trim() })) },
      render: (r) => <ITText className="text-[12px] font-semibold">{r.room.number}</ITText>,
    },
    {
      key: "zone",
      label: t("columns.zone"),
      type: "catalog",
      width: 150,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: zones.data.map((z) => ({ id: z.id, name: z.name })) },
      render: (r) => <ITText className="text-[12px]">{r.room.zone.name}</ITText>,
    },
    {
      key: "responsible",
      label: t("columns.responsible"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      sortable: false,
      catalogOptions: people,
      render: (r) => (
        <ITFlex align="center" gap={2}>
          <ProfileAvatar name={r.responsible.name} size="sm" />
          <ITText className="text-[11px] font-semibold">{r.responsible.name}</ITText>
        </ITFlex>
      ),
    },
    {
      key: "shift",
      label: t("columns.shift"),
      type: "string",
      width: 110,
      sortable: false,
      render: (r) => <ITText className="text-[12px]">{tt(`shift.${r.shift}`)}</ITText>,
    },
    {
      key: "withDifference",
      label: t("columns.difference"),
      type: "catalog",
      width: 170,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: [{ id: "true", name: t("filters.withDifference") }, { id: "false", name: t("filters.noDifference") }] },
      render: (r) =>
        r.totals.missing === 0 && r.totals.surplus === 0 ? (
          <ToneChip tone="success" label={t("noDifference")} />
        ) : (
          <ITFlex gap={1} wrap="wrap">
            {r.totals.missing > 0 && <DiffChip diff={-r.totals.missing} />}
            {r.totals.surplus > 0 && <DiffChip diff={r.totals.surplus} />}
          </ITFlex>
        ),
    },
  ];

  return (
    <ITDataTable
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: RoomReview) => onOpen(row.id)) as never}
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

/** Revisiones de habitación: historial (tabla server-side) y consolidado. */
export default function RoomReviewsBoard({ onOpen }: Props) {
  const { t } = useTranslation("hotel-linen-room-review");
  return (
    <PanelCard>
      <ITTabs
        variant="line"
        items={[
          { id: "reviews", label: t("tabs.reviews"), content: <ReviewsTable onOpen={onOpen} /> },
          { id: "consolidated", label: t("tabs.consolidated"), content: <ConsolidatedView /> },
        ]}
      />
    </PanelCard>
  );
}

