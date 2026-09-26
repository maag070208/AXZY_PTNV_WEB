import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaTicketAlt, FaTrello } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  TicketsTable,
  useTicketsList,
} from "@features/ticket/tickets-list";

export default function TicketsListPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canDelete = useCan("tickets.delete");

  const list = useTicketsList();

  return (
    <ITPage
      title={tt("list.title")}
      description={tt("list.description")}
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
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
              <FaTrello size={12} />
              <ITText className="font-bold text-[11px]">{tt("list.board")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
              variant="filled"
              color="primary"
              onClick={() => navigate("/tickets/new")}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">{tt("list.new")}</ITText>
              </ITFlex>
            </ITButton>
        </ITFlex>
      }
    >
      <TicketsTable
        canDelete={canDelete}
        fetchData={list.fetchTableData}
        reloadKey={list.reloadKey}
        categoryOptions={list.categoryOptions}
        userOptions={list.userOptions}
        onView={(t) => navigate(`/tickets/${t.id}`)}
        onMarkForDelete={list.setTicketToDelete}
      />

      {list.deleteError && (
        <ITAlert variant="error" dismissible onDismiss={() => list.setDeleteError(null)}>
          {list.deleteError}
        </ITAlert>
      )}

      <ITConfirmDialog
        isOpen={!!list.ticketToDelete}
        onClose={() => list.setTicketToDelete(null)}
        onConfirm={list.confirmDeleteTicket}
        title={
          list.ticketToDelete?.deletedAt
            ? tt("list.deleteForever")
            : tt("list.moveTrash")
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