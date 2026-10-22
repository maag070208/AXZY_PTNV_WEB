import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type TaskAgentStep = "who" | "what" | "notes" | "when" | "done";

// Orden en que el agente pregunta. "done" no es un paso pendiente.
export const TASK_AGENT_STEPS: TaskAgentStep[] = ["who", "what", "notes", "when"];

export interface TaskAgentMessage {
  id: number;
  from: "agent" | "user";
  text: string;
}

/** Lo que se arma en la conversación y se manda a la API. */
export interface TaskDraft {
  userId: string;
  title: string;
  description: string;
  /** yyyy-mm-dd */
  startDate: string;
  /** yyyy-mm-dd (vacío = sin fecha límite) */
  dueDate: string;
}

/** Opción de fecha límite que ofrece el agente. */
export interface WhenOption {
  value: string;
  label: string;
  dueDate: string;
}

interface Options {
  /** Crea la tarea; devuelve si se pudo. */
  onCreate: (draft: TaskDraft) => Promise<boolean>;
}

// Estado antes de responder un paso; sirve para regresar.
interface Snapshot {
  step: TaskAgentStep;
  messages: TaskAgentMessage[];
  draft: TaskDraft;
}

/** Fecha local en formato yyyy-mm-dd (sin correr a UTC). */
export const localDate = (days = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const emptyDraft = (): TaskDraft => ({
  userId: "",
  title: "",
  description: "",
  startDate: localDate(),
  dueDate: "",
});

/**
 * Agente de tareas: el mismo chat de Langostín, pero para armar una tarea del
 * ticket (quién la hace, qué hay que hacer, detalles y fecha).
 */
export const useTaskAgent = ({ onCreate }: Options) => {
  const { t } = useTranslation("tickets");
  const [step, setStep] = useState<TaskAgentStep>("who");
  const [messages, setMessages] = useState<TaskAgentMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [sending, setSending] = useState(false);
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
  const say = (text: string, delay = 400) => {
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

  // Guarda cómo estaba todo antes de responder el paso actual.
  const remember = () =>
    setHistory((h) => [...h, { step, messages, draft }]);

  const greet = () => {
    say(t("taskAgent.greeting"), 250);
    say(t("taskAgent.askWho"), 900);
  };

  useEffect(() => {
    greet();
    return clearTimers;
    // Solo al montar: el saludo no debe repetirse en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Fechas que ofrece el agente para el cuándo. */
  const whenOptions: WhenOption[] = [
    { value: "today", label: t("taskAgent.when.today"), dueDate: localDate() },
    { value: "tomorrow", label: t("taskAgent.when.tomorrow"), dueDate: localDate(1) },
    { value: "in3", label: t("taskAgent.when.in3"), dueDate: localDate(3) },
    { value: "in7", label: t("taskAgent.when.in7"), dueDate: localDate(7) },
    { value: "none", label: t("taskAgent.when.none"), dueDate: "" },
  ];

  const pickUser = (userId: string, label: string) => {
    remember();
    sayUser(label);
    setDraft((d) => ({ ...d, userId }));
    setStep("what");
    say(t("taskAgent.askWhat"), 500);
  };

  const sendTitle = (text: string) => {
    const title = text.trim();
    if (!title) return;
    remember();
    sayUser(title);
    setDraft((d) => ({ ...d, title }));
    setStep("notes");
    say(t("taskAgent.askNotes"), 500);
  };

  const sendNotes = (text: string) => {
    remember();
    const value = text.trim();
    sayUser(value || t("taskAgent.noNotes"));
    setDraft((d) => ({ ...d, description: value }));
    setStep("when");
    say(t("taskAgent.askWhen"), 500);
  };

  const pickWhen = (option: WhenOption) => {
    remember();
    sayUser(option.label);
    setDraft((d) => ({ ...d, dueDate: option.dueDate }));
    setStep("done");
    say(t("taskAgent.done"), 500);
  };

  // Crea la tarea al terminar la conversación (el agente cierra el chat).
  useEffect(() => {
    if (step !== "done" || sending) return;
    setSending(true);
    onCreate(draft)
      .catch(() => false)
      .finally(() => setSending(false));
    // Solo al llegar a "done".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Regresa al paso anterior: vuelve a mostrar su pregunta y revierte sus datos.
  const goBack = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    clearTimers();
    setHistory((h) => h.slice(0, -1));
    setMessages(previous.messages);
    setStep(previous.step);
    setDraft(previous.draft);
  };

  const restart = () => {
    clearTimers();
    setHistory([]);
    setMessages([]);
    setStep("who");
    setDraft(emptyDraft());
    greet();
  };

  return {
    step,
    messages,
    typing,
    draft,
    sending,
    canGoBack: history.length > 0,
    completed: step === "done" ? TASK_AGENT_STEPS.length : TASK_AGENT_STEPS.indexOf(step),
    whenOptions,
    pickUser,
    sendTitle,
    sendNotes,
    pickWhen,
    goBack,
    restart,
  };
};
