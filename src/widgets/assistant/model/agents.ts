import type { ComponentType } from "react";
import ActChatAgent from "../ui/agents/ActChatAgent";
import ScheduleChatAgent from "../ui/agents/ScheduleChatAgent";
import ScheduleEditAgent from "../ui/agents/ScheduleEditAgent";
import EmployeeFinderAgent from "../ui/agents/EmployeeFinderAgent";
import EmployeeFormAgent from "../ui/agents/EmployeeFormAgent";
import TaskChatAgent from "../ui/agents/TaskChatAgent";
import TicketChatAgent from "../ui/agents/TicketChatAgent";

/** Claves de i18n de los formularios del panel (tipadas para `t()`). */
export type AssistantAgentLabelKey =
  | "help.agentTicket"
  | "help.agentTask"
  | "help.agentEmployee"
  | "help.agentEmployeeForm"
  | "help.agentAct"
  | "help.agentSchedule"
  | "help.agentScheduleEdit";

/** Props que recibe todo formulario que vive dentro del panel de Langostín. */
export interface AssistantAgentProps {
  /** Cierra el formulario (el panel vuelve a la ayuda). */
  onDone: () => void;
  /** Id de la fila que se está editando (p. ej. el horario elegido en la tabla). */
  targetId?: string;
}

/**
 * Un formulario que Langostín puede hacer **dentro de su panel**, sin navegar.
 *
 * El registro es la única lista: agregar un formulario nuevo (tarea, préstamo,
 * horario…) es agregar una entrada aquí; el panel muestra los que el permiso de
 * la persona permite y los que la pantalla actual declara disponibles.
 */
export interface AssistantAgent {
  id: string;
  /** Título corto del botón («Crear ticket aquí»). */
  labelKey: AssistantAgentLabelKey;
  /** Permiso necesario para ofrecerlo (el API valida al guardar de todos modos). */
  permission: string;
  /**
   * Dónde se ofrece. Sin `screens`, se ofrece en todas las pantallas.
   * Con `screens`, sólo en esas (por ejemplo, la tarea necesita un ticket abierto).
   */
  screens?: string[];
  /** Color del chip. */
  tone?: "primary" | "success" | "warning" | "secondary";
  Component: ComponentType<AssistantAgentProps>;
}

export const ASSISTANT_AGENTS: AssistantAgent[] = [
  {
    id: "act",
    labelKey: "help.agentAct",
    permission: "hr.disciplinary_reports",
    // El acta se levanta desde el bot en Reportes de personal.
    screens: ["employees.disciplinary"],
    tone: "warning",
    Component: ActChatAgent,
  },
  {
    id: "schedule",
    labelKey: "help.agentSchedule",
    permission: "schedules.view",
    // En Horarios el alta la hace el bot: no hay botón de «Nuevo horario».
    screens: ["schedules"],
    tone: "primary",
    Component: ScheduleChatAgent,
  },
  {
    id: "scheduleEdit",
    labelKey: "help.agentScheduleEdit",
    permission: "schedules.view",
    // Editar un horario ocurre en el panel: la fila avisa y el bot pregunta qué cambiar.
    screens: ["schedules"],
    tone: "primary",
    Component: ScheduleEditAgent,
  },
  {
    id: "employee",
    labelKey: "help.agentEmployee",
    permission: "hr.records",
    // En Personal: buscar a una persona y llevar a su expediente o a editarla.
    screens: ["employees.list", "employees.records"],
    tone: "secondary",
    Component: EmployeeFinderAgent,
  },
  {
    id: "employeeForm",
    labelKey: "help.agentEmployeeForm",
    permission: "hr.records",
    // En la edición de la persona: pregunta y llena el formulario en vivo.
    screens: ["employees.edit"],
    tone: "primary",
    Component: EmployeeFormAgent,
  },
  {
    id: "task",
    labelKey: "help.agentTask",
    permission: "tasks.assign",
    // La tarea vive en el tablero, donde se ven las de todos los tickets.
    screens: ["tickets.kanban", "tickets.tasks"],
    tone: "success",
    Component: TaskChatAgent,
  },
  {
    id: "ticket",
    labelKey: "help.agentTicket",
    permission: "tickets.create",
    // Sólo en las pantallas de tickets: en RH o inventario no tiene sentido.
    screens: ["tickets.list", "tickets.tasks", "tickets.kanban", "tickets.detail"],
    tone: "primary",
    Component: TicketChatAgent,
  },
];
