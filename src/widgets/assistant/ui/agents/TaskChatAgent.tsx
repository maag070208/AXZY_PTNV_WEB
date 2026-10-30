import { useEffect, useMemo, useRef, useState } from "react";
import { ITFlex, ITLoader, ITSearchSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { LuRotateCcw } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { emitAppEvent } from "@shared/lib/appEvents";
import { LangostinAvatar } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import OptionChip from "@shared/ui/option-chip/OptionChip";
import { ticketsApi, type Ticket } from "@entities/ticket";
import { usersApi, personLabel, type User } from "@entities/user";
import { useTaskAgent } from "@features/ticket/ticket-detail/model/useTaskAgent";

interface Props {
  /** Se llama cuando la tarea ya se creó. */
  onDone: () => void;
  /** Ticket ya elegido: lo manda el detalle del ticket al abrir el panel. */
  targetId?: string;
  /** Título del ticket para el resumen (opcional). */
  ticketTitle?: string;
}

const primaryChip =
  "cursor-pointer rounded-full px-4 py-2 text-[12.5px] font-semibold transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

const primaryStyle = {
  backgroundColor: "var(--it-bento-ink-bg, var(--color-primary))",
  color: "var(--it-bento-ink-text, #ffffff)",
};

const secondaryStyle = {
  backgroundColor: "var(--it-bento-control-bg, var(--color-slate-100))",
  color: "var(--it-bento-control-text, var(--color-slate-600))",
};

/**
 * Alta de tarea **desde el tablero**: como aquí se ven tareas de varios tickets,
 * el chat pregunta primero de qué ticket es y después quién, qué, detalles y
 * para cuándo. Mismo formato que el alta de ticket (una columna, auto-scroll,
 * loader al enviar y aviso para que el tablero recargue).
 */
export default function TaskChatAgent({ onDone, targetId, ticketTitle }: Props) {
  const { t } = useTranslation("tickets");
  const [people, setPeople] = useState<User[]>([]);
  const [ticketOptions, setTicketOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [sendState, setSendState] = useState<"idle" | "work" | "ok" | "err">("idle");
  const threadRef = useRef<HTMLDivElement>(null);

  // Personas para elegir a quién se le encarga.
  useEffect(() => {
    usersApi
      .employees()
      .then(setPeople)
      .catch(() => setPeople([]));
  }, []);

  // Tickets para el primer paso: se cargan una vez (la lista ya respeta el
  // alcance) y el selector filtra mientras se escribe.
  useEffect(() => {
    let alive = true;
    ticketsApi
      .list()
      .then((res) => {
        if (!alive) return;
        setTicketOptions(
          (res.data ?? [])
            .filter((tk: Ticket) => !tk.deletedAt)
            .slice(0, 100)
            .map((tk: Ticket) => ({ value: tk.id, label: tk.title })),
        );
      })
      .catch(() => alive && setTicketOptions([]))
      .finally(() => alive && setLoadingTickets(false));
    return () => {
      alive = false;
    };
  }, []);

  const agent = useTaskAgent({
    askTicket: !targetId,
    initialTicket: targetId ? { id: targetId, title: ticketTitle ?? "" } : undefined,
    onCreate: async (draft, ticketId) => {
      if (!ticketId) return false;
      try {
        setSendState("work");
        await ticketsApi.addAssignment(ticketId, {
          userId: draft.userId,
          title: draft.title.trim(),
          description: draft.description.trim(),
          startDate: draft.startDate || null,
          dueDate: draft.dueDate || null,
        });
        setSendState("ok");
        emitAppEvent("task:created", { ticketId });
        window.setTimeout(onDone, 1200);
        return true;
      } catch {
        setSendState("err");
        window.setTimeout(() => setSendState("idle"), 2500);
        return false;
      }
    },
  });

  // Auto-scroll del hilo.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [agent.messages.length, agent.typing, agent.step, sendState]);

  const stepNumber = Math.min(agent.completed + 1, agent.steps.length);
  const lastAgentId = useMemo(
    () => [...agent.messages].reverse().find((m) => m.from === "agent")?.id ?? -1,
    [agent.messages],
  );

  const renderOptions = () => {
    switch (agent.step) {
      case "ticket":
        return (
          <ITSearchSelect
            name="taskTicket"
            placeholder={t("taskAgent.searchTicket")}
            options={ticketOptions}
            isLoading={loadingTickets}
            onChange={(value) => {
              const id = String(value);
              const option = ticketOptions.find((o) => o.value === id);
              if (option) agent.pickTicket(id, option.label);
            }}
          />
        );
      case "who":
        return (
          <ITSearchSelect
            name="taskWho"
            placeholder={t("taskAgent.searchPerson")}
            options={people.map((p) => ({ value: p.id, label: personLabel(p) }))}
            onChange={(value) => {
              const person = people.find((p) => p.id === String(value));
              if (person) agent.pickUser(person.id, personLabel(person));
            }}
          />
        );
      case "what":
        return (
          <ITFlex direction="column" gap={2}>
            <ITTextarea
              name="taskTitle"
              value={titleDraft}
              onChange={setTitleDraft}
              maxLength={120}
              rows={2}
              placeholder={t("taskAgent.whatPlaceholder")}
            />
            <ITFlex justify="end">
              <button
                type="button"
                className={primaryChip}
                style={primaryStyle}
                disabled={titleDraft.trim().length < 3}
                onClick={() => {
                  agent.sendTitle(titleDraft);
                  setTitleDraft("");
                }}
              >
                {t("taskAgent.continue")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      case "notes":
        return (
          <ITFlex direction="column" gap={2}>
            <ITTextarea
              name="taskNotes"
              value={notesDraft}
              onChange={setNotesDraft}
              maxLength={500}
              rows={2}
              placeholder={t("taskAgent.notesPlaceholder")}
            />
            <ITFlex justify="end" gap={2}>
              <button
                type="button"
                className={primaryChip}
                style={secondaryStyle}
                onClick={() => {
                  agent.sendNotes("");
                  setNotesDraft("");
                }}
              >
                {t("taskAgent.noNotes")}
              </button>
              <button
                type="button"
                className={primaryChip}
                style={primaryStyle}
                disabled={!notesDraft.trim()}
                onClick={() => {
                  agent.sendNotes(notesDraft);
                  setNotesDraft("");
                }}
              >
                {t("taskAgent.continue")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      case "when":
        return (
          <ITFlex wrap="wrap" gap={1.5}>
            {agent.whenOptions.map((option) => (
              <OptionChip
                key={option.value}
                emoji="📅"
                label={option.label}
                onClick={() => agent.pickWhen(option)}
              />
            ))}
          </ITFlex>
        );
      default:
        return null;
    }
  };

  return (
    <ITFlex direction="column" className="relative h-full min-h-0">
      {/* Progreso, compacto */}
      <ITFlex
        align="center"
        gap={2}
        className="shrink-0 border-b border-slate-200/70 px-4 py-2"
      >
        <ITText className="rounded-full bg-[color-mix(in_srgb,currentColor_6%,transparent)] px-2 py-0.5 !text-[11px] font-bold">
          {t("new.guide.step", { current: stepNumber, total: agent.steps.length })}
        </ITText>
        <ITText muted className="min-w-0 flex-1 truncate !text-[12px]">
          {agent.ticketName ? `${agent.ticketName} · ` : ""}
          {t(`taskAgent.guide.${agent.step}`)}
        </ITText>
        <button
          type="button"
          onClick={() => {
            setTitleDraft("");
            setNotesDraft("");
            agent.restart();
          }}
          title={t("taskAgent.restart")}
          aria-label={t("taskAgent.restart")}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
        >
          <LuRotateCcw size={13} />
        </button>
      </ITFlex>

      {/* Hilo */}
      <div
        ref={threadRef}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
        style={{ background: "color-mix(in srgb, var(--color-slate-500) 5%, transparent)" }}
      >
        {agent.messages.map((m) => {
          if (m.from === "agent") {
            const latest = m.id === lastAgentId && !agent.typing;
            return (
              <ITFlex key={m.id} align="end" gap={1.5} className="agent-pop max-w-full self-start">
                {latest ? (
                  <LangostinAvatar anim={agent.typing ? "think" : "wave"} size={26} />
                ) : (
                  <ITText as="span" aria-hidden className="w-[38px] shrink-0" />
                )}
                <ITText as="span" className="w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-[var(--it-card-bg)] px-3.5 py-2 !text-[12.5px] leading-snug shadow-sm">
                  {m.text}
                </ITText>
              </ITFlex>
            );
          }
          return (
            <ITFlex key={m.id} align="end" justify="end" gap={1.5} className="agent-pop max-w-full self-end">
              <ITText as="span" className="w-fit max-w-[78%] rounded-2xl rounded-br-md bg-[var(--it-bento-ink-bg,var(--color-primary))] px-3.5 py-2 !text-[12.5px] font-semibold leading-snug text-[var(--it-bento-ink-text,#fff)]">
                {m.text}
              </ITText>
              <ProfileAvatar name={agent.draft.userId ? (people.find((p) => p.id === agent.draft.userId)?.name ?? "") : ""} size="xs" />
            </ITFlex>
          );
        })}
        {agent.typing && (
          <ITFlex align="center" gap={1.5}>
            <LangostinAvatar anim="think" size={22} />
            <ITText muted className="!text-[11.5px]">
              Langostín…
            </ITText>
          </ITFlex>
        )}
      </div>

      {/* Envío */}
      {sendState !== "idle" && (
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--it-card-bg)_88%,transparent)] px-6 text-center backdrop-blur-sm ${
            sendState === "ok" ? "ticket-sent-pop" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <LangostinAvatar anim={sendState === "work" ? "work" : sendState === "ok" ? "ok" : "err"} size={54} />
          {sendState === "work" && (
            <>
              <ITText className="!text-[14px] font-bold">{t("taskAgent.sending")}</ITText>
              <ITLoader variant="dots" size="md" color="primary" />
            </>
          )}
          {sendState === "ok" && (
            <ITText className="ticket-sent-check !text-[15px] font-bold text-[color:var(--color-success)]">
              {t("taskAgent.sentOk")}
            </ITText>
          )}
          {sendState === "err" && (
            <ITText className="!text-[13px] font-semibold text-[color:var(--color-danger)]">
              {t("taskAgent.sendError")}
            </ITText>
          )}
        </div>
      )}

      {/* Opciones del paso */}
      {!agent.typing && agent.step !== "done" && (
        <div className="shrink-0   px-4 py-3">
          {renderOptions()}
          {agent.canGoBack && (
            <ITFlex justify="start" className="mt-2">
              <button
                type="button"
                onClick={agent.goBack}
                className="cursor-pointer !text-[11.5px] font-semibold text-slate-500 transition hover:text-slate-700"
              >
                ← {t("taskAgent.back")}
              </button>
            </ITFlex>
          )}
        </div>
      )}
    </ITFlex>
  );
}
