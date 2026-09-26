import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Movement } from "@entities/inventory";
import MovementPdf from "../ui/MovementPdf";
import MovementsReportPdf from "../ui/MovementsReportPdf";

export const downloadMovementPdf = async (movement: Movement): Promise<void> => {
  const blob = await pdf(createElement(MovementPdf, { movement }) as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MV-${movement.id.slice(0, 8).toUpperCase()}-${movement.type}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadReportMovementsPdf = async (movements: Movement[]): Promise<void> => {
  const blob = await pdf(createElement(MovementsReportPdf, { movements }) as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte-Movimientos-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};