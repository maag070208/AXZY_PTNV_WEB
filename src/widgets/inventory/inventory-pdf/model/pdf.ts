import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { InventoryMovement } from "@entities/inventory-movement";
import type { Location } from "@entities/location";
import { InventoryPDF } from "../ui/InventoryPDF";

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