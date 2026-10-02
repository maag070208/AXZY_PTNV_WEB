import { useNavigate } from "react-router-dom";
import { useKitchenImport } from "../model/useKitchenImport";
import ImportPreviewPanel from "./ImportPreviewPanel";
import ImportResultCard from "./ImportResultCard";
import ImportUploadCard from "./ImportUploadCard";

/**
 * Asistente de la carga masiva del inventario de cocina: subir → revisar →
 * confirmar. Es una pantalla completa (no un diálogo) porque el paso de revisión
 * trae la tabla de todo lo que va a pasar, incluidos los artículos que ya existen
 * y la decisión de sumarles o ponerles la cantidad del archivo.
 */
export default function KitchenImportPanel() {
  const navigate = useNavigate();
  const fx = useKitchenImport();

  if (fx.step === "done") {
    return (
      <ImportResultCard
        fx={fx}
        onGoToItems={() => navigate("/kitchen/items")}
        onGoToMovements={() => navigate("/kitchen/movements")}
      />
    );
  }

  if (fx.step === "review") return <ImportPreviewPanel fx={fx} />;
  return <ImportUploadCard fx={fx} />;
}
