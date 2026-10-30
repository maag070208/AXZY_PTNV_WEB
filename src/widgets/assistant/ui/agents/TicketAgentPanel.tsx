import { ITToast } from "@axzydev/axzy_ui_system";
import { TicketAgent, useCreateTicket } from "@features/ticket/create-ticket";

interface Props {
  /** Se llama cuando el ticket ya se creó (o el flujo termina). */
  onDone: () => void;
}

/**
 * Formulario de ticket dentro del panel de Langostín: reutiliza el mismo agente
 * de `/tickets/new` (mismas preguntas, mismas validaciones) sin navegar.
 */
export default function TicketAgentPanel({ onDone }: Props) {
  const createTicket = useCreateTicket();

  const save = async () => {
    const ok = await createTicket.handleSave();
    if (ok) onDone();
    return ok;
  };

  return (
    <>
      <TicketAgent
        form={createTicket.form}
        onComplete={save}
        categories={createTicket.categories}
        files={createTicket.files}
        onFieldChange={createTicket.handleField}
        onAddFile={createTicket.addFile}
        onRemoveFile={createTicket.removeFile}
      />
      {createTicket.toast && (
        <ITToast
          message={createTicket.toast}
          type={createTicket.toastType}
          position="bottom-center"
          duration={2500}
          onClose={createTicket.dismissToast}
        />
      )}
    </>
  );
}
