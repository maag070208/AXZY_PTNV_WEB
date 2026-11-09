import { useEffect, useMemo, useState } from "react";
import { ITDataTable, ITFlex, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  WRITEOFF_REASONS,
  WRITEOFF_STATUSES,
  hotelLinenApi,
  writeoffApi,
  type HotelWarehouse,
  type WriteoffRow,
  type WeeklyWriteoffReport,
  type WriteoffStage,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { fmt, fmtDate, money } from "../lib";
import WriteoffStatusChip from "./WriteoffStatusChip";
import WeeklyReportView from "./WeeklyReportView";

interface TableProps {
  stage?: WriteoffStage;
  warehouses: HotelWarehouse[];
  onOpen: (id: string) => void;
}

function WriteoffsTable({ stage, warehouses, onOpen }: TableProps) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const tt = dyn(t);
  const filtered = !stage;

  const fetchData = useMemo(
    () => (params: ITDataTableFetchParamsPost) =>
      writeoffApi.table(stage ? { ...params, filters: { ...params.filters, stage } } : params),
    [stage]
  );

  const columns: Column<WriteoffRow>[] = [
    {
      key: "folio",
      label: t("writeoffs.columns.folio"),
      type: "string",
      width: 130,
      filter: filtered,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "date",
      label: t("writeoffs.columns.date"),
      type: "date",
      width: 120,
      filter: filtered ? "date-range" : false,
      render: (r) => <ITText className="text-[12px]">{fmtDate(r.date)}</ITText>,
    },
    {
      key: "status",
      label: t("writeoffs.columns.status"),
      type: "catalog",
      width: 140,
      filter: filtered ? "catalog" : false,
      catalogOptions: { data: WRITEOFF_STATUSES.map((s) => ({ id: s, name: tt(`writeoffs.status.${s}`) })) },
      render: (r) => <WriteoffStatusChip status={r.status} />,
    },
    {
      key: "warehouseId",
      label: t("writeoffs.columns.warehouse"),
      type: "catalog",
      width: 170,
      filter: filtered ? "catalog" : false,
      sortable: false,
      catalogOptions: { data: warehouses.map((w) => ({ id: w.id, name: w.name })) },
      render: (r) => <ITText className="text-[12px]">{r.warehouse?.name ?? "—"}</ITText>,
    },
    {
      key: "reason",
      label: t("writeoffs.columns.reason"),
      type: "catalog",
      width: 150,
      filter: filtered ? "catalog" : false,
      sortable: false,
      catalogOptions: { data: WRITEOFF_REASONS.map((c) => ({ id: c, name: tt(`writeoffs.reason.${c}`) })) },
      render: (r) => <ITText className="text-[12px]">{r.reason?.name ?? "—"}</ITText>,
    },
    {
      key: "requestedBy",
      label: t("writeoffs.columns.requestedBy"),
      type: "string",
      width: 180,
      sortable: false,
      render: (r) => (
        <ITFlex align="center" gap={2}>
          <ProfileAvatar name={r.requestedBy.name} size="sm" />
          <ITText className="text-[11px] font-semibold">{r.requestedBy.name}</ITText>
        </ITFlex>
      ),
    },
    {
      key: "reviewed",
      label: t("writeoffs.columns.reviewed"),
      type: "string",
      width: 120,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px]">{r.reviewed ? t("writeoffs.reviewedYes") : t("writeoffs.reviewedNo")}</ITText>
      ),
    },
    {
      key: "quantity",
      label: t("writeoffs.columns.quantity"),
      type: "number",
      width: 90,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.quantity)}</ITText>,
    },
    {
      key: "cost",
      label: t("writeoffs.columns.cost"),
      type: "number",
      width: 110,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{money(r.cost)}</ITText>,
    },
    {
      key: "photos",
      label: t("writeoffs.columns.photos"),
      type: "number",
      width: 80,
      sortable: false,
      render: (r) => <ITText className="text-[12px] tabular-nums">{r.photos}</ITText>,
    },
  ];

  return (
    <ITDataTable
      key={stage ?? "all"}
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: WriteoffRow) => onOpen(row.id)) as never}
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
  onDownloadPdf: (report: WeeklyWriteoffReport) => void;
}

/** Bajas: solicitudes, bandejas de revisión y autorización, y reporte semanal. */
export default function WriteoffsBoard({ onOpen, onDownloadPdf }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const canReview = useCan("hotel_linen.writeoff_review");
  const canApprove = useCan("hotel_linen.writeoff_approve");
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

  const items = [
    { id: "requests", label: t("writeoffs.tabs.requests"), content: <WriteoffsTable warehouses={warehouses} onOpen={onOpen} /> },
    ...(canReview
      ? [{ id: "review", label: t("writeoffs.tabs.review"), content: <WriteoffsTable stage="review" warehouses={warehouses} onOpen={onOpen} /> }]
      : []),
    ...(canApprove
      ? [{ id: "authorize", label: t("writeoffs.tabs.authorize"), content: <WriteoffsTable stage="authorize" warehouses={warehouses} onOpen={onOpen} /> }]
      : []),
    { id: "weekly", label: t("writeoffs.tabs.weekly"), content: <WeeklyReportView onDownloadPdf={onDownloadPdf} /> },
  ];

  return (
    <PanelCard title={t("writeoffs.title")} description={t("writeoffs.description")}>
      <ITTabs variant="line" items={items} />
    </PanelCard>
  );
}
