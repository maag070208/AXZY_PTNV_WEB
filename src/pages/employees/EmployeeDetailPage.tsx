import { LottieLoader } from "@shared/ui/lottie-loader";
import { useState } from "react";
import {
  ITAlert,
  ITButton,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaChartLine, FaClock, FaFileAlt, FaIdCard, FaPencilAlt, FaUserCog, FaUserSlash, FaUserTie } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useEmployeeDetail,
  EmployeeHero,
  EmployeeDocumentsCard,
  EmployeeActivity,
  EmployeeInfoCards,
  DeactivateDialog,
} from "@features/hr/employee-detail";
import { EmployeeCredentialDialog } from "@widgets/employee-credential";
import { useCan } from "@entities/user";
import { EmployeeClockSection } from "@widgets/employee-clock";

type Section = "activity" | "documents" | "clock" | "info";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["employees", "common"]);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [section, setSection] = useState<Section>("activity");
  /** La cuenta (usuario, contraseña, roles) se edita en Usuarios: solo ADMIN. */
  const canEditUser = useCan("users.edit");
  const canManageClock = useCan("time_clocks.manage");

  const detail = useEmployeeDetail(id);

  if (detail.loading || !detail.profile) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("detail.loadingTitle")}
        backAction={() => navigate(-1)}
        icon={<FaUserTie size={20} />}
        breadcrumbs={[
          { label: tt("breadcrumb"), onClick: () => navigate("/employees") },
          { label: tt("detail.loadingTitle") },
        ]}
      >
        {detail.error ? (
          <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
            {detail.error}
          </ITAlert>
        ) : (
          <ITFlex justify="center">
            <LottieLoader size="lg" />
          </ITFlex>
        )}
      </ITPage>
    );
  }

  const profile = detail.profile;
  const sections: Array<{ id: Section; label: string; icon: React.ReactNode }> = [
    { id: "activity", label: tt("detail.sections.activity"), icon: <FaChartLine size={12} /> },
    { id: "documents", label: tt("detail.sections.documents"), icon: <FaFileAlt size={12} /> },
    ...(canManageClock ? [{ id: "clock" as Section, label: tt("detail.sections.clock"), icon: <FaClock size={12} /> }] : []),
    { id: "info", label: tt("detail.sections.info"), icon: <FaIdCard size={12} /> },
  ];

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("detail.title")}
      description={tt("detail.subtitle")}
      backAction={() => navigate(-1)}
      icon={<FaUserTie size={20} />}
      breadcrumbs={[
        { label: tt("breadcrumb"), onClick: () => navigate("/employees") },
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
          <ITButton variant="filled" color="primary" size="lg" onClick={() => navigate(`/employees/${id}/edit`)}>
            <ITFlex align="center" gap={1}>
              <FaPencilAlt size={11} />
              <ITText className="font-bold text-[11px]">{tt("detail.editInfo")}</ITText>
            </ITFlex>
          </ITButton>
          {/* El expediente edita a la persona; la cuenta (usuario, contraseña,
              roles) se edita en Usuarios. El enlace evita tener que buscarla. */}
          {canEditUser && (
            <ITButton variant="outlined" color="secondary" size="lg" onClick={() => navigate(`/users/${id}/edit`)}>
              <ITFlex align="center" gap={1}>
                <FaUserCog size={11} />
                <ITText className="font-bold text-[11px]">{tt("detail.editAccount")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      {detail.error && (
        <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
          {detail.error}
        </ITAlert>
      )}
      {detail.clockNotice && (
        <ITAlert variant="info" dismissible onDismiss={detail.dismissClockNotice}>
          {detail.clockNotice}
        </ITAlert>
      )}

      <ITFlex direction="column" gap={5}>
        <EmployeeHero profile={profile} onPhotoUpload={detail.uploadPhoto} />

        <nav role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={section === s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                section === s.id ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        {section === "activity" && <EmployeeActivity userId={profile.id} />}
        {section === "documents" && (
          <EmployeeDocumentsCard
            documentTypes={detail.documentTypes}
            documents={detail.documents}
            onUpload={detail.uploadDocument}
            onRemove={detail.removeDocument}
          />
        )}
        {section === "clock" && canManageClock && <EmployeeClockSection userName={profile.name} userId={profile.id} />}
        {section === "info" && <EmployeeInfoCards profile={profile} />}
      </ITFlex>

      <DeactivateDialog
        isOpen={detail.deactivateOpen}
        onClose={() => detail.setDeactivateOpen(false)}
        onConfirm={detail.confirmDeactivate}
        userName={profile.name}
      />

      <EmployeeCredentialDialog
        isOpen={credentialOpen}
        onClose={() => setCredentialOpen(false)}
        profile={profile}
      />
    </ITPage>
  );
}
