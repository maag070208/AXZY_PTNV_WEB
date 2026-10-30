import { ITFlex, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaRedo } from "react-icons/fa";
import { LangostinAvatar, type LangostinAnim } from "@shared/ui/langostin";
import OptionChip from "@shared/ui/option-chip/OptionChip";
import { useTaskAgent, type TaskDraft } from "../model/useTaskAgent";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  /** Cierra el formulario de tarea nueva. */
  onCancel: () => void;
}

// Qué hace Langostin en cada paso: señala las opciones, piensa al escribir.
const STEP_ANIM: Record<string, LangostinAnim> = {
  who: "point",
  what: "think",
  notes: "think",
  when: "point",
  done: "idle",
};

const secondaryButton =
  "cursor-pointer rounded-full border border-slate-200 bg-[var(--it-card-bg)] px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95";

const primaryButton =
  "cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";

/**
 * Agente de tareas dentro del detalle del ticket: el mismo chat de Langostín,
 * pero para dejar una tarea creada (quién, qué, detalles y fecha).
 */
export default function TaskAgentForm({ fx, onCancel }: Props) {
  const { t } = useTranslation("tickets");
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  // Evita updatear estado si el formulario se cerró mientras se guardaba.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // Envío: "work" mientras se crea la tarea, luego "ok" o "err".
  const [sendAnim, setSendAnim] = useState<LangostinAnim | null>(null);
  const [reaction, setReaction] = useState<LangostinAnim | null>("wave");

  const createTask = async (draft: TaskDraft): Promise<boolean> => {
    setSendAnim("work");
    const ok = await fx.createTask(draft);
    if (!alive.current) return ok;
    setSendAnim(ok ? "ok" : "err");
    if (ok) window.setTimeout(() => alive.current && onCancel(), 1500);
    else window.setTimeout(() => alive.current && setSendAnim(null), 3000);
    return ok;
  };

  const agent = useTaskAgent({ onCreate: createTask });

  // El chat se desplaza a sí mismo; con scrollIntoView la página entera se
  // movía cada vez que Langostín preguntaba algo.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [agent.messages.length, agent.typing, agent.step, sendAnim]);

  // Saludo: "wave" un momento al entrar.
  useEffect(() => {
    const id = window.setTimeout(() => setReaction(null), 2500);
    return () => window.clearTimeout(id);
  }, []);

  // Cada respuesta del usuario hace "ok" un momento.
  const lastFrom = agent.messages[agent.messages.length - 1]?.from;
  useEffect(() => {
    if (lastFrom !== "user") return;
    setReaction("ok");
    const id = window.setTimeout(() => setReaction(null), 700);
    return () => window.clearTimeout(id);
  }, [agent.messages.length, lastFrom]);

  const mascot: LangostinAnim =
    sendAnim ?? reaction ?? (agent.typing ? "think" : STEP_ANIM[agent.step] ?? "idle");

  const showBlock = !agent.typing && (agent.step === "done" || sendAnim === null);
  const isOptionStep = agent.step !== "done";
  const guideKey =
    sendAnim === "err"
      ? "error"
      : sendAnim === "ok"
        ? "sent"
        : sendAnim === "work"
          ? "working"
          : agent.step;
  const stepNumber = Math.min(agent.completed + 1, 4);

  // Mensajes del agente agrupados por turno: solo el turno anterior al que
  // está activo lleva un avatar estático; los más viejos quedan en blanco.
  const groupOf: number[] = [];
  let lastGroup = -1;
  agent.messages.forEach((m, i) => {
    if (m.from !== "agent") return;
    if (agent.messages[i - 1]?.from !== "agent") lastGroup += 1;
    groupOf[i] = lastGroup;
  });

  const renderOptions = () => {
    switch (agent.step) {
      case "who":
        return (
          <ITSearchSelect
            name="taskUserId"
            placeholder={t("taskAgent.searchEmployee")}
            options={fx.employeeOptions}
            onChange={(value) => {
              const id = String(value);
              const label =
                fx.employeeOptions.find((o) => o.value === id)?.label ?? id;
              agent.pickUser(id, label);
            }}
            onSearch={fx.searchEmployees}
            isLoading={fx.busyEmployees}
            className="w-full"
          />
        );
      case "what":
        return (
          <div className="flex flex-col gap-2">
            <ITInput
              name="taskTitle"
              placeholder={t("taskAgent.titlePlaceholder")}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agent.sendTitle(titleDraft);
                  setTitleDraft("");
                }
              }}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className={primaryButton}
                disabled={!titleDraft.trim()}
                onClick={() => {
                  agent.sendTitle(titleDraft);
                  setTitleDraft("");
                }}
              >
                {t("taskAgent.send")}
              </button>
            </div>
          </div>
        );
      case "notes":
        return (
          <div className="flex flex-col gap-2">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t("taskAgent.notesPlaceholder")}
              aria-label={t("taskAgent.notesPlaceholder")}
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  agent.sendNotes("");
                  setNotesDraft("");
                }}
              >
                {t("taskAgent.noNotes")}
              </button>
              <button
                type="button"
                className={primaryButton}
                disabled={!notesDraft.trim()}
                onClick={() => {
                  agent.sendNotes(notesDraft);
                  setNotesDraft("");
                }}
              >
                {t("taskAgent.send")}
              </button>
            </div>
          </div>
        );
      case "when":
        return (
          <div className="flex flex-wrap gap-2">
            {agent.whenOptions.map((o, i) => (
              <OptionChip
                key={o.value}
                emoji="📅"
                label={o.label}
                delay={i * 50}
                onClick={() => agent.pickWhen(o)}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="flex max-h-[520px] min-h-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-[var(--it-card-bg)] shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <LangostinAvatar anim="idle" size={30} animated={false} />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900">{t("taskAgent.name")}</span>
            <span className="text-[10px] text-slate-400">{t("taskAgent.helper")}</span>
          </div>
        </div>
        <ITFlex align="center" gap={1}>
          <button
            type="button"
            onClick={() => {
              setSendAnim(null);
              setReaction(null);
              setTitleDraft("");
              setNotesDraft("");
              agent.restart();
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            <FaRedo size={9} />
            {t("taskAgent.restart")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            {t("detail.cancel")}
          </button>
        </ITFlex>
      </header>

      <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-4 py-4">
        {agent.messages.map((m, i) => (
          <div
            key={m.id}
            className={`agent-bubble flex items-end gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.from === "agent" &&
              (groupOf[i] === lastGroup - 1 && agent.messages[i - 1]?.from !== "agent" ? (
                <LangostinAvatar anim="idle" animated={false} />
              ) : (
                <span className="w-9 shrink-0" aria-hidden />
              ))}
            <p
              className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-xs leading-5 ${
                m.from === "user"
                  ? "rounded-br-md bg-slate-900 text-white"
                  : "rounded-bl-md border border-slate-200 bg-[var(--it-card-bg)] text-slate-800"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}

        {agent.typing && (
          <div className="agent-bubble flex items-end gap-2">
            <LangostinAvatar anim="think" size={24} />
            <span className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-[var(--it-card-bg)] px-3.5 py-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
              <span className="sr-only">{t("taskAgent.typing")}</span>
            </span>
          </div>
        )}

        {showBlock && (
          <div className="agent-bubble flex items-end gap-2">
            <LangostinAvatar anim={mascot} size={24} />
            <div className="flex max-w-[92%] flex-col gap-2.5 rounded-2xl rounded-bl-md border border-slate-200 bg-[var(--it-card-bg)] p-3 shadow-sm">
              <p key={guideKey} className="agent-pop flex items-center gap-2 text-[11px] text-slate-500">
                {isOptionStep && sendAnim === null && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    {t("taskAgent.guide.step", { current: stepNumber, total: 4 })}
                  </span>
                )}
                <span>{t(`taskAgent.guide.${guideKey}`)}</span>
              </p>
              {isOptionStep && sendAnim === null && renderOptions()}
              {isOptionStep && sendAnim === null && agent.canGoBack && (
                <button
                  type="button"
                  onClick={agent.goBack}
                  className="flex w-fit cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
                >
                  <FaArrowLeft size={10} />
                  {t("taskAgent.back")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
