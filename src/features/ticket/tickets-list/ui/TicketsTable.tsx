import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEye, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import {
  STATUS_BADGE,
  PRIORITY_BADGE,
  WAIT_RATING_COLOR,
  daysOnHold,
  waitRating,
  type Ticket,
} from "@entities/ticket";

interface Props {
  canDelete: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (t: Ticket) => void;
  onMarkForDelete: (t: Ticket) => void;
}

export default function TicketsTable({
  canDelete,
  fetchData,
  reloadKey,
  onView,
  onMarkForDelete,
}: Props) {
  const { t: tt } = useTranslation("tickets");

  const columns: Column<Ticket>[] = [
    {
      key: "title",
      label: tt("list.columns.title"),
      type: "string",
      filter: true,
      render: (t) => (
        <ITFlex direction="column" gap={0.5}>
          <ITFlex align="center" gap={1}>
            <ITText className="text-[12px] font-black text-slate-800">{t.title}</ITText>
            {t.deletedAt && (
              <ITBadget color="gray" size="lg">{tt("list.deleted")}</ITBadget>
            )}
          </ITFlex>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase">
            {t.category?.name ?? "—"}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "status",
      label: tt("list.columns.status"),
      type: "catalog",
      filter: "catalog",
      catalogOptions: {
        data: Object.keys(STATUS_BADGE).map((id) => ({
          id,
          name: dyn(tt)(`statusLabels.${id}`),
        })),
        loading: false,
        error: false,
      },
      render: (t) => (
        <ITBadget size="lg" color={(STATUS_BADGE[t.status]?.color as any) ?? "default"}>
          {dyn(tt)(`statusLabels.${t.status}`)}
        </ITBadget>
      ),
    },
    {
      key: "priority",
      label: tt("list.columns.priority"),
      type: "catalog",
      filter: "catalog",
      catalogOptions: {
        data: Object.keys(PRIORITY_BADGE).map((id) => ({
          id,
          name: dyn(tt)(`priorityLabels.${id}`),
        })),
        loading: false,
        error: false,
      },
      render: (t) => (
        <ITBadget size="lg" color={(PRIORITY_BADGE[t.priority]?.color as any) ?? "default"}>
          {dyn(tt)(`priorityLabels.${t.priority}`)}
        </ITBadget>
      ),
    },
    {
      key: "espera",
      label: tt("list.columns.wait"),
      type: "number",
      render: (t) => {
        const days = daysOnHold(t.createdAt, t.closedAt);
        const rating = waitRating(days);
        return (
          <ITFlex align="center" gap={1}>
            <ITText className="text-[11px] font-bold text-slate-700">{days} d</ITText>
            <ITBadget size="lg" color={WAIT_RATING_COLOR[rating] as any}>
              {dyn(tt)(`list.waitLabels.${rating}`)}
            </ITBadget>
          </ITFlex>
        );
      },
    },
    {
      key: "createdBy",
      label: tt("list.columns.createdBy"),
      type: "string",
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.createdBy?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "assignedTo",
      label: tt("list.columns.assignedTo"),
      type: "string",
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.assignedTo?.name ?? tt("list.unassigned")}
        </ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string",
      render: (t) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="lg"
            color="secondary"
            onClick={() => onView(t)}
          >
            <FaEye size={12} />
          </ITButton>
          {canDelete && (
            <ITButton
              variant="outlined"
              size="lg"
              color="error"
              onClick={() => onMarkForDelete(t)}
              title={t.deletedAt ? tt("list.deleteForever") : tt("list.moveTrash")}
            >
              {t.deletedAt ? <FaTrashRestore size={12} /> : <FaTrash size={12} />}
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      defaultItemsPerPage={5}
      itemsPerPageOptions={[5, 10, 50]}
      debounceMs={350}
      variant="bordered"
      size="lg"
    />
  );
}