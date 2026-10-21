import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { departmentsApi, type Department } from "@entities/department";
import type { TicketCategory } from "@entities/ticket";
import { dyn } from "@shared/i18n/dyn";
import { MAX_TITLE_LENGTH } from "./constants";
import type { TicketDraft } from "./useCreateTicket";

export type AgentStep =
  | "category"
  | "detail"
  | "where"
  | "urgency"
  | "evidence"
  | "notes"
  | "done";

// Orden en que el agente pregunta. "done" no es un paso pendiente.
export const AGENT_STEPS: AgentStep[] = [
  "category",
  "detail",
  "where",
  "urgency",
  "evidence",
  "notes",
];

export interface AgentMessage {
  id: number;
  from: "agent" | "user";
  text: string;
}

interface Options {
  files: File[];
  onFieldChange: (field: keyof TicketDraft, value: string) => void;
  onAddFile: (file: File) => void;
  onRemoveFile: (index: number) => void;
  userName?: string;
}

const buildTitle = (categoryName: string, detail: string) =>
  [categoryName, detail].filter(Boolean).join(": ").slice(0, MAX_TITLE_LENGTH);

// Conversación guiada: el agente pregunta un dato a la vez con opciones que se
// tocan. Solo la nota final es texto libre. Los campos viven en el formulario de
// useCreateTicket; aquí está el avance del chat.
export const useTicketAgent = ({
  files,
  onFieldChange,
  onAddFile,
  onRemoveFile,
  userName,
}: Options) => {
  const { t } = useTranslation("tickets");
  const [step, setStep] = useState<AgentStep>("category");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [detail, setDetail] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [notes, setNotes] = useState("");
  const [dropfileKey, setDropfileKey] = useState(0);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);
  const pending = useRef(0);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    pending.current = 0;
    setTyping(false);
  };

  // El agente "escribe" antes de contestar: se siente como plática, no como menú.
  const say = (text: string, delay: number) => {
    pending.current += 1;
    setTyping(true);
    timers.current.push(
      window.setTimeout(() => {
        pending.current -= 1;
        setMessages((m) => [...m, { id: nextId.current++, from: "agent", text }]);
        setTyping(pending.current > 0);
      }, delay),
    );
  };

  const sayUser = (text: string) =>
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text }]);

  const greet = () => {
    say(
      userName ? t("new.agent.greetingNamed", { name: userName }) : t("new.agent.greeting"),
      300,
    );
    say(t("new.agent.askCategory"), 1200);
  };

  useEffect(() => {
    greet();
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
    return clearTimers;
    // Solo al montar: el saludo no debe repetirse en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const composeDescription = (detailText: string, notesText: string) =>
    notesText ? `${detailText}\n\n${notesText}` : detailText;

  const pickCategory = (category: TicketCategory) => {
    sayUser(category.name);
    setCategoryName(category.name);
    onFieldChange("categoryId", category.id);
    onFieldChange("title", category.name);
    setStep("detail");
    say(t("new.agent.askDetail"), 600);
  };

  const pickSymptom = (label: string) => {
    sayUser(label);
    setDetail(label);
    onFieldChange("title", buildTitle(categoryName, label));
    onFieldChange("description", composeDescription(label, notes));
    setStep("where");
    say(t("new.agent.askWhere"), 600);
  };

  const pickDepartment = (department: Department) => {
    sayUser(department.name);
    setDepartmentName(department.name);
    onFieldChange("departmentId", department.id);
    setStep("urgency");
    say(t("new.agent.askUrgency"), 600);
  };

  const skipDepartment = () => {
    sayUser(t("new.agent.skipped"));
    setDepartmentName("");
    onFieldChange("departmentId", "");
    setStep("urgency");
    say(t("new.agent.askUrgency"), 600);
  };

  const pickPriority = (priority: string) => {
    sayUser(dyn(t)(`priorityLabels.${priority}`));
    onFieldChange("priority", priority);
    setStep("evidence");
    say(t("new.agent.askEvidence"), 600);
  };

  const attachFile = (file: File) => {
    onAddFile(file);
    sayUser(t("new.agent.attached", { name: file.name }));
    setDropfileKey((k) => k + 1);
  };

  const finishEvidence = () => {
    sayUser(files.length > 0 ? t("new.agent.continue") : t("new.agent.noEvidence"));
    setStep("notes");
    say(t("new.agent.askNotes"), 600);
  };

  // Única respuesta de texto libre. Vacía significa "sin nota".
  const sendNotes = (text: string) => {
    const value = text.trim();
    sayUser(value || t("new.agent.noNotes"));
    setNotes(value);
    onFieldChange("description", composeDescription(detail, value));
    setStep("done");
    say(t("new.agent.done"), 600);
  };

  const restart = () => {
    clearTimers();
    setMessages([]);
    setStep("category");
    setCategoryName("");
    setDetail("");
    setDepartmentName("");
    setNotes("");
    onFieldChange("title", "");
    onFieldChange("description", "");
    onFieldChange("priority", "MEDIUM");
    onFieldChange("categoryId", "");
    onFieldChange("departmentId", "");
    for (let i = files.length - 1; i >= 0; i -= 1) onRemoveFile(i);
    greet();
  };

  return {
    step,
    messages,
    typing,
    departments,
    categoryName,
    detail,
    departmentName,
    notes,
    dropfileKey,
    completed: step === "done" ? AGENT_STEPS.length : AGENT_STEPS.indexOf(step),
    pickCategory,
    pickSymptom,
    pickDepartment,
    skipDepartment,
    pickPriority,
    attachFile,
    finishEvidence,
    sendNotes,
    restart,
  };
};
