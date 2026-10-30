import { useEffect, useRef, useState } from "react";
import {
  FileTypeEnum,
  ITDropfile,
  ITFlex,
  ITLoader,
  ITSearchSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { LuRotateCcw } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { dyn } from "@shared/i18n/dyn";
import { emitAppEvent } from "@shared/lib/appEvents";
import { LangostinAvatar } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import OptionChip from "@shared/ui/option-chip/OptionChip";
import { usersApi, personLabel, type User } from "@entities/user";
import { useCreateTicket } from "@features/ticket/create-ticket";
import { PRIORITIES, SYMPTOM_KEYS } from "@features/ticket/create-ticket/model/constants";
import { useTicketAgent } from "@features/ticket/create-ticket/model/useTicketAgent";
import {
  areaStyle,
  categoryStyle,
  PRIORITY_STYLES,
  SYMPTOM_STYLES,
} from "@features/ticket/create-ticket/ui/optionStyles";

interface Props {
  /** Se llama cuando el ticket ya se creó. */
  onDone: () => void;
}

/** Botones del panel: píldoras del kit, sin clases sueltas de color. */
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
 * Alta de ticket **hecha para el panel de Langostín**: una sola columna que se
 * adapta al alto disponible (nada de alturas fijas ni de rejilla de página),
 * con el hilo del chat desplazándose solo en cada pregunta.
 */
export default function TicketChatAgent({ onDone }: Props) {
  const { t } = useTranslation("tickets");
  const fullName = useSelector((s: RootState) => s.auth.user?.name);
  const userName = fullName ?? "";
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const isAdmin = useSelector(
    (s: RootState) => s.auth.user?.role === "ADMIN" || (s.auth.user?.roles ?? []).includes("ADMIN"),
  );

  const draft = useCreateTicket();
  const agent = useTicketAgent({
    files: draft.files,
    onFieldChange: draft.handleField,
    onAddFile: draft.addFile,
    onRemoveFile: draft.removeFile,
    userName: fullName?.split(" ")[0],
    canCaptureForOthers: isAdmin,
  });

  const [notesDraft, setNotesDraft] = useState("");
  const [people, setPeople] = useState<User[]>([]);
  const [sendState, setSendState] = useState<"idle" | "work" | "ok" | "err">("idle");
  const threadRef = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  // Personas para el caso "me lo pidió otra persona" (solo ADMIN).
  useEffect(() => {
    if (!isAdmin) return;
    usersApi
      .employees()
      .then((list) => setPeople(list.filter((p) => p.id !== userId)))
      .catch(() => setPeople([]));
  }, [isAdmin, userId]);

  // Auto-scroll: el hilo baja solo cuando Langostín pregunta o contesta.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [agent.messages.length, agent.typing, agent.step, sendState]);

  // Al terminar la conversación el ticket se envía solo (una sola vez).
  useEffect(() => {
    if (agent.step !== "done") {
      sent.current = false;
      return;
    }
    if (sent.current) return;
    sent.current = true;
    setSendState("work");
    // El loader se queda un mínimo en pantalla: si el alta tarda 200 ms, igual
    // se alcanza a ver que el ticket se está enviando.
    const startedAt = Date.now();
    draft.handleSave().then((ok) => {
      const wait = Math.max(0, 700 - (Date.now() - startedAt));
      window.setTimeout(() => {
        setSendState(ok ? "ok" : "err");
        if (ok) {
          // La lista de tickets recarga y anima la fila nueva sin refrescar la página.
          emitAppEvent("ticket:created", {});
          window.setTimeout(onDone, 1400);
        }
        else window.setTimeout(() => setSendState("idle"), 2500);
      }, wait);
    });
  }, [agent.step, draft, onDone]);

  const stepNumber = Math.min(agent.completed + 1, agent.steps.length);
  const lastAgentId = [...agent.messages].reverse().find((m) => m.from === "agent")?.id ?? -1;
  const label = (key: (typeof SYMPTOM_KEYS)[number]) => t(`new.suggestions.${key}`);

  const renderOptions = () => {
    switch (agent.step) {
      case "category":
        return (
          <ITFlex wrap="wrap" gap={1.5}>
            {draft.categories.length === 0 && (
              <ITText as="span" muted className="!text-[12px]">
                {t("new.agent.loadingCategories")}
              </ITText>
            )}
            {draft.categories.map((c) => (
              <OptionChip
                key={c.id}
                emoji={categoryStyle(c.name).emoji}
                label={c.name}
                onClick={() => agent.pickCategory(c)}
              />
            ))}
          </ITFlex>
        );
      case "detail":
        return (
          <ITFlex wrap="wrap" gap={1.5}>
            {SYMPTOM_KEYS.map((key) => (
              <OptionChip
                key={key}
                emoji={SYMPTOM_STYLES[key].emoji}
                label={label(key)}
                onClick={() => agent.pickSymptom(label(key))}
              />
            ))}
          </ITFlex>
        );
      case "where":
        return (
          <ITFlex wrap="wrap" gap={1.5}>
            {agent.departments.map((d) => (
              <OptionChip
                key={d.id}
                emoji={areaStyle().emoji}
                label={d.name}
                onClick={() => agent.pickDepartment(d)}
              />
            ))}
            <OptionChip emoji="⏭️" label={t("new.agent.skip")} onClick={agent.skipDepartment} />
          </ITFlex>
        );
      case "urgency":
        return (
          <ITFlex wrap="wrap" gap={1.5}>
            {PRIORITIES.map((p) => (
              <OptionChip
                key={p.value}
                emoji={PRIORITY_STYLES[p.value].emoji}
                label={dyn(t)(`priorityLabels.${p.value}`)}
                onClick={() => agent.pickPriority(p.value)}
              />
            ))}
          </ITFlex>
        );
      case "evidence":
        return (
          <ITFlex direction="column" gap={2}>
            <ITDropfile
              key={agent.dropfileKey}
              onFileSelect={() => {}}
              onSubmit={agent.attachFile}
              acceptedFileTypes={[FileTypeEnum.PNG, FileTypeEnum.JPG, FileTypeEnum.JPEG, FileTypeEnum.PDF]}
              showStatusBadge
              containerClassName="!mt-0"
            />
            <ITFlex justify="end">
              <button type="button" onClick={agent.finishEvidence} className={primaryChip} style={primaryStyle}>
                {draft.files.length > 0 ? t("new.agent.continue") : t("new.agent.noEvidence")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      case "notes":
        return (
          <ITFlex direction="column" gap={2}>
            <ITTextarea
              name="agentNotes"
              value={notesDraft}
              onChange={setNotesDraft}
              maxLength={1000}
              rows={3}
              placeholder={t("new.agent.notesPlaceholder")}
            />
            <ITFlex justify="end" gap={2}>
              <button type="button" className={primaryChip} style={secondaryStyle} onClick={() => agent.sendNotes("")}>
                {t("new.agent.noNotes")}
              </button>
              <button
                type="button"
                className={primaryChip}
                style={primaryStyle}
                disabled={!notesDraft.trim()}
                onClick={() => agent.sendNotes(notesDraft)}
              >
                {t("new.agent.sendNote")}
              </button>
            </ITFlex>
          </ITFlex>
        );
      case "requester":
        return agent.forOthers ? (
          <ITSearchSelect
            name="requester"
            placeholder={t("new.agent.searchPerson")}
            options={people.map((p) => ({ value: p.id, label: personLabel(p) }))}
            onChange={(id: string | number) => {
              const person = people.find((p) => p.id === String(id));
              if (person) agent.pickRequester(person.id, personLabel(person));
            }}
            onSearch={() => {}}
          />
        ) : (
          <ITFlex wrap="wrap" gap={1.5}>
            <OptionChip emoji="🙋" label={t("new.agent.forMe")} onClick={agent.keepAsMine} />
            <OptionChip emoji="📞" label={t("new.agent.forOther")} onClick={agent.askWhoRequested} />
          </ITFlex>
        );
      case "done":
        return (
          <ITFlex align="center" gap={2}>
            <ITText muted className="!text-[12.5px]">
              {sendState === "err" ? t("new.agent.done") : t("new.agent.doneHint")}
            </ITText>
          </ITFlex>
        );
      default:
        return null;
    }
  };

  return (
    <ITFlex direction="column" className="relative h-full min-h-0">
      {/* Progreso del alta, compacto */}
      <ITFlex align="center" gap={2} className="shrink-0 border-b border-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-2">
        <ITText className="rounded-full bg-[color-mix(in_srgb,currentColor_6%,transparent)] px-2 py-0.5 !text-[11px] font-bold">
          {t("new.guide.step", { current: stepNumber, total: agent.steps.length })}
        </ITText>
        <ITText muted className="min-w-0 flex-1 truncate !text-[12px]">
          {agent.categoryName && agent.detail
            ? `${agent.categoryName}: ${agent.detail}`
            : t(`new.guide.${agent.step}`)}
        </ITText>
        <button
          type="button"
          onClick={() => {
            setNotesDraft("");
            agent.restart();
          }}
          title={t("new.agent.restart")}
          aria-label={t("new.agent.restart")}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
        >
          <LuRotateCcw size={13} />
        </button>
      </ITFlex>

      {/* Hilo del chat: crece y se desplaza solo */}
      <div
        ref={threadRef}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4"
        style={{ background: "color-mix(in srgb, var(--color-slate-500) 5%, transparent)" }}
      >
        {agent.messages.map((m) => {
          if (m.from === "agent") {
            // El avatar va sólo en la pregunta más reciente (y animado); las
            // anteriores dejan el hueco para que el hilo quede alineado.
            const latest = m.id === lastAgentId && !agent.typing;
            return (
              <ITFlex key={m.id} align="end" gap={1.5} className="agent-pop max-w-full self-start">
                {latest ? (
                  <LangostinAvatar anim={agent.typing ? "think" : "wave"} size={26} />
                ) : (
                  <ITText as="span" aria-hidden className="w-[38px] shrink-0" />
                )}
                <ITText
                  as="span"
                  className="w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-[var(--it-card-bg)] px-3.5 py-2 !text-[12.5px] leading-snug shadow-sm"
                >
                  {m.text}
                </ITText>
              </ITFlex>
            );
          }
          return (
            <ITFlex key={m.id} align="end" justify="end" gap={1.5} className="agent-pop max-w-full self-end">
              <ITText
                as="span"
                className="w-fit max-w-[78%] rounded-2xl rounded-br-md bg-[var(--it-bento-ink-bg,var(--color-primary))] px-3.5 py-2 !text-[12.5px] font-semibold leading-snug text-[var(--it-bento-ink-text,#fff)]"
              >
                {m.text}
              </ITText>
              <ProfileAvatar name={userName} size="xs" />
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

      {/* Envío: loader mientras se crea y “entró” con animación al terminar */}
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
              <ITText className="!text-[14px] font-bold">{t("new.agent.doneHint")}</ITText>
              <ITLoader variant="dots" size="md" color="primary" />
            </>
          )}
          {sendState === "ok" && (
            <ITText className="ticket-sent-check !text-[15px] font-bold text-[color:var(--color-success)]">
              {t("new.agent.sentOk")}
            </ITText>
          )}
          {sendState === "err" && (
            <ITText className="!text-[13px] font-semibold text-[color:var(--color-danger)]">
              {t("new.agent.done")}
            </ITText>
          )}
        </div>
      )}

      {/* Opciones del paso actual */}
      {!agent.typing && agent.step !== "done" && (
        <div className="shrink-0 border-t border-[color-mix(in_srgb,currentColor_7%,transparent)] px-4 py-3">
          {renderOptions()}
          {agent.canGoBack && (
            <ITFlex justify="start" className="mt-2">
              <button
                type="button"
                onClick={agent.goBack}
                className="cursor-pointer !text-[11.5px] font-semibold text-slate-500 transition hover:text-slate-700"
              >
                ← {t("new.agent.back")}
              </button>
            </ITFlex>
          )}
        </div>
      )}
    </ITFlex>
  );
}
