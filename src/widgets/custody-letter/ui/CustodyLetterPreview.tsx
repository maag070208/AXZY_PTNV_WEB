import type { Prestamo } from "@entities/inventario";
import CartaResponsivaHtml from "./CartaResponsivaHtml";

/**
 * Vista previa en vivo de la carta responsiva de un préstamo.
 * Render HTML ligero (sin PDFViewer) para no parpadear al escribir.
 */
export default function CartaResponsivaPreview({ prestamo }: { prestamo: Prestamo }) {
  return <CartaResponsivaHtml prestamo={prestamo} />;
}