import { FileTypeEnum, ITDropfile, ITGrid, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { FaArrowLeft, FaRedo } from "react-icons/fa";
import { LangostinAvatar, type LangostinAnim } from "@shared/ui/langostin";
import OptionChip from "@shared/ui/option-chip/OptionChip";
import type { RootState } from "@app/store";
import type { TicketCategory } from "@entities/ticket";
import { usersApi, personLabel, type User } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import type { TicketDraft } from "../model/useCreateTicket";
import { PRIORITIES, SYMPTOM_KEYS } from "../model/constants";
import { useTicketAgent, type AgentStep } from "../model/useTicketAgent";
import TicketSummaryPanel from "./TicketSummaryPanel";
import {
  areaStyle,
  CATEGORY_STYLES,
  DEFAULT_CATEGORY_STYLE,
  PRIORITY_STYLES,
  SYMPTOM_STYLES,
} from "./optionStyles";

interface Props {
  form: TicketDraft;
  onComplete: () => Promise<boolean>;
  categories: TicketCategory[];
  files: File[];
  onFieldChange: (field: keyof TicketDraft, value: string) => void;
  onAddFile: (file: File) => void;
  onRemoveFile: (index: number) => void;
}

// Qué hace Langostin en cada paso: señala las opciones, piensa al escribir la nota.
const STEP_ANIM: Record<AgentStep, LangostinAnim> = {
  category: "point",
  detail: "point",
  where: "point",
  urgency: "point",
  evidence: "idle",
  notes: "think",
  requester: "point",
  done: "idle",
};

const skipStyle = { emoji: "⏭️" };

const secondaryButton =
  "cursor-pointer rounded-full border border-slate-200 bg-[var(--it-card-bg)] px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95";

const primaryButton =
  "cursor-pointer rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";

export default function TicketAgent({
  form,
  onComplete,
  categories,
  files,
  onFieldChange,
  onAddFile,
  onRemoveFile,
}: Props) {
  const { t } = useTranslation("tickets");
  const fullName = useSelector((s: RootState) => s.auth.user?.name);
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  // Solo el ADMIN puede levantar un ticket en nombre de otra persona.
  const isAdmin = useSelector(
    (s: RootState) => s.auth.user?.role === "ADMIN" || (s.auth.user?.roles ?? []).includes("ADMIN")
  );
  const agent = useTicketAgent({
    files,
    onFieldChange,
    onAddFile,
    onRemoveFile,
    userName: fullName?.split(" ")[0],
    canCaptureForOthers: isAdmin,
  });
  const [notesDraft, setNotesDraft] = useState("");
  const [people, setPeople] = useState<User[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  // Envío: "work" mientras se crea el ticket, luego "ok" o "err".
  const [sendAnim, setSendAnim] = useState<LangostinAnim | null>(null);
  // Reacción breve a cada respuesta del usuario (y el saludo inicial).
  const [reaction, setReaction] = useState<LangostinAnim | null>("wave");

  // Personas para el caso "me lo pidió otra persona".
  useEffect(() => {
    if (!isAdmin) return;
    usersApi
      .employees()
      .then((list) => setPeople(list.filter((p) => p.id !== userId)))
      .catch(() => setPeople([]));
  }, [isAdmin, userId]);

  // El chat se desplaza a sí mismo; con scrollIntoView la página entera se
  // movía cada vez que Langostín preguntaba algo.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [agent.messages.length, agent.typing, agent.step, sendAnim]);

  // Al terminar la conversación el ticket se envía solo. "sent" evita dobles
  // envíos; se rearma al empezar de nuevo.
  useEffect(() => {
    if (agent.step !== "done") {
      sent.current = false;
      return;
    }
    if (sent.current) return;
    sent.current = true;
    setSendAnim("work");
    onComplete().then((ok) => {
      setSendAnim(ok ? "ok" : "err");
      if (!ok) window.setTimeout(() => setSendAnim(null), 3000);
    });
  }, [agent.step, onComplete]);

  // Saludo: "wave" unos segundos al entrar.
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
    sendAnim ?? reaction ?? (agent.typing ? "think" : STEP_ANIM[agent.step]);

  // El bloque de opciones aparece cuando Langostin termina de preguntar.
  const showBlock =
    !agent.typing && (agent.step === "done" || sendAnim === null);
  const isOptionStep = agent.step !== "done";

  // Texto de guía del paso actual: Langostin le dice al usuario qué sigue.
  const guideKey = sendAnim === "err" ? "error" : sendAnim === "ok" ? "sent" : agent.step;
  const stepNumber = Math.min(agent.completed + 1, agent.steps.length);

  const suggestionsLabel = (key: (typeof SYMPTOM_KEYS)[number]) => t(`new.suggestions.${key}`);
  const urgencyAnswered = agent.completed > agent.steps.indexOf("urgency");
  const priorityLabel = urgencyAnswered ? dyn(t)(`priorityLabels.${form.priority}`) : "";

  // Mensajes del agente agrupados por turno. Langostin se ve en el turno activo
  // (animada, en el bloque de opciones) y en el anterior (avatar estático).
  const groupOf: number[] = [];
  let lastGroup = -1;
  agent.messages.forEach((m, i) => {
    if (m.from !== "agent") return;
    if (agent.messages[i - 1]?.from !== "agent") lastGroup += 1;
    groupOf[i] = lastGroup;
  });

  const renderOptions = () => {
    switch (agent.step) {
      case "category":
        return (
          <div className="flex flex-wrap gap-2">
            {categories.length === 0 && (
              <span className="text-xs text-slate-400">{t("new.agent.loadingCategories")}</span>
            )}
            {categories.map((c, i) => {
              const style = CATEGORY_STYLES[c.name] ?? DEFAULT_CATEGORY_STYLE;
              return (
                <OptionChip
                  key={c.id}
                  emoji={style.emoji}
                  label={c.name}
                  delay={i * 60}
                  onClick={() => agent.pickCategory(c)}
                />
              );
            })}
          </div>
        );
      case "detail":
        return (
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_KEYS.map((key, i) => (
              <OptionChip
                key={key}
                emoji={SYMPTOM_STYLES[key].emoji}
                label={suggestionsLabel(key)}
                delay={i * 40}
                onClick={() => agent.pickSymptom(suggestionsLabel(key))}
              />
            ))}
          </div>
        );
      case "where":
        return (
          <div className="flex flex-wrap gap-2">
            {agent.departments.length === 0 && (
              <span className="text-xs text-slate-400">{t("new.agent.noDepartments")}</span>
            )}
            {agent.departments.map((d, i) => (
              <OptionChip
                key={d.id}
                emoji={areaStyle().emoji}
                label={d.name}
                delay={i * 50}
                onClick={() => agent.pickDepartment(d)}
              />
            ))}
            <OptionChip emoji={skipStyle.emoji} label={t("new.agent.skip")} onClick={agent.skipDepartment} />
          </div>
        );
      case "urgency":
        return (
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p, i) => (
              <OptionChip
                key={p.value}
                emoji={PRIORITY_STYLES[p.value].emoji}
                label={dyn(t)(`priorityLabels.${p.value}`)}
                delay={i * 60}
                onClick={() => agent.pickPriority(p.value)}
              />
            ))}
          </div>
        );
      case "evidence":
        return (
          <div className="flex flex-col gap-3">
            <ITDropfile
              key={agent.dropfileKey}
              onFileSelect={() => {}}
              onSubmit={agent.attachFile}
              acceptedFileTypes={[
                FileTypeEnum.PNG,
                FileTypeEnum.JPG,
                FileTypeEnum.JPEG,
                FileTypeEnum.PDF,
              ]}
              showStatusBadge
              containerClassName="!mt-0"
            />
            <div className="flex justify-end">
              <button type="button" onClick={agent.finishEvidence} className={primaryButton}>
                {files.length > 0 ? t("new.agent.continue") : t("new.agent.noEvidence")}
              </button>
            </div>
          </div>
        );
      case "notes":
        return (
          <div className="flex flex-col gap-3">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t("new.agent.notesPlaceholder")}
              aria-label={t("new.agent.notesPlaceholder")}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButton} onClick={() => agent.sendNotes("")}>
                {t("new.agent.noNotes")}
              </button>
              <button
                type="button"
                className={primaryButton}
                disabled={!notesDraft.trim()}
                onClick={() => agent.sendNotes(notesDraft)}
              >
                {t("new.agent.sendNote")}
              </button>
            </div>
          </div>
        );
      case "requester":
        if (agent.forOthers) {
          return (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500">{t("new.agent.whoRequested")}</p>
              <ITSearchSelect
                name="requester"
                placeholder={t("new.agent.searchPerson")}
                options={people.map((p) => ({
                  value: p.id,
                  label: personLabel(p),
                }))}
                onChange={(value) => {
                  const id = String(value);
                  const person = people.find((p) => p.id === id);
                  agent.pickRequester(id, person?.name ?? id);
                }}
                className="w-full"
              />
            </div>
          );
        }
        return (
          <div className="flex flex-wrap gap-2">
            <OptionChip emoji="🙋" label={t("new.agent.forMe")} onClick={agent.keepAsMine} />
            <OptionChip emoji="📞" label={t("new.agent.forOther")} onClick={agent.askWhoRequested} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ITGrid container columns={12} spacing={6}>
      <ITGrid item xs={12} lg={7}>
        <section className="flex h-[min(72vh,680px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[var(--it-card-bg)] shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <LangostinAvatar anim="idle" size={36} animated={false} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">{t("new.agent.name")}</span>
                <span className="text-[11px] text-slate-400">{t("new.agent.helper")}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  {t("new.agent.online")}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSendAnim(null);
                setReaction(null);
                agent.restart();
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <FaRedo size={10} />
              {t("new.agent.restart")}
            </button>
          </header>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-5 py-5">
            {agent.messages.map((m, i) => {
              const isAgent = m.from === "agent";
              return (
                <div
                  key={m.id}
                  className={`agent-bubble flex items-end gap-2 ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  {isAgent &&
                    (groupOf[i] === lastGroup - 1 &&
                    agent.messages[i - 1]?.from !== "agent" ? (
                      <LangostinAvatar anim="idle" animated={false} />
                    ) : (
                      <span className="w-9 shrink-0" aria-hidden />
                    ))}
                  <p
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                      m.from === "user"
                        ? "rounded-br-md bg-slate-900 text-white"
                        : "rounded-bl-md border border-slate-200 bg-[var(--it-card-bg)] text-slate-800"
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              );
            })}

            {agent.typing && (
              <div className="agent-bubble flex items-end gap-2">
                <LangostinAvatar anim="think" />
                <span className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-[var(--it-card-bg)] px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                  <span className="sr-only">{t("new.agent.typing")}</span>
                </span>
              </div>
            )}

            {showBlock && (
              <div className="agent-bubble flex items-end gap-2">
                <LangostinAvatar anim={mascot} />
                <div className="flex max-w-[92%] flex-col gap-3 rounded-2xl rounded-bl-md border border-slate-200 bg-[var(--it-card-bg)] p-4 shadow-sm">
                  <p key={guideKey} className="agent-pop flex items-center gap-2 text-xs text-slate-500">
                    {isOptionStep && sendAnim === null && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                        {t("new.guide.step", { current: stepNumber, total: agent.steps.length })}
                      </span>
                    )}
                    <span>{t(`new.guide.${guideKey}`)}</span>
                  </p>
                  {isOptionStep && sendAnim === null && renderOptions()}
                  {isOptionStep && sendAnim === null && agent.canGoBack && (
                    <button
                      type="button"
                      onClick={agent.goBack}
                      className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-900"
                    >
                      <FaArrowLeft size={10} />
                      {t("new.agent.back")}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>
      </ITGrid>

      <ITGrid item xs={12} lg={5}>
        <TicketSummaryPanel
          title={form.title}
          categoryName={agent.categoryName}
          detail={agent.detail}
          where={agent.departmentName}
          urgency={priorityLabel}
          notes={agent.notes}
          fileCount={files.length}
          completed={agent.completed}
          total={agent.steps.length}
          requester={people.find((p) => p.id === form.onBehalfOfId)?.name ?? ""}
        />
      </ITGrid>
    </ITGrid>
  );
}
