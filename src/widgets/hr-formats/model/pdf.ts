import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import { parseLocalDay, toDayString } from "@shared/utils/dates";
import type { ApercibimientoLetterData, DaycareLetterData, HrFormatKind, LaboralLetterData } from "./types";
import ApercibimientoLetterPdf from "../ui/ApercibimientoLetterPdf";
import DaycareLetterPdf from "../ui/DaycareLetterPdf";
import LaboralLetterPdf from "../ui/LaboralLetterPdf";

/** "María Pérez" → "maria-perez" para el nombre del archivo. */
const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sin-nombre";

const FILE_PREFIX: Record<HrFormatKind, string> = {
  laboral: "carta-laboral",
  apercibimiento: "carta-apercibimiento",
  daycare: "carta-guarderia",
};

export const hrFormatFileName = (kind: HrFormatKind, name: string, date: string): string => {
  const prefix = FILE_PREFIX[kind];
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

export const downloadDaycarePdf = async (data: DaycareLetterData): Promise<void> => {
  const blob = await pdf(createElement(DaycareLetterPdf, { data }) as never).toBlob();
  save(blob, hrFormatFileName("daycare", data.name, data.date));
};
