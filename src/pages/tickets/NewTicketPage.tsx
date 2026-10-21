import {
  ITButton,
  ITFlex,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaSave, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TicketAgent, useCreateTicket } from "@features/ticket/create-ticket";

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["tickets", "common"]);

  const createTicket = useCreateTicket();

  const handleSave = async () => {
    const ok = await createTicket.handleSave();
    if (ok) setTimeout(() => navigate("/tickets"), 1000);
    return ok;
  };

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full!"
      noPadding
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
      <TicketAgent
        form={createTicket.form}
        onComplete={handleSave}
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
    </ITPage>
  );
}