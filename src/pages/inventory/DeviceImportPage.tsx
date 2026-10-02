import { ITPage } from "@axzydev/axzy_ui_system";
import { FaFileExcel } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useDeviceImport,
  ImportPreviewPanel,
  ImportResultCard,
  ImportUploadCard,
} from "@features/inventory/device-import";

/**
 * Carga masiva de dispositivos desde Excel.
 *
 * Tres pasos sobre un mismo archivo: subirlo, revisar exactamente lo que va a
 * pasar y confirmar. La previsualización no escribe nada y la confirmación es
 * todo-o-nada (una sola transacción en la API), así que no puede quedar una
 * carga a medias descuadrando el inventario.
 */
export default function DeviceImportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);
  const fx = useDeviceImport();

  return (
    <ITPage
      noPadding
      title={t("inventory:import.title")}
      description={t("inventory:import.description")}
      icon={<FaFileExcel size={20} />}
      backAction={() => navigate("/inventory/devices")}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("inventory:devices.title"), onClick: () => navigate("/inventory/devices") },
        { label: t("inventory:import.breadcrumb") },
      ]}
    >
      {fx.step === "upload" && <ImportUploadCard fx={fx} />}
      {fx.step === "review" && <ImportPreviewPanel fx={fx} />}
      {fx.step === "done" && (
        <ImportResultCard
          fx={fx}
          onGoToDevices={() => navigate("/inventory/devices")}
          onGoToMovements={() => navigate("/inventory/movements")}
        />
      )}
    </ITPage>
  );
}
