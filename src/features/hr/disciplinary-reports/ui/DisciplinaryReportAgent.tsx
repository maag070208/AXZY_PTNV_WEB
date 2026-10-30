import { useState } from "react";
import { ITButton, ITDatePicker, ITInput, ITSearchSelect, ITText, ITTextarea, ITFlex, ITStack } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { DisciplinaryReason } from "@entities/hr";
import { AgentBubble, LangostinChat, UserBubble } from "@shared/ui/langostin-chat";
import OptionChip from "@shared/ui/option-chip/OptionChip";
import { localToDateStr } from "../model/dateStr";
import { searchEmployees } from "../model/useDisciplinaryReports";

const REPORT_REASONS: DisciplinaryReason[] = [
  "ABSENCE",
  "TARDINESS",
  "INTOXICATION",
  "MISCONDUCT",
  "NONCOMPLIANCE",
  "OTHER",
];

export interface DisciplinaryReportInput {
  userId: string;
  reason: DisciplinaryReason;
  incidentDate: string;
  description: string;
  sanction?: string;
}

type Step = "who" | "reason" | "date" | "facts" | "witnesses" | "sanction" | "summary";

interface Props {
  saving: boolean;
  onSave: (input: DisciplinaryReportInput) => void;
  /** Salida al formulario clásico. */
  onUseForm: () => void;
}

interface Draft {
  userId: string;
  userName: string;
  reason: DisciplinaryReason | "";
  incidentDate: string;
  facts: string;
  witnesses: string;
  sanction: string;
}

const EMPTY: Draft = { userId: "", userName: "", reason: "", incidentDate: "", facts: "", witnesses: "", sanction: "" };

interface LogEntry {
  q: string;
  a: string;
}

const QUESTION = {
  who: "form.agent.qWho",
  reason: "form.agent.qReason",
  date: "form.agent.qDate",
  facts: "form.agent.qFacts",
  witnesses: "form.agent.qWitnesses",
  sanction: "form.agent.qSanction",
  summary: "form.agent.qSummary",
} as const;

/** Los testigos no tienen campo propio en el acta: viajan al final de la descripción. */
const composeDescription = (facts: string, witnesses: string, label: string) =>
  witnesses.trim() ? `${facts.trim()}\n\n${label}: ${witnesses.trim()}` : facts.trim();

/**
 * Langostín en el acta administrativa (L1): pregunta a quién, qué tipo de falta,
 * cuándo, los hechos, testigos y medida aplicada. Tono neutral y textos fijos.
 * Entrega al final el mismo `onSave` que el formulario clásico.
 */
