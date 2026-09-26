import { saveAs } from "file-saver";
import type { PersonalProfile } from "@entities/personal";
import { CREDENCIAL_DPI, CREDENCIAL_H_PX, CREDENCIAL_W_PX } from "./cardSpec";
import { drawCredencial } from "./renderCredencial";
import { setPngDpi } from "./pngDpi";

export interface CredencialImagenInput {
  profile: PersonalProfile;
  qrDataUrl: string | null;
  fotoDataUrl: string | null;
  iniciales: string;
}

/** Convierte un dataURL base64 en bytes crudos. */
const dataUrlABytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
};

/**
 * Renderiza la credencial en un canvas fuera de pantalla y devuelve su PNG como
 * dataURL. La imagen sale a 1016 × 638 px (8.6 × 5.4 cm a 300 DPI).
 */
export const credencialDataUrl = async (input: CredencialImagenInput): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = CREDENCIAL_W_PX;
  canvas.height = CREDENCIAL_H_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo obtener el contexto 2D para dibujar la credencial");
  }

  await drawCredencial(ctx, { ...input, year: new Date().getFullYear() });
  return canvas.toDataURL("image/png");
};

/**
 * Descarga la credencial como PNG `credencial-<numeroEmpleado|id>.png`, con la
 * densidad física (300 DPI) incrustada para que conserve el tamaño de una INE.
 */
export const descargarCredencialImagen = async ({
  profile,
  imagenDataUrl,
}: {
  profile: PersonalProfile;
  imagenDataUrl: string;
}): Promise<void> => {
  const bytes = setPngDpi(dataUrlABytes(imagenDataUrl), CREDENCIAL_DPI);
  const blob = new Blob([bytes], { type: "image/png" });
  saveAs(blob, `credencial-${profile.numeroEmpleado ?? profile.id}.png`);
};
