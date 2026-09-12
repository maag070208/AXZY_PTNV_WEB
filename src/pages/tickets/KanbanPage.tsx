import { ITButton, ITFlex, ITPage, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrello, FaUserPlus } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TicketDetailModal from "@widgets/tickets/ticket-detail-modal";
import {
  KanbanBoard,
  CreateTaskDialog,
  useKanban,
} from "@features/ticket/kanban";

export default function KanbanPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get("ticketId") ?? undefined;

  const fx = useKanban(ticketId);

  return (
    <ITPage
      title={ticketId ? tt("kanban.byTicket") : tt("kanban.board")}
      description={ticketId ? tt("kanban.descByTicket") : tt("kanban.descBoard")}
      backAction={() => navigate(-1)}
      icon={<FaTrello size={20} />}
      breadcrumbs={[
        { label: tt("list.title"), onClick: () => navigate("/tickets") },
        ...(ticketId
          ? [
              {
                label: tt("kanban.ticket"),
                onClick: () => navigate(`/tickets/${ticketId}`),
              },
              { label: tt("kanban.breadcrumb") },
            ]
          : [{ label: tt("kanban.breadcrumb") }]),
      ]}
      actions={
        ticketId ? (
          fx.canCreate ? (
            <ITButton
              variant="filled"
              color="primary"
              onClick={() => navigate(`/tickets/${ticketId}`)}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">{tt("kanban.newTask")}</ITText>
              </ITFlex>
            </ITButton>
          ) : undefined
        ) : !fx.isEmpleado ? (
          <ITFlex align="center" gap={2}>
            <ITButton
              variant="outlined"
              color="primary"
              onClick={() => fx.setShowCreatePanel(true)}
            >
              <ITFlex align="center" gap={1}>
                <FaUserPlus size={12} />
                <ITText className="font-bold text-[11px]">{tt("kanban.newTask")}</ITText>
              </ITFlex>
            </ITButton>
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
          </ITFlex>
        ) : undefined
      }
    >
      <KanbanBoard fx={fx} />

      <TicketDetailModal
        ticket={fx.modalTicket}
        loading={fx.modalLoading}
        canManage={fx.canManageModalTicket}
        currentUserId={fx.currentUser?.id}
        onClose={() => fx.setModalTicket(null)}
        onOpenFull={(id) => navigate(`/tickets/${id}`)}
      />

      <CreateTaskDialog fx={fx} />

      {fx.toast && (
        <ITToast
          message={fx.toast}
          type="success"
          position="bottom-center"
          duration={2000}
          onClose={() => fx.setToast(null)}
        />
      )}
    </ITPage>
  );
}