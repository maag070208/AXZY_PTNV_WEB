import { useState } from "react";
import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaFileAlt, FaIdCard, FaPencilAlt, FaUserSlash, FaUserTie } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useEmployeeDetail,
  EmployeeSummaryAside,
  EmployeeDocumentsCard,
  EmployeeInfoCards,
  CollapsibleCard,
} from "@features/personal/employee-detail";
import { CredencialEmpleadoDialog } from "@widgets/credencial-empleado";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["employees", "common"]);
  const [credentialOpen, setCredentialOpen] = useState(false);

  const detail = useEmployeeDetail(id);

  if (detail.loading || !detail.profile) {
    return (
      <ITPage
        title={tt("detail.loadingTitle")}
        backAction={() => navigate(-1)}
        icon={<FaUserTie size={20} />}
        breadcrumbs={[
          { label: tt("breadcrumb"), onClick: () => navigate("/empleados") },
          { label: tt("detail.loadingTitle") },
        ]}
      >
        {detail.error ? (
          <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
            {detail.error}
          </ITAlert>
        ) : (
          <ITFlex justify="center">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        )}
      </ITPage>
    );
  }

  const profile = detail.profile;

  return (
    <ITPage
      title={tt("detail.title")}
      description={profile.name}
      backAction={() => navigate(-1)}
      icon={<FaUserTie size={20} />}
      breadcrumbs={[
        { label: tt("breadcrumb"), onClick: () => navigate("/empleados") },
        { label: profile.name },
      ]}
      actions={
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="primary" size="lg" onClick={() => setCredentialOpen(true)}>
            <ITFlex align="center" gap={1}>
              <FaIdCard size={11} />
              <ITText className="font-bold text-[11px]">{tt("detail.credential")}</ITText>
            </ITFlex>
          </ITButton>
          {profile.active ? (
            <ITButton variant="outlined" color="error" size="lg" onClick={() => detail.setDeactivateOpen(true)}>
              <ITFlex align="center" gap={1}>
                <FaUserSlash size={11} />
                <ITText className="font-bold text-[11px]">{tt("detail.deactivate")}</ITText>
              </ITFlex>
            </ITButton>
          ) : (
            <ITButton variant="outlined" color="success" size="lg" onClick={detail.reactivate}>
              <ITText className="font-bold text-[11px]">{tt("detail.reactivate")}</ITText>
            </ITButton>
          )}
          <ITButton variant="filled" color="primary" size="lg" onClick={() => navigate(`/empleados/${id}/editar`)}>
            <ITFlex align="center" gap={1}>
              <FaPencilAlt size={11} />
              <ITText className="font-bold text-[11px]">{tt("detail.editInfo")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      {detail.error && (
        <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
          {detail.error}
        </ITAlert>
      )}

      <ITGrid container columns={12} spacing={5} className="items-start">
        <ITGrid item xs={12} md={8} className="flex flex-col gap-5 min-w-0">
          <CollapsibleCard
            icon={<FaFileAlt size={14} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title={tt("detail.documentsTitle")}
          >
            <EmployeeDocumentsCard
              documentTypes={detail.documentTypes}
              documents={detail.documents}
              uploadingDocTypeId={detail.uploadingDocTypeId}
              onOpenUpload={detail.setUploadingDocTypeId}
              onCloseUpload={() => detail.setUploadingDocTypeId(null)}
              onUpload={detail.uploadDocument}
              onRemove={detail.removeDocument}
            />
          </CollapsibleCard>
          <CollapsibleCard
            icon={<FaIdCard size={14} className="text-violet-600" />}
            iconBg="bg-violet-50"
            title={tt("detail.personalInfoTitle")}
          >
            <EmployeeInfoCards profile={profile} />
          </CollapsibleCard>
        </ITGrid>

        <ITGrid item xs={12} md={4} className="w-full min-w-0">
          <EmployeeSummaryAside profile={profile} onPhotoUpload={detail.uploadPhoto} />
        </ITGrid>
      </ITGrid>

      <ITConfirmDialog
        isOpen={detail.deactivateOpen}
        onClose={() => detail.setDeactivateOpen(false)}
        onConfirm={detail.confirmDeactivate}
        title={tt("detail.deactivate")}
        message={tt("detail.deactivateConfirm", { name: profile.name })}
        confirmLabel={tt("detail.deactivate")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <CredencialEmpleadoDialog
        isOpen={credentialOpen}
        onClose={() => setCredentialOpen(false)}
        profile={profile}
      />
    </ITPage>
  );
}
