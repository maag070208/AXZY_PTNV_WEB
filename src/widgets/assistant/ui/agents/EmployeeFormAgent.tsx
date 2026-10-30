import { useEffect, useRef, useState } from "react";
import { ITFlex, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { LuRotateCcw } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { emitAppEvent, onAppEvent } from "@shared/lib/appEvents";
import { LangostinAvatar } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import OptionChip from "@shared/ui/option-chip/OptionChip";

interface Props {
  /** Cierra el panel al terminar. */
  onDone: () => void;
}

/** Claves de i18n del formulario (tipadas para `t()`). */
type FillKey =
  | "bot.fill.askWhat"
  | "bot.fill.groupName"
  | "bot.fill.groupWork"
  | "bot.fill.groupContact"
  | "bot.fill.groupFiscal"
  | "bot.fill.name"
  | "bot.fill.nameHint"
  | "bot.fill.paternal"
  | "bot.fill.maternal"
  | "bot.fill.surnameHint"
  | "bot.fill.position"
  | "bot.fill.positionHint"
  | "bot.fill.employeeNumber"
  | "bot.fill.numberHint"
  | "bot.fill.phone"
  | "bot.fill.phoneHint"
  | "bot.fill.email"
  | "bot.fill.emailHint"
  | "bot.fill.rfc"
  | "bot.fill.rfcHint"
  | "bot.fill.curp"
  | "bot.fill.curpHint"
  | "bot.fill.nss"
  | "bot.fill.nssHint";

interface Field {
  /** Campo del formulario que llena (coincide con `FormState`). */
  field: string;
  questionKey: FillKey;
  placeholderKey: FillKey;
  optional?: boolean;
}

interface Group {
  id: string;
  labelKey: FillKey;
  fields: Field[];
}

/** Qué se puede editar con el bot, agrupado como en el formulario. */
const GROUPS: Group[] = [
  {
    id: "name",
    labelKey: "bot.fill.groupName",
    fields: [
      { field: "name", questionKey: "bot.fill.name", placeholderKey: "bot.fill.nameHint" },
      { field: "paternalSurname", questionKey: "bot.fill.paternal", placeholderKey: "bot.fill.surnameHint" },
      { field: "maternalSurname", questionKey: "bot.fill.maternal", placeholderKey: "bot.fill.surnameHint", optional: true },
    ],
  },
  {
    id: "work",
    labelKey: "bot.fill.groupWork",
    fields: [
      { field: "jobTitle", questionKey: "bot.fill.position", placeholderKey: "bot.fill.positionHint", optional: true },
      { field: "employeeNumber", questionKey: "bot.fill.employeeNumber", placeholderKey: "bot.fill.numberHint", optional: true },
    ],
  },
  {
    id: "contact",
    labelKey: "bot.fill.groupContact",
    fields: [
      { field: "personalPhone", questionKey: "bot.fill.phone", placeholderKey: "bot.fill.phoneHint", optional: true },
      { field: "email", questionKey: "bot.fill.email", placeholderKey: "bot.fill.emailHint", optional: true },
    ],
  },
  {
    id: "fiscal",
    labelKey: "bot.fill.groupFiscal",
    fields: [
      { field: "rfc", questionKey: "bot.fill.rfc", placeholderKey: "bot.fill.rfcHint", optional: true },
      { field: "curp", questionKey: "bot.fill.curp", placeholderKey: "bot.fill.curpHint", optional: true },
      { field: "nss", questionKey: "bot.fill.nss", placeholderKey: "bot.fill.nssHint", optional: true },
    ],
  },
];

type Message = { id: number; from: "agent" | "user"; text: string };

/**
 * El bot edita la persona **en vivo**: primero pregunta qué se quiere editar,
 * luego hace las preguntas de ese grupo una por una y cada respuesta se escribe
 * en el formulario de la pantalla, que **se guarda solo** (`employee:fill` →
 * autoguardado → `employee:saved`).
 */
export default function EmployeeFormAgent({ onDone }: Props) {
  const { t } = useTranslation("employees");
  const userName = useSelector((s: RootState) => s.auth.user?.name ?? "");
  const [group, setGroup] = useState<Group | null>(null);
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [filled, setFilled] = useState(0);
  const [saveError, setSaveError] = useState(false);
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

  // El autoguardado de la pantalla avisa si salió bien: se lo decimos a la persona.
  useEffect(
    () =>
      onAppEvent("employee:saved", ({ ok }) => {
        setSaveError(!ok);
        push({ from: "agent", text: ok ? t("bot.fill.saved") : t("bot.fill.saveFailed") });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    ask(t("bot.fill.greeting"), 200);
    timers.current.push(window.setTimeout(() => ask(t("bot.fill.askWhat"), 700), 0));
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
  }, [messages.length, typing]);

  const field = group?.fields[index] ?? null;

  const pickGroup = (chosen: Group) => {
    push({ from: "user", text: t(chosen.labelKey) });
    setGroup(chosen);
    setIndex(0);
    ask(t(chosen.fields[0].questionKey), 450);
  };

  const answer = (raw?: string) => {
    if (!group || !field) return;
    const value = (raw ?? draft).trim();
    push({ from: "user", text: value || t("bot.fill.skip") });
    if (value) {
      // Se escribe en el formulario de la pantalla; la página lo guarda sola.
      emitAppEvent("employee:fill", { field: field.field, value });
      setFilled((n) => n + 1);
    }
    setDraft("");
    const next = index + 1;
    setIndex(next);
    if (group.fields[next]) {
      ask(t(group.fields[next].questionKey), 500);
    } else {
      ask(t("bot.fill.finished", { count: filled + (value ? 1 : 0) }), 500);
      window.setTimeout(onDone, 2200);
    }
  };

  const restart = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    setMessages([]);
    setGroup(null);
    setIndex(0);
    setDraft("");
    setFilled(0);
    setSaveError(false);
    ask(t("bot.fill.greeting"), 200);
    ask(t("bot.fill.askWhat"), 700);
  };

  const lastAgentId = [...messages].reverse().find((m) => m.from === "agent")?.id ?? -1;

  return (
    <ITFlex direction="column" className="h-full min-h-0">
      {/* Progreso */}
      <ITFlex align="center" gap={2} className="shrink-0 border-b border-slate-200/70 px-4 py-2">
        <ITText className="rounded-full bg-[color-mix(in_srgb,currentColor_6%,transparent)] px-2 py-0.5 !text-[11px] font-bold">
          {group
            ? t("bot.fill.progress", { current: Math.min(index + 1, group.fields.length), total: group.fields.length })
            : t("bot.fill.choose")}
        </ITText>
        <ITText muted className="min-w-0 flex-1 truncate !text-[12px]">
          {field ? t(field.questionKey) : group ? t("bot.fill.finishedShort") : t("bot.fill.askWhat")}
        </ITText>
        <button
          type="button"
          onClick={restart}
          title={t("bot.fill.restart")}
          aria-label={t("bot.fill.restart")}
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

      {/* Qué editar (chips) */}
      {!typing && !group && (
        <div className="shrink-0   px-4 py-3">
          <ITFlex wrap="wrap" gap={1.5}>
            {GROUPS.map((g) => (
              <OptionChip key={g.id} emoji="✏️" label={t(g.labelKey)} onClick={() => pickGroup(g)} />
            ))}
          </ITFlex>
        </div>
      )}

      {/* Respuesta del campo actual */}
      {!typing && field && (
        <div className="shrink-0   px-4 py-3">
          <ITTextarea
            name={`fill-${field.field}`}
            value={draft}
            onChange={setDraft}
            rows={2}
            placeholder={t(field.placeholderKey)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (field.optional || draft.trim()) answer();
              }
            }}
          />
          <ITFlex justify="end" gap={2} className="mt-2">
            {field.optional && (
              <button
                type="button"
                onClick={() => answer("")}
                className="cursor-pointer rounded-full px-4 py-2 text-[12.5px] font-semibold transition hover:brightness-95"
                style={{
                  backgroundColor: "var(--it-bento-control-bg, var(--color-slate-100))",
                  color: "var(--it-bento-control-text, var(--color-slate-600))",
                }}
              >
                {t("bot.fill.skip")}
              </button>
            )}
            <button
              type="button"
              disabled={!field.optional && !draft.trim()}
              onClick={() => answer()}
              className="cursor-pointer rounded-full px-4 py-2 text-[12.5px] font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: "var(--it-bento-ink-bg, var(--color-primary))",
                color: "var(--it-bento-ink-text, #ffffff)",
              }}
            >
              {t("bot.fill.next")}
            </button>
          </ITFlex>
          {saveError && (
            <ITText className="mt-2 !text-[11.5px] font-semibold text-[color:var(--color-danger)]">
              {t("bot.fill.saveFailed")}
            </ITText>
          )}
        </div>
      )}
    </ITFlex>
  );
}
