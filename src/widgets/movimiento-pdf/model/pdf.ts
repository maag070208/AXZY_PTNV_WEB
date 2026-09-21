import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Movimiento } from "@entities/inventario";
import MovimientoPDF from "../ui/MovimientoPDF";
import MovimientosReportePDF from "../ui/MovimientosReportePDF";

export const descargarMovimientoPDF = async (movimiento: Movimiento): Promise<void> => {
  const blob = await pdf(createElement(MovimientoPDF, { movimiento }) as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MV-${movimiento.id.slice(0, 8).toUpperCase()}-${movimiento.tipo}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export const descargarReporteMovimientosPDF = async (movimientos: Movimiento[]): Promise<void> => {
  const blob = await pdf(createElement(MovimientosReportePDF, { movimientos }) as any).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte-Movimientos-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};