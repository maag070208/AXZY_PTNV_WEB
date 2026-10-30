import { useEffect, useRef, useState } from "react";
import { ITAlert, ITBentoStatStrip, ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { LuCircleCheck, LuClock, LuInbox, LuKanban, LuTicket, LuUserX } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  TicketsTable,
  useTicketsList,
} from "@features/ticket/tickets-list";
import { useGoBack } from "@shared/lib/useGoBack";
import type { ListSummaryItem } from "@shared/ui/list-summary-strip";
import { LangostinConfirm } from "@shared/ui/langostin-confirm";
import { onAppEvent } from "@shared/lib/appEvents";

/** Color de cada cifra del resumen (punto de la tira y segmento de la barra). */
/** Tono bento de cada cifra (el mismo lenguaje que el mosaico del inicio). */
const STAT_TONE: Record<string, "sun" | "sea" | "lavender" | "mint"> = {
  open: "sun",
  followUp: "sea",
  unassigned: "lavender",
  closed: "mint",
};

const STAT_COLOR: Record<string, string> = {
  open: "var(--color-warning)",
  followUp: "var(--color-primary-600)",
  unassigned: "var(--color-violet-500)",
  closed: "var(--color-success)",
};

export default function TicketsListPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canDelete = useCan("tickets.delete");

  const list = useTicketsList();
  // Un ticket creado desde el bot (mismo layout, otra montura) avisa aquí:
  // se recarga la tabla y la fila nueva entra animada.
  const [flashNew, setFlashNew] = useState(false);
  const flashTimer = useRef<number | null>(null);
  useEffect(
    () =>
      onAppEvent("ticket:created", () => {
        list.reload();
        setFlashNew(true);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlashNew(false), 2600);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

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
        </ITFlex>
      }
    >
      {/* Resumen: una tarjeta con las cuatro cifras clicables y la barra apilada,
          igual que el diseño de referencia. */}
      {summaryItems.length > 0 && (
        <div className="mb-4">
          <ITBentoStatStrip
            stack
            items={summaryItems.map((item) => ({
              id: item.id,
              label: item.label,
              value: item.value,
              caption: item.caption,
              color: STAT_COLOR[item.id] ?? "var(--color-primary-500)",
              tone: STAT_TONE[item.id] ?? "plain",
            }))}
            stackItems={summaryItems
              .filter((item) => ["open", "followUp", "closed"].includes(item.id))
              .map((item) => ({ id: item.id, label: item.label, value: item.value, color: STAT_COLOR[item.id] ?? "var(--color-primary-500)" }))}
            activeId={list.quickFilter ?? undefined}
            onSelect={(id) => list.toggleQuickFilter(id as "open" | "followUp" | "unassigned" | "closed")}
          />
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
        flashNew={flashNew}
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
