import { ITAlert, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFileExcel } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  useDeviceImport,
  ImportDropCard,
  ImportRowsTable,
  ImportResultsCard,
} from "@features/device/import-devices";

export default function DeviceImportPage() {
  const { t: tt } = useTranslation(["device"]);
  const fx = useDeviceImport();

  return (
    <ITPage
      title={tt("device:list.importButton")}
      description='Sube un archivo con columnas "Modelo", "Descripción" y "Cantidad". Define tipo, marca y datos por unidad antes de confirmar la carga.'
      backAction={() => fx.navigate(-1)}
      breadcrumbs={[
        {
          label: tt("device:list.title"),
          onClick: () => fx.navigate("/dispositivos"),
        },
        { label: tt("device:list.importButton") },
      ]}
      icon={<FaFileExcel size={20} />}
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {fx.warnings.length > 0 && (
        <ITAlert variant="warning">
          <ITText className="font-bold">Filas con observaciones:</ITText>
          <ul className="mt-1 list-disc pl-5">
            {fx.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </ITAlert>
      )}

      {fx.unknownTypes.length > 0 && (
        <ITAlert variant="error">
          <ITText className="font-bold">Tipos no registrados:</ITText>{" "}
          {fx.unknownTypes.join(", ")}. Da de alta esos tipos en Dispositivos →
          Tipos antes de continuar.
        </ITAlert>
      )}

      {fx.typesLoaded && fx.deviceTypes.length === 0 && (
        <ITAlert variant="warning">
          No hay tipos de dispositivo disponibles. Créalo en Dispositivos →
          Tipos antes de cargar el Excel.
        </ITAlert>
      )}

      {fx.rows.length === 0 && !fx.results && <ImportDropCard fx={fx} />}

      {fx.rows.length > 0 && <ImportRowsTable fx={fx} />}

      <ImportResultsCard fx={fx} />
    </ITPage>
  );
}