import { useEffect, useRef, useState } from "react";
import { ITChip, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuArrowRight, LuMapPin, LuRotateCcw, LuX } from "react-icons/lu";
import { useTranslation } from "react-i18next";

import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { useCan } from "@entities/user";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { LangostinAvatar } from "@shared/ui/langostin";
import { usePrefersReducedMotion } from "@shared/lib/usePrefersReducedMotion";
import { helpScreenFor, isHelpHidden, type HelpAction } from "../model/helpRegistry";
import { ITButton } from "@axzydev/axzy_ui_system";
import { LuArrowLeft, LuSparkles } from "react-icons/lu";
import { ASSISTANT_AGENTS, type AssistantAgent } from "../model/agents";
import { useSeason } from "../model/useSeason";
import { emitAppEvent, onAppEvent } from "@shared/lib/appEvents";

type Message = { id: number; from: "agent" | "user"; text: string };

/**
 * Langostín como **asistente de ayuda contextual**: botón flotante abajo a la
 * derecha que abre un panel con lo que se puede hacer en la pantalla actual y a
 * dónde ir según el rol. Es determinista (nivel 1): solo ofrece lo registrado en
 * `helpRegistry`, nunca inventa rutas y no ejecuta acciones que cambien datos.
 */
export default function LangostinAssistant() {
  const { t } = useTranslation("langostin");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userName = useSelector((s: RootState) => s.auth.user?.name ?? "");
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  // Formulario activo dentro del panel (null = modo ayuda). Cada formulario vive
  // en su componente, así sus hooks sólo corren cuando está abierto.
  const [agentId, setAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hintSeen, setHintSeen] = useState(true);
  // El globo de "puedo darte de alta el ticket" se descarta al usarlo o al decir "después".
  const [offerDismissed, setOfferDismissed] = useState(false);
  const seq = useRef(0);
  const screen = helpScreenFor(pathname);
  const hidden = isHelpHidden(pathname);
  // Caracterización por temporada del año: sólo cambia el ánimo del botón y el
  // saludo; las respuestas de ayuda son las mismas.
  const season = useSeason();
  const reduced = usePrefersReducedMotion();

  const canCreateTicket = useCan("tickets.create");
  const canAssignTasks = useCan("tasks.assign");
  const canManageActs = useCan("hr.disciplinary_reports");
  const canManageSchedules = useCan("schedules.view");

  // Al cambiar de pantalla el asistente se **reinicia**: cierra el formulario
  // que estuviera abierto y vuelve a ofrecerse desde cero. Así no se puede, por
  // ejemplo, acabar de dar de alta un usuario con la conversación de tickets.
  const lastScreenRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastScreenRef.current === screen.screenId) return;
    lastScreenRef.current = screen.screenId;
    setAgentId(null);
    setOfferDismissed(false);
  }, [screen.screenId]);

  // Auto-scroll del chat de ayuda: cada pregunta que se toca deja la respuesta
  // a la vista, igual que en el alta de ticket.
  const helpThreadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = helpThreadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  const push = (message: Omit<Message, "id">) => {
    seq.current += 1;
    setMessages((prev) => [...prev, { ...message, id: seq.current }]);
  };

  // Al abrir (o cambiar de pantalla) saluda **una sola vez**: el efecto se
  // vuelve a correr (StrictMode / re-render) y duplicaba el mismo mensaje.
  const greetedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      greetedRef.current = null;
      return;
    }
    if (greetedRef.current === screen.screenId) return;
    greetedRef.current = screen.screenId;
    const greeting: Message[] = [
      { id: ++seq.current, from: "agent", text: t("help.context", { screen: screen.title, explain: screen.explain }) },
    ];
    // Se ofrece a hacer el alta que corresponda a esta pantalla.
    if (screen.screenId === "tickets.list" && canCreateTicket) {
      greeting.push({ id: ++seq.current, from: "agent", text: t("help.ticketOffer") });
    }
    if ((screen.screenId === "tickets.kanban" || screen.screenId === "tickets.tasks") && canAssignTasks) {
      greeting.push({ id: ++seq.current, from: "agent", text: t("help.taskOffer") });
    }
    setMessages(greeting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, screen.screenId, canCreateTicket]);

  // El globo de "¿Te ayudo?" aparece la primera vez en la sesión.
  useEffect(() => {
    try {
      setHintSeen(sessionStorage.getItem("ptnv.help.hint") === "1");
    } catch {
      setHintSeen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dismissHint = () => {
    setHintSeen(true);
    try {
      sessionStorage.setItem("ptnv.help.hint", "1");
    } catch {
      /* sin almacenamiento: el globo se oculta solo en esta vista */
    }
  };

  const openPanel = () => {
    setOpen(true);
    dismissHint();
  };

  const closePanel = () => {
    setOpen(false);
    setAgentId(null);
  };

  // Formularios disponibles aquí: con el permiso de la persona y en esta pantalla.
  const availableAgents = ASSISTANT_AGENTS.filter(
    (agent) => !agent.screens || agent.screens.includes(screen.screenId),
  );
  const activeAgent = availableAgents.find((agent) => agent.id === agentId) ?? null;

  // La tabla de Horarios pide editar una fila: el panel abre el formulario con
  // ese id (no se navega a otra pantalla ni se abre un modal).
  useEffect(
    () =>
      onAppEvent("schedule:edit", ({ id }) => {
        setTargetId(id);
        setAgentId("scheduleEdit");
        setOpen(true);
      }),
    [],
  );

  // Oferta proactiva según la pantalla: en Tickets, el alta de ticket; en el
  // tablero, la de tarea. Sólo aparece si el permiso de esa pantalla está.
  const offerAgent =
    screen.screenId === "tickets.list" && canCreateTicket
      ? { agentId: "ticket", labelKey: "help.agentTicket" as const, bubbleKey: "help.ticketOfferBubble" as const }
      : (screen.screenId === "tickets.kanban" || screen.screenId === "tickets.tasks") && canAssignTasks
        ? { agentId: "task", labelKey: "help.agentTask" as const, bubbleKey: "help.taskOfferBubble" as const }
        : screen.screenId === "schedules" && canManageSchedules
          ? { agentId: "schedule", labelKey: "help.agentSchedule" as const, bubbleKey: "help.scheduleOfferBubble" as const }
          : screen.screenId === "employees.disciplinary" && canManageActs
          ? { agentId: "act", labelKey: "help.agentAct" as const, bubbleKey: "help.actOfferBubble" as const }
          : null;

  // Las rutas del registro pueden traer `:id` (la ficha de una persona, por
  // ejemplo): se rellena con el id de la pantalla actual.
  const currentId = pathname.split("/").filter(Boolean)[1] ?? "";
  const resolveTo = (to: string) => (to.includes(":id") ? to.split(":id").join(currentId) : to);

  const runAction = (action: HelpAction) => {
    push({ from: "user", text: action.label });
    if (action.emit) {
      // Aviso a la pantalla (animación guiada o vista rápida) y se cierra el panel para verla.
      if (typeof action.emit === "string") emitAppEvent(action.emit, {});
      else emitAppEvent(action.emit.event, action.emit.payload);
      push({ from: "agent", text: action.answer ?? t("help.unknown") });
      window.setTimeout(() => setOpen(false), 700);
      return;
    }
    if (action.to) {
      push({ from: "agent", text: t("help.going", { screen: action.label }) });
      navigate(resolveTo(action.to));
      setOpen(false);
      return;
    }
    push({ from: "agent", text: action.answer ?? t("help.unknown") });
  };

  const navActions = screen.actions.filter((action) => action.to);
  const infoActions = screen.actions.filter((action) => !action.to);

  if (hidden) return null;

  return (
    <>
      {/* Panel de ayuda */}
      {open && (
        <div
          role="dialog"
          aria-label={t("help.title")}
          className={`fixed bottom-24 right-5 z-50 flex flex-col overflow-hidden rounded-[28px] bg-[var(--it-card-bg)] shadow-[0_28px_70px_-18px_rgba(13,47,64,0.55)] ring-1 ring-black/5 ${
            activeAgent
              ? "h-[min(760px,calc(100dvh-7rem))] w-[min(760px,calc(100vw-2.5rem))]"
              : "h-[min(600px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2.5rem))]"
          }`}
        >
          {season && !reduced && (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 7 }, (_, i) => (
                <ITText as="span"
                  key={i}
                  className="help-fall absolute top-[-24px] text-[14px] opacity-50"
                  style={{ left: `${8 + i * 13}%`, animationDelay: `${i * 0.9}s`, animationDuration: `${6 + (i % 3)}s` }}
                >
                  {season.particles[i % season.particles.length]}
                </ITText>
              ))}
            </div>
          )}

          {activeAgent ? (
            <>
              <ITFlex align="center" gap={2} className="relative z-[1] border-b border-slate-200/70 px-4 py-3">
                <ITButton variant="text" color="secondary" size="sm" onClick={() => setAgentId(null)} ariaLabel={t("help.back")} title={t("help.back")}>
                  <LuArrowLeft size={16} />
                </ITButton>
                <LuSparkles size={15} className="text-[color:var(--color-primary)]" />
                <ITText className="!text-[13.5px] font-bold">{t(activeAgent.labelKey)}</ITText>
              </ITFlex>
              <div className="relative z-[1] min-h-0 flex-1 overflow-hidden">
                <activeAgent.Component
                  targetId={targetId}
                  onDone={() => {
                    setAgentId(null);
                    setTargetId(undefined);
                    setOpen(false);
                  }}
                />
              </div>
            </>
          ) : (
          <>
          {/* Encabezado: mascota, nombre, estado con la temporada y acciones */}
          <ITFlex
            align="center"
            gap={3}
            className="relative z-[1] px-5 pb-3 pt-4"
            style={season ? { background: `linear-gradient(110deg, ${season.tint}, transparent 78%)` } : undefined}
          >
            <LangostinAvatar anim={season?.anim ?? "wave"} size={54} />
            <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
              <ITText className="!text-[17px] font-bold leading-tight">{t("help.name")}</ITText>
              <ITFlex align="center" gap={1} className="min-w-0">
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]" />
                <ITText className="!text-[12.5px] font-semibold leading-snug text-[color:var(--color-success)]">
                  {season ? `${t("help.online")} · ${season.emoji} ${t(`season.${season.key}.name`)}` : t("help.online")}
                </ITText>
              </ITFlex>
            </ITFlex>
            <button
              type="button"
              onClick={() => setMessages([])}
              title={t("help.restart")}
              aria-label={t("help.restart")}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
            >
              <LuRotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={closePanel}
              title={t("help.close")}
              aria-label={t("help.close")}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
            >
              <LuX size={18} />
            </button>
          </ITFlex>

          {/* Contexto: dónde está y con qué rol */}
          <ITFlex
            align="center"
            gap={1.5}
            className="relative z-[1] border-y border-slate-200/70 bg-[color-mix(in_srgb,currentColor_4%,transparent)] px-5 py-2.5"
          >
            <LuMapPin size={15} className="shrink-0 text-slate-400" />
            <ITText muted className="shrink-0 !text-[13px]">
              {t("help.contextLabel")}
            </ITText>
            <ITText className="min-w-0 flex-1 truncate !text-[13.5px] font-bold">{screen.title}</ITText>
          </ITFlex>

          {/* Conversación */}
          <div
            ref={helpThreadRef}
            className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4"
          >
            {messages.map((message) =>
              message.from === "agent" ? (
                <ITText
                  key={message.id}
                  className="agent-pop max-w-[86%] self-start rounded-2xl rounded-bl-md bg-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-2.5 !text-[13.5px] leading-snug"
                >
                  {message.text}
                </ITText>
              ) : (
                // Cada mensaje de la persona lleva su Blobatar, como en un chat.
                <ITFlex key={message.id} align="end" justify="end" gap={1.5} className="agent-pop max-w-full self-end">
                  <ITText className="max-w-[78%] rounded-2xl rounded-br-md bg-[var(--it-bento-ink-bg,var(--color-primary))] px-4 py-2.5 !text-[13.5px] font-semibold leading-snug text-[var(--it-bento-ink-text,#fff)]">
                    {message.text}
                  </ITText>
                  <ProfileAvatar name={userName} size="sm" />
                </ITFlex>
              ),
            )}
          </div>

          {/* Opciones: a dónde ir, qué preguntar y los juegos de Langostín */}
          <div className="relative z-[1] max-h-[46%] overflow-y-auto   px-5 py-3">
            {navActions.length > 0 && (
              <>
                <ITText muted className="!text-[11px] font-bold uppercase tracking-[0.06em]">
                  {t("help.goTo")}
                </ITText>
                <ITFlex wrap="wrap" gap={1.5} className="mt-1.5">
                  {navActions.map((action) => (
                    <NavChip key={action.label} action={action} onClick={() => runAction(action)} />
                  ))}
                </ITFlex>
              </>
            )}

            {infoActions.length > 0 && (
              <>
                <ITText muted className="mt-3 block !text-[11px] font-bold uppercase tracking-[0.06em]">
                  {t("help.onThisScreen")}
                </ITText>
                <ITFlex wrap="wrap" gap={1.5} className="mt-1.5">
                  {infoActions.map((action) => (
                    <ITChip key={action.label} size="lg" variant="outlined" color="gray" onClick={() => runAction(action)}>
                      {action.label}
                    </ITChip>
                  ))}
                </ITFlex>
              </>
            )}

            <ITText muted className="mt-3 block !text-[11px] font-bold uppercase tracking-[0.06em]">
              {t("help.name")}
            </ITText>
            <ITFlex wrap="wrap" gap={1.5} className="mt-1.5">
              {/* Formularios que Langostín puede hacer aquí (sólo con permiso). */}
              {availableAgents.map((agent) => (
                <AgentChip key={agent.id} agent={agent} onClick={() => setAgentId(agent.id)} />
              ))}
            </ITFlex>
          </div>
          </>
          )}
        </div>
      )}

      {/* Oferta proactiva en Tickets: Langostín da de alta el ticket */}
      {!open && offerAgent && !offerDismissed && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[268px] flex-col gap-2 rounded-2xl rounded-br-sm bg-[var(--it-card-bg)] px-3.5 py-3 shadow-[0_18px_40px_-18px_rgba(13,47,64,0.5)] ring-1 ring-black/5">
          <ITText className="!text-[12.5px] leading-snug">
            {t(offerAgent.bubbleKey)}
          </ITText>
          <ITFlex align="center" gap={1.5}>
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
              onClick={() => {
                setOfferDismissed(true);
                setOpen(true);
                setAgentId(offerAgent.agentId);
              }}
            >
              <ITFlex align="center" gap={1}>
                <LuSparkles size={12} />
                <ITText className="!text-[11px] font-bold">{t(offerAgent.labelKey)}</ITText>
              </ITFlex>
            </ITButton>
            <ITButton variant="text" color="secondary" size="sm" onClick={() => setOfferDismissed(true)}>
              <ITText className="!text-[11px] font-semibold">{t("help.later")}</ITText>
            </ITButton>
          </ITFlex>
        </div>
      )}

      {/* Globo de la primera vez */}
      {!open && !offerAgent && hintSeen === false && (
        <div className="fixed bottom-24 right-6 z-50 max-w-[240px] rounded-2xl rounded-br-sm bg-[var(--it-card-bg)] px-3 py-2 shadow-lg ring-1 ring-black/5">
          <ITText className="!text-[12px] font-semibold">{t("help.hint", { screen: screen.title })}</ITText>
        </div>
      )}

      {/* Botón flotante (el anillo y el emoji cambian con la temporada) */}
      <button
        type="button"
        onClick={open ? closePanel : openPanel}
        aria-expanded={open}
        aria-label={open ? t("help.close") : t("help.open")}
        style={{ boxShadow: `0 10px 28px -8px rgba(13,47,64,0.5), 0 0 0 3px ${season?.ring ?? "var(--color-primary-600)"}` }}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[var(--it-card-bg)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-primary)]"
      >
        <LangostinAvatar anim={open ? "ok" : (season?.anim ?? "idle")} size={30} />
        {season && (
          <ITText as="span" aria-hidden className="absolute -left-2 -top-2 text-[16px] drop-shadow-sm">
            {season.emoji}
          </ITText>
        )}
      </button>
    </>
  );
}

/** Chip de un formulario que Langostín puede hacer aquí (filtra por permiso). */
function AgentChip({ agent, onClick }: { agent: AssistantAgent; onClick: () => void }) {
  const { t } = useTranslation("langostin");
  const can = useCan(agent.permission);
  if (!can) return null;
  return (
    <ITChip size="lg" color={agent.tone ?? "primary"} variant="soft" icon={<LuSparkles size={13} />} onClick={onClick}>
      {t(agent.labelKey)}
    </ITChip>
  );
}

/** Opción de navegación: píldora verde con flecha, como el diseño de referencia. */
function NavChip({ action, onClick }: { action: HelpAction; onClick: () => void }) {
  const can = useCan(action.permission ?? "");
  if (action.permission && !can) return null;
  return (
    <ITChip size="lg" color="success" variant="soft" icon={<LuArrowRight size={13} />} onClick={onClick}>
      {action.label}
    </ITChip>
  );
}
