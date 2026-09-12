import {
  ITButton,
  ITFlex,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect } from "react";
import { FaSave, FaTicketAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import {
  EditTicketForm,
  useEditTicket,
} from "@features/ticket/edit-ticket";

export default function EditTicketPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["tickets", "common"]);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const editTicket = useEditTicket();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/tickets");
    }
  }, [isAdmin, navigate]);

  const handleSave = () => {
    editTicket.handleSave().then((ok) => {
      if (ok) setTimeout(() => navigate(`/tickets/${editTicket.id}`), 1000);
    });
  };

  const breadcrumbs = [
    { label: tt("list.title"), onClick: () => navigate("/tickets") },
    editTicket.ticket && { label: editTicket.ticket.titulo },
    { label: tt("edit.breadcrumb") },
  ].filter(Boolean) as { label: string; onClick?: () => void }[];

  if (editTicket.loading) {
    return (
      <ITPage
        title={tt("edit.title")}
        backAction={() => navigate(-1)}
        icon={<FaTicketAlt size={20} />}
        breadcrumbs={breadcrumbs}
      >
        <ITText className="text-slate-400">{tt("edit.loading")}</ITText>
      </ITPage>
    );
  }

  if (!editTicket.ticket) {
    return (
      <ITPage
        title={tt("edit.title")}
        backAction={() => navigate(-1)}
        icon={<FaTicketAlt size={20} />}
        breadcrumbs={[
          { label: tt("list.title"), onClick: () => navigate("/tickets") },
          { label: tt("edit.notFound") },
        ]}
      >
        <ITText className="text-slate-400">{tt("edit.ticketNotFound")}</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={tt("edit.title")}
      description={tt("edit.description")}
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={breadcrumbs}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={handleSave}
          disabled={editTicket.saving || !editTicket.isValid}
        >
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">
              {editTicket.saving ? tt("edit.saving") : tt("edit.button")}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <EditTicketForm
        form={editTicket.form}
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