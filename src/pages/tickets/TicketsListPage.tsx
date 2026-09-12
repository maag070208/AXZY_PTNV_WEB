import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaTicketAlt, FaTrello } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import {
  TicketsTable,
  useTicketsList,
} from "@features/ticket/tickets-list";

export default function TicketsListPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isEmpleado = currentUser?.role === "EMPLEADO";
  const isAdmin = currentUser?.role === "ADMIN";

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
          {!isEmpleado && (
            <ITButton
              variant="filled"
              color="primary"
              onClick={() => navigate("/tickets/nuevo")}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">{tt("list.new")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <TicketsTable
        isAdmin={isAdmin}
        fetchData={list.fetchTableData}
        reloadKey={list.reloadKey}
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
            ? `¿Eliminar definitivamente "${list.ticketToDelete?.titulo}"? Se borrarán sus comentarios e historial. Esta acción no se puede deshacer.`
            : `¿Mover a papelera "${list.ticketToDelete?.titulo}"? Quedará oculto en estado eliminado y podrás borrarlo definitivamente después.`
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