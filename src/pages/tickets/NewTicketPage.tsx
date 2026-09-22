import {
  ITButton,
  ITFlex,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaSave, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CreateTicketForm,
  useCreateTicket,
} from "@features/ticket/create-ticket";

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["tickets", "common"]);
  const [dropfileKey, setDropfileKey] = useState(0);

  const createTicket = useCreateTicket();

  const handleSave = () => {
    createTicket.handleSave().then((ok) => {
      if (ok) setTimeout(() => navigate("/tickets"), 1000);
    });
  };

  return (
    <ITPage
      title={t("new.title")}
      description={t("new.description")}
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={[
        { label: t("list.title"), onClick: () => navigate("/tickets") },
        { label: t("new.breadcrumb") },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={handleSave}
          disabled={createTicket.saving || !createTicket.isValid}
        >
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">
              {createTicket.saving ? t("new.saving") : t("new.button")}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <CreateTicketForm
        form={createTicket.form}
        errors={createTicket.errors}
        onFieldChange={createTicket.handleField}
        files={createTicket.files}
        onAddFile={(file) => {
          createTicket.addFile(file);
          setDropfileKey((current) => current + 1);
        }}
        onRemoveFile={createTicket.removeFile}
        dropfileKey={dropfileKey}
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
    </ITPage>
  );
}