export default function DisciplinaryReportAgent({ saving, onSave, onUseForm }: Props) {
  const { t, i18n } = useTranslation(["disciplinary-reports", "common"]);
  const [step, setStep] = useState<Step>("who");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<Array<{ step: Step; draft: Draft; log: LogEntry[] }>>([]);
  const [people, setPeople] = useState<Array<{ value: string; label: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");

  const go = (next: Step, answer: string, patch: Partial<Draft> = {}) => {
    setHistory((h) => [...h, { step, draft, log }]);
    setLog((l) => [...l, { q: t(QUESTION[step]), a: answer }]);
    setDraft((d) => ({ ...d, ...patch }));
    setText("");
    setStep(next);
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setStep(prev.step);
    setDraft(prev.draft);
    setLog(prev.log);
    setText("");
  };

  const restart = () => {
    setHistory([]);
    setLog([]);
    setDraft(EMPTY);
    setText("");
    setStep("who");
  };

  const handleSearch = async (query?: string) => {
    setBusy(true);
    try {
      const data = await searchEmployees(query);
      setPeople(
        data.map((u) => ({
          value: u.id,
          label: [u.name, u.employeeNumber ? `#${u.employeeNumber}` : null].filter(Boolean).join(" "),
        })),
      );
    } finally {
      setBusy(false);
    }
  };

  const dateLabel = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });
  const offsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return localToDateStr(d);
  };

  const chips = (list: Array<{ label: string; onClick: () => void }>) => (
    <div className="flex flex-wrap gap-2 pl-11">
      {list.map((c, i) => (
        <OptionChip key={c.label} label={c.label} delay={i * 40} onClick={c.onClick} />
      ))}
    </div>
  );

  const nextButton = (label: string, disabled: boolean, onClick: () => void) => (
    <ITButton variant="filled" color="primary" size="sm" disabled={disabled} onClick={onClick}>
      <ITText className="whitespace-nowrap text-[11px] font-bold">{label}</ITText>
    </ITButton>
  );

  const canSave = Boolean(draft.userId && draft.reason && draft.incidentDate && draft.facts.trim()) && !saving;
  const save = () => {
    if (!canSave || !draft.reason) return;
    onSave({
      userId: draft.userId,
      reason: draft.reason,
      incidentDate: draft.incidentDate,
      description: composeDescription(draft.facts, draft.witnesses, t("form.agent.witnessesLabel")),
      sanction: draft.sanction.trim() || undefined,
    });
  };

  const summaryLines = [
    t("form.agent.sumEmployee", { name: draft.userName }),
    draft.reason ? t("form.agent.sumReason", { reason: t(`reasons.${draft.reason}`) }) : null,
    draft.incidentDate ? t("form.agent.sumDate", { date: dateLabel(draft.incidentDate) }) : null,
    t("form.agent.sumFacts", { facts: draft.facts }),
    draft.witnesses ? t("form.agent.sumWitnesses", { witnesses: draft.witnesses }) : null,
    draft.sanction ? t("form.agent.sumSanction", { sanction: draft.sanction }) : null,
  ].filter((line): line is string => Boolean(line));

  const footer = (
    <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
      <ITButton variant="text" color="secondary" size="sm" onClick={back} disabled={history.length === 0 || saving}>
        <ITText className="text-[11px] font-bold">{t("form.agent.back")}</ITText>
      </ITButton>
      <ITFlex align="center" wrap="wrap" gap={2}>
        <ITButton variant="text" color="secondary" size="sm" onClick={onUseForm} disabled={saving}>
          <ITText className="text-[11px] font-bold">{t("form.agent.useForm")}</ITText>
        </ITButton>
        {step === "summary" && nextButton(saving ? t("form.saving") : t("form.agent.confirm"), !canSave, save)}
      </ITFlex>
    </ITFlex>
  );

  return (
    <LangostinChat
      title={t("form.agent.botName")}
      subtitle={t("form.agent.botSubtitle")}
      restartLabel={t("form.agent.restart")}
      onRestart={restart}
      height={400}
      footer={footer}
      className="motion-reduce:[&_.agent-bubble]:[animation:none] motion-reduce:[&_.agent-pop]:[animation:none]"
    >
      <AgentBubble text={t("form.agent.hello")} />
      {log.map((entry, i) => (
        <ITStack key={i} spacing={3}>
          <AgentBubble text={entry.q} />
          <UserBubble text={entry.a} />
        </ITStack>
      ))}
      {step === "summary" ? (
        <>
          <AgentBubble text={t(QUESTION.summary)} avatar />
          {summaryLines.map((line) => (
            <AgentBubble key={line} text={line} />
          ))}
          <AgentBubble text={t("form.agent.sumHint")} />
        </>
      ) : (
        <AgentBubble text={t(QUESTION[step])} avatar />
      )}

      {step === "who" && (
        <div className="pl-11">
          <ITSearchSelect
            name="reportAgentEmployee"
            placeholder={t("form.employeeHint")}
            options={people}
            onChange={(v) => {
              const id = String(v);
              const person = people.find((p) => p.value === id);
              go("reason", person?.label ?? id, { userId: id, userName: person?.label ?? id });
            }}
            onSearch={handleSearch}
            isLoading={busy}
          />
        </div>
      )}

      {step === "reason" &&
        chips(
          REPORT_REASONS.map((r) => ({
            label: t(`reasons.${r}`),
            onClick: () => go("date", t(`reasons.${r}`), { reason: r }),
          })),
        )}

      {step === "date" && (
        <>
          {chips([
            { label: t("form.agent.today"), onClick: () => go("facts", t("form.agent.today"), { incidentDate: offsetDate(0) }) },
            { label: t("form.agent.yesterday"), onClick: () => go("facts", t("form.agent.yesterday"), { incidentDate: offsetDate(-1) }) },
          ])}
          <div className="pl-11">
            <ITDatePicker
              name="reportAgentDate"
              label={t("form.agent.otherDate")}
              onChange={(event) => {
                const value = event.target.value;
                if (value instanceof Date) {
                  const iso = localToDateStr(value);
                  go("facts", dateLabel(iso), { incidentDate: iso });
                }
              }}
            />
          </div>
        </>
      )}

      {step === "facts" && (
        <div className="flex flex-col gap-2 pl-11">
          <ITTextarea
            name="reportAgentFacts"
            value={text}
            onChange={setText}
            rows={4}
            placeholder={t("form.descriptionHint")}
          />
          <ITFlex justify="end">
            {nextButton(t("form.agent.next"), !text.trim(), () => go("witnesses", text.trim(), { facts: text.trim() }))}
          </ITFlex>
        </div>
      )}

      {step === "witnesses" && (
        <>
          <div className="grid gap-2 pl-11 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <ITInput
              name="reportAgentWitnesses"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("form.agent.witnessesPlaceholder")}
            />
            {nextButton(t("form.agent.next"), !text.trim(), () => go("sanction", text.trim(), { witnesses: text.trim() }))}
          </div>
          {chips([{ label: t("form.agent.noWitnesses"), onClick: () => go("sanction", t("form.agent.noWitnesses"), { witnesses: "" }) }])}
        </>
      )}

      {step === "sanction" && (
        <>
          <div className="grid gap-2 pl-11 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <ITInput
              name="reportAgentSanction"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("form.sanctionHint")}
            />
            {nextButton(t("form.agent.next"), !text.trim(), () => go("summary", text.trim(), { sanction: text.trim() }))}
          </div>
          {chips([{ label: t("form.agent.noSanction"), onClick: () => go("summary", t("form.agent.noSanction"), { sanction: "" }) }])}
        </>
      )}
    </LangostinChat>
  );
}
