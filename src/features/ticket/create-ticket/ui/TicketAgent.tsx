import { FileTypeEnum, ITDropfile, ITGrid } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { FaRedo, FaTools } from "react-icons/fa";
import type { RootState } from "@app/store";
import type { TicketCategory } from "@entities/ticket";
import { dyn } from "@shared/i18n/dyn";
import type { TicketDraft } from "../model/useCreateTicket";
import { PRIORITIES, SYMPTOM_KEYS } from "../model/constants";
import { AGENT_STEPS, useTicketAgent } from "../model/useTicketAgent";
import OptionChip from "./OptionChip";
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
  onComplete: () => void;
  categories: TicketCategory[];
  files: File[];
  onFieldChange: (field: keyof TicketDraft, value: string) => void;
  onAddFile: (file: File) => void;
  onRemoveFile: (index: number) => void;
}

const skipStyle = { emoji: "⏭️" };

const secondaryButton =
  "cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95";

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
  const agent = useTicketAgent({
    files,
    onFieldChange,
    onAddFile,
    onRemoveFile,
    userName: fullName?.split(" ")[0],
  });
  const [notesDraft, setNotesDraft] = useState("");
  const threadEnd = useRef<HTMLDivElement>(null);
  const sent = useRef(false);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [agent.messages.length, agent.typing]);

  // Al terminar la conversación el ticket se envía solo. "sent" evita dobles
  // envíos; se rearma al empezar de nuevo.
  useEffect(() => {
    if (agent.step !== "done") {
      sent.current = false;
      return;
    }
    if (sent.current) return;
    sent.current = true;
    onComplete();
  }, [agent.step, onComplete]);

  const urgencyAnswered = agent.completed > AGENT_STEPS.indexOf("urgency");
  const priorityLabel = urgencyAnswered ? dyn(t)(`priorityLabels.${form.priority}`) : "";

  return (
    <ITGrid container columns={12} spacing={6}>
      <ITGrid item xs={12} lg={7}>
        <section className="flex h-[min(72vh,680px)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white"
              >
                <FaTools size={14} />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">{t("new.agent.name")}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  {t("new.agent.online")}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={agent.restart}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
            >
              <FaRedo size={10} />
              {t("new.agent.restart")}
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-5 py-5">
            {agent.messages.map((m) => (
              <div
                key={m.id}
                className={`agent-bubble flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    m.from === "user"
                      ? "rounded-br-md bg-slate-900 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            {agent.typing && (
              <div className="agent-bubble flex justify-start">
                <span className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
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
            <div ref={threadEnd} />
          </div>

          <div className="border-t border-slate-100 bg-white px-5 py-4">
            {agent.step === "category" && (
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
            )}

            {agent.step === "detail" && (
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_KEYS.map((key, i) => {
                  const style = SYMPTOM_STYLES[key];
                  return (
                    <OptionChip
                      key={key}
                      emoji={style.emoji}
                      label={t(`new.suggestions.${key}`)}
                      delay={i * 40}
                      onClick={() => agent.pickSymptom(t(`new.suggestions.${key}`))}
                    />
                  );
                })}
              </div>
            )}

            {agent.step === "where" && (
              <div className="flex flex-wrap gap-2">
                {agent.departments.length === 0 && (
                  <span className="text-xs text-slate-400">{t("new.agent.noDepartments")}</span>
                )}
                {agent.departments.map((d, i) => {
                  const style = areaStyle();
                  return (
                    <OptionChip
                      key={d.id}
                      emoji={style.emoji}
                      label={d.name}
                      delay={i * 50}
                      onClick={() => agent.pickDepartment(d)}
                    />
                  );
                })}
                <OptionChip
                  emoji={skipStyle.emoji}
                  label={t("new.agent.skip")}
                  onClick={agent.skipDepartment}
                />
              </div>
            )}

            {agent.step === "urgency" && (
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p, i) => {
                  const style = PRIORITY_STYLES[p.value];
                  return (
                    <OptionChip
                      key={p.value}
                      emoji={style.emoji}
                      label={dyn(t)(`priorityLabels.${p.value}`)}
                      delay={i * 60}
                      onClick={() => agent.pickPriority(p.value)}
                    />
                  );
                })}
              </div>
            )}

            {agent.step === "evidence" && (
              <div className="agent-pop flex flex-col gap-3">
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
            )}

            {agent.step === "notes" && (
              <div className="agent-pop flex flex-col gap-3">
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
            )}

            {agent.step === "done" && (
              <p className="agent-pop text-sm text-slate-500">{t("new.agent.doneHint")}</p>
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
          total={AGENT_STEPS.length}
        />
      </ITGrid>
    </ITGrid>
  );
}
