import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import type { InventoryMovement, InventorySummaryDepartment } from "@entities/inventory-movement";
import { InventoryPDF } from "../ui/InventoryPDF";

export const downloadInventoryPDF = async (
  movements: InventoryMovement[],
  departments: InventorySummaryDepartment[]
): Promise<void> => {
  const blob = await pdf(
    createElement(InventoryPDF, { movements, departments }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `inventario_${yy}${mm}${dd}.pdf`);
};