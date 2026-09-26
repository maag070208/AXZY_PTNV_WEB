import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { Loan } from "@entities/inventory";
import CustodyLetterPdf from "../ui/CustodyLetterPdf";

export const downloadCustodyLetterPdf = async (loan: Loan): Promise<void> => {
  const blob = await pdf(
    createElement(CustodyLetterPdf, { loan }) as any
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${loan.number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};