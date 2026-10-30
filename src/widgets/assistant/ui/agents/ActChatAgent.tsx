import { useEffect, useMemo, useRef, useState } from "react";
import { ITDatePicker, ITFlex, ITLoader, ITSearchSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { LuRotateCcw } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { emitAppEvent } from "@shared/lib/appEvents";
import { LangostinAvatar } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import OptionChip from "@shared/ui/option-chip/OptionChip";
import { personalApi, type DisciplinaryReason } from "@entities/hr";
import { usersApi, personLabel, type User } from "@entities/user";

interface Props {
  /** Cierra el panel al terminar. */
  onDone: () => void;
}

const REASONS: DisciplinaryReason[] = ["ABSENCE", "TARDINESS", "INTOXICATION", "MISCONDUCT", "NONCOMPLIANCE", "OTHER"];

type Step = "employee" | "reason" | "date" | "description" | "sanction" | "done";

const STEPS: Step[] = ["employee", "reason", "date", "description", "sanction"];

type Message = { id: number; from: "agent" | "user"; text: string };

/** Fecha local en formato yyyy-mm-dd (sin correr a UTC). */
const today = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

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
 * Alta de **acta administrativa dentro del panel**: pregunta a quién, el motivo,
 * la fecha, los hechos y la sanción, y la levanta al final (con loader y
 * confirmación). No usa modal: aquí no hay formulario aparte.
 */
export default function ActChatAgent({ onDone }: Props) {
  const { t } = useTranslation(["disciplinary-reports", "common"]);
  const userName = useSelector((s: RootState) => s.auth.user?.name ?? "");
  const [step, setStep] = useState<Step>("employee");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [people, setPeople] = useState<User[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState<DisciplinaryReason | "">("");
  const [incidentDate, setIncidentDate] = useState(today());
  const [description, setDescription] = useState("");
  const [sanction, setSanction] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [sanctionDraft, setSanctionDraft] = useState("");
  const [sendState, setSendState] = useState<"idle" | "work" | "ok" | "err">("idle");
  const seq = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const push = (message: Omit<Message, "id">) => {
    seq.current += 1;
    setMessages((prev) => [...prev, { ...message, id: seq.current }]);
  };

  const ask = (text: string, delay = 350) => {
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        push({ from: "agent", text });
        setTyping(false);
      }, delay),
    );
  };

  // Personas para el primer paso.
  useEffect(() => {
    usersApi
      .employees()
      .then(setPeople)
      .catch(() => setPeople([]))
      .finally(() => setLoadingPeople(false));
  }, []);

  useEffect(() => {
    ask(t("form.agent.greeting"), 200);
    timers.current.push(window.setTimeout(() => ask(t("form.agent.askEmployee"), 650), 0));
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    // Solo al montar: el saludo no se repite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll del hilo.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, typing, sendState]);

  const employeeOptions = useMemo(
    () => people.map((p) => ({ value: p.id, label: personLabel(p) })),
    [people],
  );

  const save = async () => {
    setSendState("work");
    const startedAt = Date.now();
    try {
      await personalApi.createDisciplinaryReport({
        userId,
        reason: reason as DisciplinaryReason,
        incidentDate,
        description: description.trim(),
        sanction: sanction.trim() || undefined,
      });
      // Loader mínimo para que se vea que está levantando el acta.
      const wait = Math.max(0, 700 - (Date.now() - startedAt));
      window.setTimeout(() => {
        setSendState("ok");
        emitAppEvent("disciplinary:created", {});
        window.setTimeout(onDone, 1400);
      }, wait);
    } catch {
      setSendState("err");
      window.setTimeout(() => setSendState("idle"), 2500);
    }
  };

  const goNext = (next: Step, question: string, delay = 450) => {
    setStep(next);
    ask(question, delay);
  };

  const pickEmployee = (id: string, label: string) => {
    push({ from: "user", text: label });
    setUserId(id);
    goNext("reason", t("form.agent.askReason"));
  };

  const pickReason = (value: DisciplinaryReason) => {
    push({ from: "user", text: t(`reasons.${value}`) });
    setReason(value);
    goNext("date", t("form.agent.askDate"));
  };

  const sendDescription = () => {
    const value = descriptionDraft.trim();
    if (value.length < 10) return;
    push({ from: "user", text: value });
    setDescription(value);
    setDescriptionDraft("");
    goNext("sanction", t("form.agent.askSanction"));
  };

  const sendSanction = (raw?: string) => {
    const value = (raw ?? sanctionDraft).trim();
    push({ from: "user", text: value || t("form.agent.noSanction") });
    setSanction(value);
    setSanctionDraft("");
    setStep("done");
    ask(t("form.agent.closing"), 400);
    window.setTimeout(() => void save(), 700);
  };

  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    setMessages([]);
    setStep("employee");
    setUserId("");
    setReason("");
    setIncidentDate(today());
    setDescription("");
    setSanction("");
    setDescriptionDraft("");
    setSanctionDraft("");
    setSendState("idle");
    ask(t("form.agent.greeting"), 200);
    ask(t("form.agent.askEmployee"), 650);
  };

  const stepNumber = Math.min(STEPS.indexOf(step) + 1, STEPS.length);
  const lastAgentId = [...messages].reverse().find((m) => m.from === "agent")?.id ?? -1;

  const renderOptions = () => {
    switch (step) {
      case "employee":
        return (
          <ITSearchSelect
            name="actEmployee"
            placeholder={t("form.agent.searchEmployee")}
            options={employeeOptions}
            isLoading={loadingPeople}
            onChange={(value) => {
              const person = people.find((p) => p.id === String(value));
              if (person) pickEmployee(person.id, personLabel(person));
            }}
          />
        );
      case "reason":
        return (
          <ITFlex wrap="wrap" gap={1.5}>
            {REASONS.map((value) => (
              <OptionChip key={value} emoji="📌" label={t(`reasons.${value}`)} onClick={() => pickReason(value)} />
            ))}
          </ITFlex>
        );
      case "date":
        return (
          <ITFlex direction="column" gap={2}>
            <ITDatePicker
              name="actIncidentDate"
              value={new Date(`${incidentDate}T12:00:00`)}
              onChange={(event) => {
                const value = event.target.value;
                if (value instanceof Date) {
                  const d = new Date(value);
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  setIncidentDate(d.toISOString().slice(0, 10));
                }
              }}
            />
            <ITFlex justify="end">
              <button type="button" className={primaryChip} style={primaryStyle} onClick={() => {
                push({ from: "user", text: incidentDate.split("-").reverse().join("/") });
                goNext("description", t("form.agent.askDescription"));
              }}>
                {t("form.agent.continue")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      case "description":
        return (
          <ITFlex direction="column" gap={2}>
            <ITTextarea
              name="actDescription"
              value={descriptionDraft}
              onChange={setDescriptionDraft}
              rows={3}
              placeholder={t("form.descriptionHint")}
            />
            <ITFlex justify="end">
              <button
                type="button"
                className={primaryChip}
                style={primaryStyle}
                disabled={descriptionDraft.trim().length < 10}
                onClick={sendDescription}
              >
                {t("form.agent.continue")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      case "sanction":
        return (
          <ITFlex direction="column" gap={2}>
            <ITTextarea
              name="actSanction"
              value={sanctionDraft}
              onChange={setSanctionDraft}
              rows={2}
              placeholder={t("form.sanctionHint")}
            />
            <ITFlex justify="end" gap={2}>
              <button type="button" className={primaryChip} style={secondaryStyle} onClick={() => sendSanction("")}>
                {t("form.agent.noSanction")}
              </button>
              <button
                type="button"
                className={primaryChip}
                style={primaryStyle}
                disabled={!sanctionDraft.trim()}
                onClick={() => sendSanction()}
              >
                {t("form.agent.continue")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      default:
        return null;
    }
  };

  return (
    <ITFlex direction="column" className="relative h-full min-h-0">
      <ITFlex align="center" gap={2} className="shrink-0 border-b border-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-2">
        <ITText className="rounded-full bg-[color-mix(in_srgb,currentColor_6%,transparent)] px-2 py-0.5 !text-[11px] font-bold">
          {t("form.agent.progress", { current: stepNumber, total: STEPS.length })}
        </ITText>
        <ITText muted className="min-w-0 flex-1 truncate !text-[12px]">
          {t(`form.agent.step.${step === "done" ? "done" : step}`)}
        </ITText>
        <button
          type="button"
          onClick={restart}
          title={t("form.agent.restart")}
          aria-label={t("form.agent.restart")}
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
              <ITText className="!text-[14px] font-bold">{t("form.agent.saving")}</ITText>
              <ITLoader variant="dots" size="md" color="primary" />
            </>
          )}
          {sendState === "ok" && (
            <ITText className="ticket-sent-check !text-[15px] font-bold text-[color:var(--color-success)]">
              {t("form.agent.savedOk")}
            </ITText>
          )}
          {sendState === "err" && (
            <ITText className="!text-[13px] font-semibold text-[color:var(--color-danger)]">
              {t("form.agent.saveError")}
            </ITText>
          )}
        </div>
      )}

      {!typing && step !== "done" && (
        <div className="shrink-0 border-t border-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-3">
          {renderOptions()}
        </div>
      )}
    </ITFlex>
  );
}
