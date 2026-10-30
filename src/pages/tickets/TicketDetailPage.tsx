import {
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import {
  LuCircleCheck,
  LuFileDown,
  LuKanban,
  LuTicket,
  LuTrash2,
  LuUndo2,
} from "react-icons/lu";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { downloadTicketPDF } from "@widgets/tickets/ticket-pdf";
import TicketAttachments from "@widgets/tickets/ticket-attachments";
import {
  useTicketDetail,
  buildTimeline,
  TicketHistoryAside,
  TicketHero,
  TicketInfoCard,
  TicketEditDialog,
  TicketComments,
  TasksGraph,
} from "@features/ticket/ticket-detail";
import { i18n } from "@shared/i18n";
import { useGoBack } from "@shared/lib/useGoBack";
import { LangostinState } from "@shared/ui/langostin";
import { LangostinConfirm } from "@shared/ui/langostin-confirm";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const [editOpen, setEditOpen] = useState(false);

  const fx = useTicketDetail({
    id,
    download: downloadTicketPDF,
    onDeleted: () => goBack("/tickets"),
  });

  const renderAssignmentAttachments = ({
    ticketId,
    assignmentId,
    canUpload,
  }: {
    ticketId: string;
    assignmentId: string;
    canUpload: boolean;
  }) => (
    <TicketAttachments
      ticketId={ticketId}
      assignmentId={assignmentId}
      compact
      canUpload={canUpload}
    />
  );

  const renderTicketAttachments = fx.ticket ? (
    <TicketAttachments
      ticketId={fx.ticket.id}
      canUpload={fx.canUploadToTicket}
    />
  ) : null;

  const ticket = fx.ticket;

  if (!ticket) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("detail.title")}
        backAction={() => goBack("/tickets")}
        icon={<LuTicket size={20} />}
        breadcrumbs={[
          { label: tt("detail.ticketBreadcrumb"), onClick: () => navigate("/tickets", { replace: true }) },
          { label: tt("detail.title") },
        ]}
      >
        <LangostinState kind="loading" title={tt("detail.loading")} description="" />
      </ITPage>
    );
  }

  const timelineEvents = buildTimeline(ticket);

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={ticket.title.charAt(0).toUpperCase() + ticket.title.slice(1)}
      backAction={() => goBack("/tickets")}
      icon={<LuTicket size={20} />}
      breadcrumbs={[
        { label: tt("detail.ticketBreadcrumb"), onClick: () => navigate("/tickets", { replace: true }) },
        { label: tt("detail.title") },
      ]}
      actions={
        <ITFlex gap={2} wrap="wrap">
          {(fx.canCreateTasks || fx.canEditTicket) && (
            <ITButton
              variant="outlined"
              size="lg"
              color="secondary"
              onClick={() => navigate(`/tickets/kanban?ticketId=${ticket.id}`)}
              title={tt("detail.kanbanTitle")}
            >
              <ITFlex align="center" gap={1}>
                <LuKanban size={14} />
                <ITText className="font-bold text-[11px]">{tt("detail.kanban")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton
            variant="outlined"
            size="lg"
            color="primary"
            onClick={fx.handleDownloadPDF}
            disabled={fx.downloadingPDF}
          >
            <ITFlex align="center" gap={1}>
              <LuFileDown size={14} />
              <ITText className="font-bold text-[11px]">
                {fx.downloadingPDF ? tt("detail.pdfGenerating") : tt("detail.pdf")}
              </ITText>
            </ITFlex>
          </ITButton>
          {!fx.isClosed && fx.canClose && (
            <ITButton
              variant="filled"
              size="lg"
              color="primary"
              onClick={() => fx.handleStatusChange("CLOSED")}
            >
              <ITFlex align="center" gap={1}>
                <LuCircleCheck size={14} />
                <ITText className="font-bold text-[11px]">{tt("detail.finish")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          {fx.canDeleteTicket && (
            <ITButton
              variant="outlined"
              size="lg"
              color="error"
              onClick={() => fx.setDeleteOpen(true)}
              title={ticket.deletedAt ? tt("detail.deleteForever") : tt("detail.moveTrash")}
            >
              {ticket.deletedAt ? <LuUndo2 size={14} /> : <LuTrash2 size={14} />}
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <div className="mb-5">
        <TicketHero
          fx={fx}
          onEdit={fx.canEditTicket && !fx.isClosed ? () => setEditOpen(true) : undefined}
          canAssign={fx.canEditTicket && !fx.isClosed}
        />
      </div>

      <ITGrid container columns={12} spacing={5} className="items-start">
        {/* Columna izquierda: contenido principal (2/3) */}
        <ITGrid item xs={12} md={8} className="flex flex-col gap-5 min-w-0">
          <TicketInfoCard fx={fx} attachments={renderTicketAttachments} />

          {(fx.canEditTicket || fx.canCreateTasks || fx.isInvolved) && (
            <ITCard>
              <TasksGraph
                fx={fx}
                canManage={fx.canEditTicket || fx.canCreateTasks}
                renderAssignmentAttachments={renderAssignmentAttachments}
              />
            </ITCard>
          )}

          <TicketComments fx={fx} />
        </ITGrid>

        {/* Columna derecha: historial (1/3) */}
        <ITGrid item xs={12} md={4} className="w-full min-w-0">
          <TicketHistoryAside events={timelineEvents} />
        </ITGrid>
      </ITGrid>

      {fx.toast && (
        <ITToast
          message={fx.toast}
          type={fx.toastType}
          position="bottom-center"
          duration={2500}
          onClose={() => fx.setToast(null)}
        />
      )}

      <TicketEditDialog fx={fx} open={editOpen} onClose={() => setEditOpen(false)} />

      <LangostinConfirm
        isOpen={fx.deleteOpen}
        onClose={() => fx.setDeleteOpen(false)}
        onConfirm={fx.handleDeleteTicket}
        title={ticket.deletedAt ? tt("detail.confirmForeverTitle") : tt("detail.confirmTrashTitle")}
        message={
          ticket.deletedAt
            ? i18n.t("tickets:detail.confirmHardDelete", { title: ticket.title })
            : i18n.t("tickets:detail.confirmSoftDelete", { title: ticket.title })
        }
        confirmLabel={ticket.deletedAt ? tt("detail.deleteForever") : tt("detail.moveTrash")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}