import { ITAlert, ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { LuCircleCheck, LuClock, LuInbox, LuKanban, LuPlus, LuTicket, LuUserX } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  TicketsTable,
  useTicketsList,
} from "@features/ticket/tickets-list";
import { useGoBack } from "@shared/lib/useGoBack";
import { ListSummaryStrip, type ListSummaryItem } from "@shared/ui/list-summary-strip";
import { LangostinConfirm } from "@shared/ui/langostin-confirm";

export default function TicketsListPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canDelete = useCan("tickets.delete");

  const list = useTicketsList();

  // Mismos totales y tonos que el Inicio; el clic filtra la tabla.
  const s = list.summary;
  const total = s ? s.open + s.followUp + s.closed : 0;
  const summaryItems: ListSummaryItem[] = s
    ? [
        { id: "open", label: tt("list.summary.open"), value: s.open, tone: "sun", icon: <LuInbox size={14} />, caption: tt("list.summary.ofTotal", { total }) },
        { id: "followUp", label: tt("list.summary.followUp"), value: s.followUp, tone: "sea", icon: <LuClock size={14} /> },
        { id: "unassigned", label: tt("list.summary.unassigned"), value: s.unassigned, tone: "lavender", icon: <LuUserX size={14} /> },
        { id: "closed", label: tt("list.summary.closed"), value: s.closed, tone: "mint", icon: <LuCircleCheck size={14} /> },
      ]
    : [];

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("list.title")}
      description={tt("list.description")}
      backAction={() => goBack("/")}
      icon={<LuTicket size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("list.title") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/tickets/kanban")}
          >
            <ITFlex align="center" gap={1}>
              <LuKanban size={14} />
              <ITText className="font-bold text-[11px]">{tt("list.board")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
              variant="filled"
              color="primary"
              onClick={() => navigate("/tickets/new")}
            >
              <ITFlex align="center" gap={1}>
                <LuPlus size={14} />
                <ITText className="font-bold text-[11px]">{tt("list.new")}</ITText>
              </ITFlex>
            </ITButton>
        </ITFlex>
      }
    >
      {summaryItems.length > 0 && (
        <div className="mb-4">
          <ListSummaryStrip
            items={summaryItems}
            activeId={list.quickFilter ?? undefined}
            onSelect={(id) => list.toggleQuickFilter(id as "open" | "followUp" | "unassigned" | "closed")}
          />
          {list.quickFilter && (
            <button
              type="button"
              onClick={list.clearQuickFilter}
              className="mt-2 cursor-pointer text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              {tt("list.summary.clear")}
            </button>
          )}
        </div>
      )}

      <TicketsTable
        canDelete={canDelete}
        fetchData={list.fetchTableData}
        reloadKey={list.reloadKey}
        externalFilters={list.externalFilters}
        filterOptions={list.filterOptions}
        filterOptionsLoading={list.filterOptionsLoading}
        filterOptionsError={list.filterOptionsError}
        onView={(t) => navigate(`/tickets/${t.id}`)}
        onMarkForDelete={list.setTicketToDelete}
      />

      {list.deleteError && (
        <ITAlert variant="error" dismissible onDismiss={() => list.setDeleteError(null)}>
          {list.deleteError}
        </ITAlert>
      )}

      <LangostinConfirm
        isOpen={!!list.ticketToDelete}
        onClose={() => list.setTicketToDelete(null)}
        onConfirm={list.confirmDeleteTicket}
        title={
          list.ticketToDelete?.deletedAt
            ? tt("list.confirmForeverTitle")
            : tt("list.confirmTrashTitle")
        }
        message={
          list.ticketToDelete?.deletedAt
            ? tt("list.confirmDeleteForever", { title: list.ticketToDelete?.title })
            : tt("list.confirmMoveTrash", { title: list.ticketToDelete?.title })
        }
        confirmLabel={
          list.ticketToDelete?.deletedAt
            ? tt("list.deleteForever")
            : tt("list.moveTrash")
        }
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}
