import { useMemo } from "react";
import { ITDataTable, ITFlex, ITTabs, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { SIGNOFF_STATUSES, signoffApi, type SignoffRow, type SignoffStatus } from "@entities/hotel-linen";
import type { ITDataTableFetchParamsPost } from "@shared/api/table";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import SignoffStatusChip from "./SignoffStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

interface TableProps {
  /** Estado fijo de la pestaña; sin él la tabla deja filtrar por estado. */
  fixed?: SignoffStatus;
  onOpen: (id: string) => void;
}

function SignoffTable({ fixed, onOpen }: TableProps) {
  const { t } = useTranslation("hotel-linen-signoff");
  const tt = dyn(t);
  const fetchData = useMemo(
    () => (params: ITDataTableFetchParamsPost) =>
      signoffApi.table(fixed ? { ...params, filters: { ...params.filters, status: fixed } } : params),
    [fixed]
  );

  const columns: Column<SignoffRow>[] = [
    {
      key: "folio",
      label: t("columns.folio"),
      type: "string",
      width: 130,
      filter: !fixed,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "receivedAt",
      label: t("columns.receivedAt"),
      type: "date",
      width: 170,
      filter: fixed ? false : "date-range",
      render: (r) => <ITText className="text-[12px]">{r.receivedAt ? fmtDateTime(r.receivedAt) : "—"}</ITText>,
    },
    {
      key: "status",
      label: t("columns.status"),
      type: "catalog",
      width: 170,
      filter: fixed ? false : "catalog",
      catalogOptions: { data: SIGNOFF_STATUSES.map((s) => ({ id: s, name: tt(`status.${s}`) })) },
      render: (r) => <SignoffStatusChip status={r.signoffStatus} />,
    },
    {
      key: "from",
      label: t("columns.from"),
      type: "string",
      width: 170,
      sortable: false,
      render: (r) => <ITText className="text-[12px]">{r.from?.name ?? "—"}</ITText>,
    },
    {
      key: "to",
      label: t("columns.to"),
      type: "string",
      width: 170,
      sortable: false,
      render: (r) => <ITText className="text-[12px] font-semibold">{r.to?.name ?? "—"}</ITText>,
    },
    {
      key: "receivedBy",
      label: t("columns.receivedBy"),
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
      render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.receivedQuantity)}</ITText>,
    },
    {
      key: "signoffBy",
      label: t("columns.signoffBy"),
      type: "string",
      width: 170,
      sortable: false,
      render: (r) => <ITText className="text-[11px]">{r.signoffBy?.name ?? "—"}</ITText>,
    },
  ];

  return (
    <ITDataTable
      key={fixed ?? "all"}
      showViewToggle={false}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={fetchData as never}
      onRowClick={((row: SignoffRow) => onOpen(row.id)) as never}
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

/** Bandeja "Por firmar": pendientes, incidencias (con diferencia) y todas. */
export default function SignoffBoard({ onOpen }: Props) {
  const { t } = useTranslation("hotel-linen-signoff");
  return (
    <PanelCard title={t("title")} description={t("description")}>
      <ITTabs
        variant="line"
        items={[
          { id: "pending", label: t("tabs.pending"), content: <SignoffTable fixed="PENDING" onOpen={onOpen} /> },
          { id: "differences", label: t("tabs.differences"), content: <SignoffTable fixed="DIFFERENCE" onOpen={onOpen} /> },
          { id: "all", label: t("tabs.all"), content: <SignoffTable onOpen={onOpen} /> },
        ]}
      />
    </PanelCard>
  );
}
