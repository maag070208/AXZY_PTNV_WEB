import { ITAlert, ITPage } from "@axzydev/axzy_ui_system";
import { FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useUserImport,
  ImportPanel,
  ImportResultCard,
} from "@features/user/import-users";

export default function UserImportPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation("users");

  const fx = useUserImport();

  return (
    <ITPage
      title={tt("import.title")}
      description={tt("import.description")}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
        { label: tt("import.breadcrumb") },
      ]}
      icon={<FaUserShield size={20} />}
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ImportPanel fx={fx} />
      <ImportResultCard fx={fx} onGoToList={() => navigate("/usuarios")} />
    </ITPage>
  );
}