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
import { formatDate } from "@shared/utils/dates";
import {
  STATUS_BADGE,
  PRIORITY_BADGE,
  UNASSIGNED,
  WAIT_RATING_COLOR,
  daysOnHold,
  waitRating,
  type Ticket,
  type TicketFilterOptions,
} from "@entities/ticket";

interface Props {
  canDelete: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  /** Opciones de Categoría, Creador y Responsable (de los tickets visibles). */
  filterOptions: TicketFilterOptions;
  filterOptionsLoading: boolean;
  filterOptionsError: boolean;
  onView: (t: Ticket) => void;
  onMarkForDelete: (t: Ticket) => void;
}

export default function TicketsTable({
  canDelete,
  fetchData,
  reloadKey,
  filterOptions,
  filterOptionsLoading,
  filterOptionsError,
  onView,
  onMarkForDelete,
}: Props) {
  const { t: tt } = useTranslation("tickets");
  const catalog = (data: Array<{ id: string; name: string }>) => ({
    data,
    loading: filterOptionsLoading,
    error: filterOptionsError,
  });

  const columns: Column<Ticket>[] = [
    {
      key: "title",
      label: tt("list.columns.title"),
      type: "string",
      width: 200,
      filter: true,
      sortable: false,
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
      key: "categoryId",
      label: tt("list.columns.category"),
      type: "catalog",
      width: 120,
      filter: "search",
      sortable: false,
      catalogOptions: catalog(filterOptions.categories),
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.category?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "status",
      label: tt("list.columns.status"),
      type: "catalog",
      width: 100,
      filter: "catalog",
      sortable: false,
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
      width: 100,
      filter: "catalog",
      sortable: false,
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
      key: "createdAt",
      label: tt("list.columns.createdAt"),
      type: "date",
      width: 140,
      filter: "date-range",
      sortable: false,
      dateFilterOptions: { maxDate: new Date() },
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">{formatDate(t.createdAt)}</ITText>
      ),
    },
    {
      key: "wait",
      label: tt("list.columns.wait"),
      type: "number",
      width: 100,
      render: (t) => {
        const days = daysOnHold(t.createdAt, t.closedAt);
        const rating = waitRating(days);
        return (
          <ITFlex direction="column" align="center" gap={1}>
            <ITText className="text-[11px] font-bold text-slate-700">{days} d</ITText>
            <ITBadget size="lg" color={WAIT_RATING_COLOR[rating] as any}>
              {dyn(tt)(`list.waitLabels.${rating}`)}
            </ITBadget>
          </ITFlex>
        );
      },
    },
    {
      key: "createdById",
      label: tt("list.columns.createdBy"),
      width: 110,
      type: "catalog",
      filter: "search",
      sortable: false,
      catalogOptions: catalog(filterOptions.creators),
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.createdBy?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "assignedToId",
      label: tt("list.columns.assignedTo"),
      width: 110,
      type: "catalog",
      filter: "search",
      sortable: false,
      catalogOptions: catalog([{ id: UNASSIGNED, name: tt("list.unassigned") }, ...filterOptions.assignees]),
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
      width: 110,
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
      layout="fixed"
      density="compact"
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      debounceMs={350}
      variant="bordered"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
      onRowClick={(row)=> onView(row as unknown as Ticket)}
    />
  );
}