import {
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ColumnFilters,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { LuEye, LuTrash2, LuUndo2 } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import {
  STATUS_BADGE,
  PRIORITY_BADGE,
  STATUS_TONE,
  PRIORITY_TONE,
  WAIT_RATING_TONE,
  TicketChip,
  UNASSIGNED,
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
  /** Filtro rápido de la franja de resumen (cambiarlo remonta la tabla). */
  externalFilters: ColumnFilters;
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
  externalFilters,
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
            {t.deletedAt && <TicketChip label={tt("list.deleted")} />}
          </ITFlex>
          <ITText className="text-[12px] font-bold text-slate-400">
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
        <TicketChip tone={STATUS_TONE[t.status]} label={dyn(tt)(`statusLabels.${t.status}`)} />
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
        <TicketChip tone={PRIORITY_TONE[t.priority]} label={dyn(tt)(`priorityLabels.${t.priority}`)} />
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
            <TicketChip tone={WAIT_RATING_TONE[rating]} label={dyn(tt)(`list.waitLabels.${rating}`)} />
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
      render: (t) => <PersonCell name={t.createdBy?.name} />,
    },
    {
      key: "assignedToId",
      label: tt("list.columns.assignedTo"),
      width: 110,
      type: "catalog",
      filter: "search",
      sortable: false,
      catalogOptions: catalog([{ id: UNASSIGNED, name: tt("list.unassigned") }, ...filterOptions.assignees]),
      render: (t) => <PersonCell name={t.assignedTo?.name} fallback={tt("list.unassigned")} />,
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
            <LuEye size={14} />
          </ITButton>
          {canDelete && (
            <ITButton
              variant="outlined"
              size="lg"
              color="error"
              onClick={() => onMarkForDelete(t)}
              title={t.deletedAt ? tt("list.deleteForever") : tt("list.moveTrash")}
            >
              {t.deletedAt ? <LuUndo2 size={14} /> : <LuTrash2 size={14} />}
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITCard>
    <ITDataTable
      key={JSON.stringify(externalFilters)}
      externalFilters={externalFilters}
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      debounceMs={350}
      onRowClick={(row)=> onView(row as unknown as Ticket)}
      defaultItemsPerPage={25}
      itemsPerPageOptions={[25, 50, 100]}
      layout="fixed"
      density="compact"
      rowHeight={50}
      virtualized
      virtualizedMaxHeight={460}
    />
    </ITCard>
  );
}

/** Persona con su Blobatar; sin nombre, un texto tenue. */
function PersonCell({ name, fallback = "—" }: { name?: string; fallback?: string }) {
  if (!name) return <ITText className="text-[12px] text-slate-400">{fallback}</ITText>;
  return (
    <ITFlex align="center" gap={2} className="min-w-0">
      <ProfileAvatar name={name} size="xs" />
      <ITText className="truncate text-[12px] font-semibold text-slate-600">{name}</ITText>
    </ITFlex>
  );
}