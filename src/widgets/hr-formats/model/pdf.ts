import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { parseLocalDay, toDayString } from "@shared/utils/dates";
import type { ApercibimientoLetterData, HrFormatKind, LaboralLetterData } from "./types";
import ApercibimientoLetterPdf from "../ui/ApercibimientoLetterPdf";
import LaboralLetterPdf from "../ui/LaboralLetterPdf";

/** "María Pérez" → "maria-perez" para el nombre del archivo. */
const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sin-nombre";

export const hrFormatFileName = (kind: HrFormatKind, name: string, date: string): string => {
  const prefix = kind === "laboral" ? "carta-laboral" : "carta-apercibimiento";
  return `${prefix}-${slug(name)}-${toDayString(parseLocalDay(date) ?? new Date())}.pdf`;
};

const save = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadLaboralPdf = async (data: LaboralLetterData): Promise<void> => {
  const blob = await pdf(createElement(LaboralLetterPdf, { data }) as never).toBlob();
  save(blob, hrFormatFileName("laboral", data.name, data.date));
};

export const downloadApercibimientoPdf = async (data: ApercibimientoLetterData): Promise<void> => {
  const blob = await pdf(createElement(ApercibimientoLetterPdf, { data }) as never).toBlob();
  save(blob, hrFormatFileName("apercibimiento", data.name, data.date));
};
