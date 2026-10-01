import { useEffect } from "react";
import { ITButton, ITPage } from "@axzydev/axzy_ui_system";
import { FaPlus, FaQuestionCircle, FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { RolesWorkspace, useRolesWorkspace } from "@features/roles/roles-console";

/** Consola de control de acceso: roles, matriz, acceso por persona, políticas, catálogo y actividad. */
function RolesConsole() {
  const navigate = useNavigate();
  const { t } = useTranslation(["roles", "common"]);
  const workspace = useRolesWorkspace();

  return (
    <ITPage
      noPadding
      title={t("title")}
      description={t("description")}
      backAction={() => navigate(-1)}
      icon={<FaUserShield size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("title") },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <ITButton variant="outlined" color="secondary" onClick={() => workspace.setHelpOpen(true)}>
            <span className="flex items-center gap-1.5 text-[11px] font-bold">
              <FaQuestionCircle size={12} /> {t("help.open")}
            </span>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={workspace.openCreateRole}>
            <span className="flex items-center gap-1.5 text-[11px] font-bold">
              <FaPlus size={11} /> {t("access.newRole")}
            </span>
          </ITButton>
        </div>
      }
    >
      <RolesWorkspace workspace={workspace} />
    </ITPage>
  );
}

export default function RolesPage() {
  const navigate = useNavigate();
  const canAdminRoles = useCan("roles.manage");

  useEffect(() => {
    if (!canAdminRoles) navigate("/", { replace: true });
  }, [canAdminRoles, navigate]);

  if (!canAdminRoles) return null;
  return <RolesConsole />;
}
