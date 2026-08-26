import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { InventoryMovement } from "@core/api/inventory.api";
import type { Location } from "@core/api/devices.api";
import { InventoryPDF } from "../components/InventoryPDF";

export const downloadInventoryPDF = async (
  movements: InventoryMovement[],
  locations: Location[]
): Promise<void> => {
  const blob = await pdf(
    createElement(InventoryPDF, { movements, locations }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `inventario_${yy}${mm}${dd}.pdf`);
};
