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
  type Ticket,
} from "@entities/ticket";

interface Props {
  isAdmin: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (t: Ticket) => void;
  onMarkForDelete: (t: Ticket) => void;
}

export default function TicketsTable({
  isAdmin,
  fetchData,
  reloadKey,
  onView,
  onMarkForDelete,
}: Props) {
  const { t: tt } = useTranslation("tickets");

  const columns: Column<Ticket>[] = [
    {
      key: "titulo",
      label: tt("list.columns.title"),
      type: "string",
      filter: true,
      render: (t) => (
        <ITFlex direction="column" gap={0.5}>
          <ITFlex align="center" gap={1}>
            <ITText className="text-[12px] font-black text-slate-800">{t.titulo}</ITText>
            {t.deletedAt && (
              <ITBadget color="gray" size="sm">{tt("list.deleted")}</ITBadget>
            )}
          </ITFlex>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase">
            {dyn(tt)(`categoryLabels.${t.category}`)}
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
        <ITBadget color={(STATUS_BADGE[t.status]?.color as any) ?? "default"} size="sm">
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
        <ITBadget color={(PRIORITY_BADGE[t.priority]?.color as any) ?? "default"} size="sm">
          {dyn(tt)(`priorityLabels.${t.priority}`)}
        </ITBadget>
      ),
    },
    {
      key: "creadoPor",
      label: tt("list.columns.createdBy"),
      type: "string",
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.creadoPor?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "asignadoA",
      label: tt("list.columns.assignedTo"),
      type: "string",
      render: (t) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {t.asignadoA?.name ?? tt("list.unassigned")}
        </ITText>
      ),
    },
    {
      key: "acciones",
      label: "",
      type: "string",
      render: (t) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="sm"
            color="secondary"
            onClick={() => onView(t)}
          >
            <FaEye size={12} />
          </ITButton>
          {isAdmin && (
            <ITButton
              variant="outlined"
              size="sm"
              color="danger"
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
      size="sm"
    />
  );
}