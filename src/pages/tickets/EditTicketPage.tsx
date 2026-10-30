import {
  ITButton,
  ITFlex,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect } from "react";
import { LuSave, LuTicket } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  EditTicketForm,
  useEditTicket,
} from "@features/ticket/edit-ticket";
import { useGoBack } from "@shared/lib/useGoBack";
import { LangostinState } from "@shared/ui/langostin";

export default function EditTicketPage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const canEditTicket = useCan("tickets.edit");

  const editTicket = useEditTicket();

  useEffect(() => {
    if (!canEditTicket) {
      navigate("/tickets", { replace: true });
    }
  }, [canEditTicket, navigate]);

  const handleSave = () => {
    editTicket.handleSave().then((ok) => {
      if (ok) setTimeout(() => goBack(`/tickets/${editTicket.id}`), 1000);
    });
  };

  const breadcrumbs = [
    { label: tt("list.title"), onClick: () => navigate("/tickets", { replace: true }) },
    editTicket.ticket && { label: editTicket.ticket.title },
    { label: tt("edit.breadcrumb") },
  ].filter(Boolean) as { label: string; onClick?: () => void }[];

  if (editTicket.loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("edit.title")}
        backAction={() => goBack("/tickets")}
        icon={<LuTicket size={20} />}
        breadcrumbs={breadcrumbs}
      >
        <LangostinState kind="loading" title={tt("edit.loading")} description="" />
      </ITPage>
    );
  }

  if (!editTicket.ticket) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("edit.title")}
        backAction={() => goBack("/tickets")}
        icon={<LuTicket size={20} />}
        breadcrumbs={[
          { label: tt("list.title"), onClick: () => navigate("/tickets", { replace: true }) },
          { label: tt("edit.notFound") },
        ]}
      >
        <LangostinState kind="error" title={tt("edit.notFound")} description={tt("edit.ticketNotFound")} />
      </ITPage>
    );
  }

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("edit.title")}
      description={tt("edit.description")}
      backAction={() => goBack("/tickets")}
      icon={<LuTicket size={20} />}
      breadcrumbs={breadcrumbs}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={handleSave}
          disabled={editTicket.saving || !editTicket.isValid}
        >
          <ITFlex align="center" gap={1}>
            <LuSave size={14} />
            <ITText className="font-bold text-[11px]">
              {editTicket.saving ? tt("edit.saving") : tt("edit.button")}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <EditTicketForm
        form={editTicket.form}
        errors={editTicket.errors}
        onFieldChange={editTicket.handleField}
      />

      {editTicket.toast && (
        <ITToast
          message={editTicket.toast}
          type={editTicket.toastType}
          position="bottom-center"
          duration={2500}
          onClose={editTicket.dismissToast}
        />
      )}
    </ITPage>
  );
}