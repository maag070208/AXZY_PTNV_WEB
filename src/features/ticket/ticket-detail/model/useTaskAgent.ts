import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type TaskAgentStep = "ticket" | "who" | "what" | "notes" | "when" | "done";

// Orden en que el agente pregunta. "done" no es un paso pendiente. El paso
// "ticket" sólo aparece cuando la tarea se crea fuera del ticket (tablero).
export const TASK_AGENT_STEPS: TaskAgentStep[] = ["who", "what", "notes", "when"];
export const TASK_AGENT_STEPS_WITH_TICKET: TaskAgentStep[] = ["ticket", ...TASK_AGENT_STEPS];

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
  /** Crea la tarea; devuelve si se pudo. Recibe el ticket elegido en el flujo. */
  onCreate: (draft: TaskDraft, ticketId: string) => Promise<boolean>;
  /**
   * Preguntar primero de qué ticket es la tarea. Se usa cuando el chat se abre
   * fuera del ticket (tablero de tareas): ahí hay tareas de varios tickets.
   */
  askTicket?: boolean;
  /** Ticket ya elegido (el bot abre desde el detalle): se salta ese paso. */
  initialTicket?: { id: string; title: string };
}

// Estado antes de responder un paso; sirve para regresar.
interface Snapshot {
  step: TaskAgentStep;
  messages: TaskAgentMessage[];
  draft: TaskDraft;
  ticketId: string;
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
export const useTaskAgent = ({ onCreate, askTicket = false, initialTicket }: Options) => {
  const { t } = useTranslation("tickets");
  const askForTicket = askTicket && !initialTicket;
  const steps = askForTicket ? TASK_AGENT_STEPS_WITH_TICKET : TASK_AGENT_STEPS;
  const [step, setStep] = useState<TaskAgentStep>(askForTicket ? "ticket" : "who");
  const [ticketId, setTicketId] = useState(initialTicket?.id ?? "");
  const [ticketName, setTicketName] = useState(initialTicket?.title ?? "");
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
    setHistory((h) => [...h, { step, messages, draft, ticketId }]);

  const greet = () => {
    say(t("taskAgent.greeting"), 250);
    say(askTicket ? t("taskAgent.askTicket") : t("taskAgent.askWho"), 900);
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

  const pickTicket = (id: string, label: string) => {
    remember();
    sayUser(label);
    setTicketId(id);
    setTicketName(label);
    setStep("who");
    say(t("taskAgent.askWho"), 500);
  };

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
    onCreate(draft, ticketId)
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
    setTicketId(previous.ticketId);
  };

  const restart = () => {
    clearTimers();
    setHistory([]);
    setMessages([]);
    setStep(askTicket ? "ticket" : "who");
    setDraft(emptyDraft());
    setTicketId("");
    setTicketName("");
    greet();
  };

  return {
    step,
    messages,
    typing,
    draft,
    sending,
    ticketId,
    ticketName,
    steps,
    askTicket,
    canGoBack: history.length > 0,
    completed: step === "done" ? steps.length : steps.indexOf(step),
    whenOptions,
    pickTicket,
    pickUser,
    sendTitle,
    sendNotes,
    pickWhen,
    goBack,
    restart,
  };
};
