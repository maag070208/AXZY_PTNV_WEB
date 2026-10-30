import { useEffect, useRef, useState } from "react";
import { ITFlex, ITInput, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { LuRotateCcw } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { scheduleApi, type Schedule } from "@entities/schedule";
import { emitAppEvent } from "@shared/lib/appEvents";
import { LangostinAvatar } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import OptionChip from "@shared/ui/option-chip/OptionChip";

interface Props {
  /** Cierra el panel al terminar. */
  onDone: () => void;
  /** Horario que se edita (lo manda la fila de la tabla). */
  targetId?: string;
}

type Field = "name" | "hours" | "rules" | "active";
type Step = "choose" | Field | "done";

type Message = { id: number; from: "agent" | "user"; text: string };

const primaryChip =
  "cursor-pointer rounded-full px-4 py-2 text-[12.5px] font-semibold transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

const primaryStyle = {
  backgroundColor: "var(--it-bento-ink-bg, var(--color-primary))",
  color: "var(--it-bento-ink-text, #ffffff)",
};

/**
 * Edición de un horario **dentro del panel**: pregunta qué se quiere cambiar
 * (nombre, horario, reglas o activarlo) y guarda al instante, sin navegar a otra
 * pantalla ni abrir un modal.
 */
export default function ScheduleEditAgent({ onDone, targetId }: Props) {
  const { t } = useTranslation("schedules");
  const userName = useSelector((s: RootState) => s.auth.user?.name ?? "");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const push = (message: Omit<Message, "id">) => {
    seq.current += 1;
    setMessages((prev) => [...prev, { ...message, id: seq.current }]);
  };

  const ask = (text: string, delay = 300) => {
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        push({ from: "agent", text });
        setTyping(false);
      }, delay),
    );
  };

  // Carga el horario elegido y arranca la conversación.
  useEffect(() => {
    let active = true;
    const pending = timers.current;
    scheduleApi
      .list(true)
      .then((list) => {
        if (!active) return;
        const found = list.find((h) => h.id === targetId) ?? null;
        setSchedule(found);
        if (found) {
          ask(t("editAgent.hello", { name: found.name }), 150);
          ask(t("editAgent.ask"), 600);
        } else {
          ask(t("editAgent.notFound"), 150);
        }
      })
      .catch(() => ask(t("editAgent.notFound"), 150));
    return () => {
      active = false;
      pending.forEach((id) => window.clearTimeout(id));
    };
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing, saving]);

  const save = async (patch: Parameters<typeof scheduleApi.update>[1], answer: string, nextQuestion?: string) => {
    if (!schedule) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await scheduleApi.update(schedule.id, patch);
      setSchedule(updated);
      push({ from: "agent", text: answer });
      emitAppEvent("schedule:updated", {});
      setStep("choose");
      if (nextQuestion) ask(nextQuestion, 350);
    } catch {
      setError(t("editAgent.error"));
    } finally {
      setSaving(false);
    }
  };

  const startField = (field: Field) => {
    setStep(field);
    setDraft(field === "name" ? schedule?.name ?? "" : field === "hours" ? schedule?.days.find((d) => !d.restDay)?.startTime ?? "09:00" : "");
  };

  const submitDraft = () => {
    if (!schedule) return;
    const value = draft.trim();
    if (!value) return;
    push({ from: "user", text: value });
    setDraft("");
    if (step === "name") {
      void save({ name: value }, t("editAgent.savedName", { name: value }), t("editAgent.ask"));
      return;
    }
    if (step === "hours") {
      // "09:00-18:00": se aplica el mismo rango a los días laborables.
      const match = value.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
      if (!match) {
        ask(t("editAgent.hoursBadFormat"), 150);
        setStep("choose");
        return;
      }
      const [, startTime, endTime] = match;
      const days = schedule.days.map((d) =>
        d.restDay ? d : { ...d, startTime, endTime, splitStartTime: null, splitEndTime: null },
      );
      void save({ days }, t("editAgent.savedHours", { from: startTime, to: endTime }), t("editAgent.ask"));
      return;
    }
    if (step === "rules") {
      // "10 60 30 0": tolerancia de entrada, de salida, comida y mínimo de extra.
      const parts = value.split(/\s+/).map(Number);
      if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0)) {
        ask(t("editAgent.rulesBadFormat"), 150);
        setStep("choose");
        return;
      }
      const [entryToleranceMin, exitToleranceMin, mealBreakMin, minOvertimeMin] = parts;
      void save(
        { entryToleranceMin, exitToleranceMin, mealBreakMin, minOvertimeMin },
        t("editAgent.savedRules"),
        t("editAgent.ask"),
      );
    }
  };

  const toggleActive = () => {
    if (!schedule) return;
    const next = !schedule.active;
    push({ from: "user", text: next ? t("active") : t("inactive") });
    void save({ active: next }, next ? t("editAgent.savedActive") : t("editAgent.savedInactive"), t("editAgent.ask"));
  };

  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    setMessages([]);
    setStep("choose");
    setDraft("");
    setError(null);
    ask(schedule ? t("editAgent.ask") : t("editAgent.notFound"), 150);
  };

  const lastAgentId = [...messages].reverse().find((m) => m.from === "agent")?.id ?? -1;

  return (
    <ITFlex direction="column" className="relative h-full min-h-0">
      <ITFlex align="center" gap={2} className="shrink-0 border-b border-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-2">
        <ITText className="min-w-0 flex-1 truncate !text-[12px] font-bold">
          {schedule ? schedule.name : t("editAgent.title")}
        </ITText>
        <button
          type="button"
          onClick={restart}
          title={t("agent.restart")}
          aria-label={t("agent.restart")}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
        >
          <LuRotateCcw size={13} />
        </button>
      </ITFlex>

      <div
        ref={threadRef}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
        style={{ background: "color-mix(in srgb, var(--color-slate-500) 5%, transparent)" }}
      >
        {messages.map((m) => {
          if (m.from === "agent") {
            const latest = m.id === lastAgentId && !typing;
            return (
              <ITFlex key={m.id} align="end" gap={1.5} className="agent-pop max-w-full self-start">
                {latest ? (
                  <LangostinAvatar anim={typing ? "think" : "point"} size={26} />
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
              <ProfileAvatar name={userName} size="xs" />
            </ITFlex>
          );
        })}
        {typing && (
          <ITFlex align="center" gap={1.5}>
            <LangostinAvatar anim="think" size={22} />
            <ITText muted className="!text-[11.5px]">
              Langostín…
            </ITText>
          </ITFlex>
        )}
      </div>

      {saving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[color-mix(in_srgb,var(--it-card-bg)_82%,transparent)] backdrop-blur-sm" role="status" aria-live="polite">
          <ITFlex direction="column" align="center" gap={2}>
            <LangostinAvatar anim="work" size={44} />
            <ITText className="!text-[13px] font-bold">{t("agent.saving")}</ITText>
            <ITLoader variant="dots" size="md" color="primary" />
          </ITFlex>
        </div>
      )}

      <div className="shrink-0 border-t border-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-3">
        {error && (
          <ITText className="mb-2 block !text-[11.5px] font-semibold text-[color:var(--color-danger)]">{error}</ITText>
        )}
        {step === "choose" ? (
          <ITFlex wrap="wrap" gap={1.5}>
            <OptionChip emoji="✏️" label={t("editAgent.fieldName")} onClick={() => startField("name")} />
            <OptionChip emoji="🕘" label={t("editAgent.fieldHours")} onClick={() => startField("hours")} />
            <OptionChip emoji="⚙️" label={t("editAgent.fieldRules")} onClick={() => startField("rules")} />
            <OptionChip
              emoji={schedule?.active ? "⏸️" : "▶️"}
              label={schedule?.active ? t("editAgent.deactivate") : t("editAgent.activate")}
              onClick={toggleActive}
            />
            <OptionChip emoji="✅" label={t("editAgent.finish")} onClick={onDone} />
          </ITFlex>
        ) : (
          <ITFlex align="end" gap={2}>
            <ITFlex className="min-w-0 flex-1">
              <ITInput
                name="scheduleEditValue"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitDraft();
                }}
                placeholder={
                  step === "name"
                    ? t("editAgent.placeholderName")
                    : step === "hours"
                      ? t("editAgent.placeholderHours")
                      : t("editAgent.placeholderRules")
                }
                autoFocus
              />
            </ITFlex>
            <button type="button" className={primaryChip} style={primaryStyle} disabled={!draft.trim()} onClick={submitDraft}>
              {t("editAgent.save")}
            </button>
          </ITFlex>
        )}
      </div>
    </ITFlex>
  );
}
