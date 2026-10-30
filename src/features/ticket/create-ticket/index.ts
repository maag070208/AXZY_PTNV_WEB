// API pública de la feature "create-ticket": el formulario vive dentro del panel
// de Langostín (`widgets/assistant`), aquí sólo el estado y el alta.
export { useCreateTicket, type TicketDraft } from "./model/useCreateTicket";
export { useTicketAgent, type AgentStep } from "./model/useTicketAgent";
