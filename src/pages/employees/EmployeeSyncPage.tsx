import { ITAlert, ITFlex, ITStack } from "@axzydev/axzy_ui_system";
import { AppPage } from "@shared/ui/app-page";
import { FaFileExcel } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  EmployeeSyncResultPanel,
  EmployeeSyncReviewPanel,
  EmployeeSyncUploadCard,
  useEmployeeSync,
} from "@features/user/employee-sync";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { useGoBack } from "@shared/lib/useGoBack";

/**
 * Sincronización de empleados desde el Excel de nómina: subir → revisar (sin
 * escribir nada) → confirmar → reporte del sistema y de los relojes con
 * descarga en Excel. Entra con `users.create`; sin `users.edit` solo se
 * previsualiza (el confirmar se oculta y el API lo vuelve a validar).
 */
export default function EmployeeSyncPage() {
  const { t } = useTranslation(["employees", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const fx = useEmployeeSync();

  const loading = fx.loading && !fx.preview;

  return (
    <AppPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("sync.title")}
      description={t("sync.description")}
      icon={<FaFileExcel size={20} />}
      backAction={() => goBack("/employees")}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("breadcrumb"), onClick: () => navigate("/employees", { replace: true }) },
        { label: t("sync.breadcrumb") },
      ]}
    >
      <ITStack spacing={4}>
        {!fx.canEdit && <ITAlert variant="warning">{t("sync.readOnly")}</ITAlert>}
        {fx.error && (
          <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
            {fx.error}
          </ITAlert>
        )}

        {loading ? (
          <ITFlex justify="center" className="py-10">
            <LottieLoader size="lg" />
          </ITFlex>
        ) : (
          <>
            {fx.step === "upload" && <EmployeeSyncUploadCard fx={fx} />}
            {fx.step === "review" && <EmployeeSyncReviewPanel fx={fx} />}
            {fx.step === "done" && <EmployeeSyncResultPanel fx={fx} />}
          </>
        )}
      </ITStack>
    </AppPage>
  );
}
