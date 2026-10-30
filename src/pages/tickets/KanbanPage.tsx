import { ITPage, ITToast } from "@axzydev/axzy_ui_system";
import { LuKanban } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TicketDetailModal from "@widgets/tickets/ticket-detail-modal";
import { KanbanBoard, useKanban } from "@features/ticket/kanban";
import { useEffect, useState } from "react";
import { onAppEvent } from "@shared/lib/appEvents";
import { useGoBack } from "@shared/lib/useGoBack";

export default function KanbanPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get("ticketId") ?? undefined;

  const fx = useKanban(ticketId);
  const [guideOpen, setGuideOpen] = useState(false);

  // Alta de tarea desde el panel de Langostín: recarga el tablero.
  useEffect(
    () =>
      onAppEvent("task:created", () => {
        fx.reload();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // "Muéstrame cómo mover una tarea": animación guiada sobre el tablero.
  useEffect(() => onAppEvent("kanban:guide", () => setGuideOpen(true)), []);

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={ticketId ? tt("kanban.byTicket") : tt("kanban.board")}
      description={ticketId ? tt("kanban.descByTicket") : tt("kanban.descBoard")}
      backAction={() => goBack("/tickets")}
      icon={<LuKanban size={20} />}
      breadcrumbs={[
        { label: tt("list.title"), onClick: () => navigate("/tickets", { replace: true }) },
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
    >
      <KanbanBoard fx={fx} guideOpen={guideOpen} onGuideEnd={() => setGuideOpen(false)} />

      <TicketDetailModal
        ticket={fx.modalTicket}
        loading={fx.modalLoading}
        canManage={fx.canManageModalTicket}
        currentUserId={fx.currentUser?.id}
        onClose={() => fx.setModalTicket(null)}
        onOpenFull={(id) => navigate(`/tickets/${id}`)}
      />


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