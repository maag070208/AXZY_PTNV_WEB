import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { AuditLog } from "@core/api/audit.api";
import AuditPDF from "../components/AuditPDF";

export const downloadAuditPDF = async (
  logs: AuditLog[],
  filters?: { action?: string; start?: string; end?: string }
): Promise<void> => {
  const blob = await pdf(
    createElement(AuditPDF, { logs, filters }) as any
  ).toBlob();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `auditoria_${yy}${mm}${dd}.pdf`);
};
