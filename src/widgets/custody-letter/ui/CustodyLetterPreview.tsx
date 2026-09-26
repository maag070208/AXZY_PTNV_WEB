import type { Loan } from "@entities/inventory";
import CustodyLetterHtml from "./CustodyLetterHtml";

/**
 * Vista previa en vivo de la carta responsiva de un préstamo.
 * Render HTML ligero (sin PDFViewer) para no parpadear al escribir.
 */
export default function CustodyLetterPreview({ loan }: { loan: Loan }) {
  return <CustodyLetterHtml loan={loan} />;
}