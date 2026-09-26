import {
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import {
  FaFilePdf,
  FaTicketAlt,
  FaTimesCircle,
  FaTrash,
  FaTrashRestore,
  FaTrello,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { downloadTicketPDF } from "@widgets/tickets/ticket-pdf";
import TicketAttachments from "@widgets/tickets/ticket-attachments";
import {
  useTicketDetail,
  buildTimeline,
  TicketHistoryAside,
  TicketInfoCard,
  TicketManagerPanel,
  TicketComments,
  TasksGraph,
} from "@features/ticket/ticket-detail";
import { i18n } from "@shared/i18n";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);

  const fx = useTicketDetail({
    id,
    download: downloadTicketPDF,
    onDeleted: () => navigate("/tickets"),
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
      <ITPage
        title={tt("detail.title")}
        backAction={() => navigate(-1)}
        icon={<FaTicketAlt size={20} />}
        breadcrumbs={[
          { label: tt("detail.ticketBreadcrumb"), onClick: () => navigate("/tickets") },
          { label: tt("detail.title") },
        ]}
      >
        <ITText className="text-slate-400">{tt("detail.loading")}</ITText>
      </ITPage>
    );
  }

  const timelineEvents = buildTimeline(ticket);

  return (
    <ITPage
      title={ticket.title}
      description={tt("detail.description", {
        status: dyn(tt)(`statusLabels.${ticket.status}`) ?? ticket.status,
        category: ticket.category?.name ?? "—",
      })}
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={[
        { label: tt("detail.ticketBreadcrumb"), onClick: () => navigate("/tickets") },
        { label: ticket.title },
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
                <FaTrello size={12} />
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
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">
                {fx.downloadingPDF ? tt("detail.pdfGenerating") : tt("detail.pdf")}
              </ITText>
            </ITFlex>
          </ITButton>
          {!fx.isClosed && fx.canClose && (
            <ITButton
              variant="filled"
              size="lg"
              color="error"
              onClick={() => fx.handleStatusChange("CLOSED")}
            >
              <ITFlex align="center" gap={1}>
                <FaTimesCircle size={12} />
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
              {ticket.deletedAt ? <FaTrashRestore size={12} /> : <FaTrash size={12} />}
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={5} className="items-start">
        {/* Columna izquierda: contenido principal (2/3) */}
        <ITGrid item xs={12} md={8} className="flex flex-col gap-5 min-w-0">
          <TicketInfoCard fx={fx} attachments={renderTicketAttachments} />

          {(fx.canEditTicket || fx.canCreateTasks) && (
            <TicketManagerPanel fx={fx} renderAssignmentAttachments={renderAssignmentAttachments} />
          )}

          {!fx.canEditTicket && !fx.canCreateTasks && fx.isInvolved && (
            <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
              <TasksGraph fx={fx} canManage={false} renderAssignmentAttachments={renderAssignmentAttachments} />
            </ITFlex>
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

      <ITConfirmDialog
        isOpen={fx.deleteOpen}
        onClose={() => fx.setDeleteOpen(false)}
        onConfirm={fx.handleDeleteTicket}
        title={ticket.deletedAt ? tt("detail.deleteForever") : tt("detail.moveTrash")}
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