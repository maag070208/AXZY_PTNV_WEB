import type { ComponentType } from "react";
import TicketAgentPanel from "../ui/agents/TicketAgentPanel";

/** Claves de i18n de los formularios del panel (tipadas para `t()`). */
export type AssistantAgentLabelKey = "help.agentTicket";

/** Props que recibe todo formulario que vive dentro del panel de Langostín. */
export interface AssistantAgentProps {
  /** Cierra el formulario (el panel vuelve a la ayuda). */
  onDone: () => void;
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
    id: "ticket",
    labelKey: "help.agentTicket",
    permission: "tickets.create",
    tone: "primary",
    Component: TicketAgentPanel,
  },
];
