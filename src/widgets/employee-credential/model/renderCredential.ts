import type { PersonalProfile } from "@entities/personal";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";
import { PDF_COLORS } from "@shared/pdf/theme";
import { CREDENCIAL_H_PX, CREDENCIAL_W_PX, LAYOUT } from "./cardSpec";

export interface CredencialRenderInput {
  profile: PersonalProfile;
  qrDataUrl: string | null;
  fotoDataUrl: string | null;
  iniciales: string;
  year: number;
}

/** Pila tipográfica genérica: el PNG no incrusta fuentes, así que no se elige una marca. */
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Texto por defecto cuando un campo viene vacío. */
const VACIO = "—";

/** Carga una imagen (los dataURL no contaminan el canvas) o devuelve `null`. */
const loadImage = async (src: string): Promise<HTMLImageElement | null> => {
  const img = new Image();
  img.src = src;
  try {
    await img.decode();
    return img.naturalWidth > 0 ? img : null;
  } catch {
    return null;
  }
};

/** Tinta el `letterSpacing` del contexto cuando el navegador lo soporta. */
const setLetterSpacing = (ctx: CanvasRenderingContext2D, value: string): void => {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value;
};

/** Traza un rectángulo con esquinas redondeadas en el path actual. */
const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  const radio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + w, y, x + w, y + h, radio);
  ctx.arcTo(x + w, y + h, x, y + h, radio);
  ctx.arcTo(x, y + h, x, y, radio);
  ctx.arcTo(x, y, x + w, y, radio);
  ctx.closePath();
};

/** Dibuja la imagen cubriendo el rectángulo (cover-crop centrado). */
const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void => {
  const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * escala;
  const dh = img.naturalHeight * escala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
};

/** Dibuja la imagen completa dentro del rectángulo (contain, centrada). */
const drawImageContain = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void => {
  const escala = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * escala;
  const dh = img.naturalHeight * escala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
};

/** Recorta el texto a `maxWidth` agregando elipsis si no cabe. */
const truncate = (ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string => {
  if (ctx.measureText(texto).width <= maxWidth) return texto;
  let recorte = texto;
  while (recorte.length > 1 && ctx.measureText(`${recorte}…`).width > maxWidth) {
    recorte = recorte.slice(0, -1);
  }
  return `${recorte}…`;
};

/** Reparte el texto en líneas que quepan, hasta `maxLines`, con elipsis si sobra. */
const wrapLines = (
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxWidth: number,
  maxLines: number
): string[] => {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (!palabras.length) return [VACIO];

  const lineas: string[] = [];
  let i = 0;
  while (i < palabras.length && lineas.length < maxLines) {
    let linea = palabras[i++];
    while (i < palabras.length) {
      const candidata = `${linea} ${palabras[i]}`;
      if (ctx.measureText(candidata).width <= maxWidth) {
        linea = candidata;
        i++;
      } else {
        break;
      }
    }
    lineas.push(linea);
  }

  const sobra = i < palabras.length;
  if (sobra && lineas.length) {
    lineas[lineas.length - 1] = truncate(ctx, `${lineas[lineas.length - 1]}…`, maxWidth);
  }
  return lineas;
};

/** Dibuja la credencial completa sobre el contexto ya dimensionado. */
export const drawCredencial = async (
  ctx: CanvasRenderingContext2D,
  input: CredencialRenderInput
): Promise<void> => {
  const { profile, qrDataUrl, fotoDataUrl, iniciales, year } = input;
  const nombre = profile.name?.trim() || VACIO;
  const numero = profile.numeroEmpleado?.trim() || VACIO;
  const puesto = profile.puesto?.trim() || VACIO;
  const departamento = profile.department?.name?.trim() || VACIO;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Fondo blanco opaco: la credencial se imprime, no debe tener transparencia.
  ctx.fillStyle = PDF_COLORS.white;
  ctx.fillRect(0, 0, CREDENCIAL_W_PX, CREDENCIAL_H_PX);

  // Banda superior + acento.
  ctx.fillStyle = PDF_COLORS.band;
  ctx.fillRect(LAYOUT.band.x, LAYOUT.band.y, LAYOUT.band.w, LAYOUT.band.h);
  ctx.fillStyle = PDF_COLORS.bandAccent;
  ctx.fillRect(LAYOUT.accent.x, LAYOUT.accent.y, LAYOUT.accent.w, LAYOUT.accent.h);

  // Logo sobre badge blanco.
  ctx.beginPath();
  ctx.arc(LAYOUT.logoBadge.cx, LAYOUT.logoBadge.cy, LAYOUT.logoBadge.r, 0, Math.PI * 2);
  ctx.fillStyle = PDF_COLORS.white;
  ctx.fill();
  const logo = await loadImage(LOGO_PUERTO_NUEVO_BASE64);
  if (logo) {
    const { x, y, w, h } = LAYOUT.logo;
    drawImageContain(ctx, logo, x, y, w, h);
  }

  // Encabezados.
  ctx.fillStyle = PDF_COLORS.white;
  ctx.font = `bold ${LAYOUT.title.size}px ${FONT}`;
  ctx.fillText("CREDENCIAL DE EMPLEADO", LAYOUT.title.x, LAYOUT.title.baseline);
  ctx.fillStyle = "#bfe0f0";
  ctx.font = `${LAYOUT.subtitle.size}px ${FONT}`;
  ctx.fillText(
    "Puerto Nuevo Hotel y Villas · Personal Autorizado",
    LAYOUT.subtitle.x,
    LAYOUT.subtitle.baseline
  );

  // Foto o iniciales.
  const foto = fotoDataUrl ? await loadImage(fotoDataUrl) : null;
  const { x: fx, y: fy, w: fw, h: fh, radius, border } = LAYOUT.foto;
  if (foto) {
    ctx.save();
    roundRectPath(ctx, fx, fy, fw, fh, radius);
    ctx.clip();
    drawImageCover(ctx, foto, fx, fy, fw, fh);
    ctx.restore();

    roundRectPath(ctx, fx, fy, fw, fh, radius);
    ctx.lineWidth = border;
    ctx.strokeStyle = PDF_COLORS.band;
    ctx.stroke();
  } else {
    roundRectPath(ctx, fx, fy, fw, fh, radius);
    ctx.fillStyle = PDF_COLORS.band;
    ctx.fill();

    ctx.fillStyle = PDF_COLORS.white;
    ctx.font = `bold 84px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(iniciales || VACIO, fx + fw / 2, fy + fh / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // Bloque de datos.
  const filas = [
    { label: "Número de empleado", valor: numero, size: 22 },
    { label: "Nombre completo", valor: nombre, size: 24 },
    { label: "Puesto", valor: puesto, size: 22 },
    { label: "Departamento", valor: departamento, size: 22 },
  ];
  const { x: dx, w: dw, startY, step } = LAYOUT.datos;
  filas.forEach((fila, indice) => {
    const y = startY + indice * step;

    // Separador primero, para que el texto quede encima si llega a envolver.
    ctx.strokeStyle = PDF_COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dx, y + LAYOUT.fila.separadorOffset);
    ctx.lineTo(dx + dw, y + LAYOUT.fila.separadorOffset);
    ctx.stroke();

    ctx.fillStyle = PDF_COLORS.muted;
    ctx.font = `bold 13px ${FONT}`;
    setLetterSpacing(ctx, "1px");
    ctx.fillText(fila.label.toUpperCase(), dx, y + LAYOUT.fila.labelOffset);
    setLetterSpacing(ctx, "0px");

    ctx.fillStyle = PDF_COLORS.ink;
    ctx.font = `${fila.size}px ${FONT}`;
    const lineas = wrapLines(ctx, fila.valor, dw, 2);
    const lineHeight = fila.size + 4;
    lineas.forEach((linea, i) => {
      ctx.fillText(linea, dx, y + LAYOUT.fila.valorOffset + i * lineHeight);
    });
  });

  // QR con quiet zone blanca y etiqueta debajo.
  const qr = qrDataUrl ? await loadImage(qrDataUrl) : null;
  const { x: qx, y: qy, size: qs, quiet } = LAYOUT.qr;
  ctx.fillStyle = PDF_COLORS.white;
  ctx.fillRect(qx - quiet, qy - quiet, qs + quiet * 2, qs + quiet * 2);
  if (qr) {
    // Sin suavizado: el QR viene a mayor resolución y al reducirlo los módulos
    // deben quedar con bordes duros, no difuminados.
    const prevSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qr, qx, qy, qs, qs);
    ctx.imageSmoothingEnabled = prevSmoothing;
  }

  ctx.fillStyle = PDF_COLORS.muted;
  ctx.font = `${LAYOUT.qrLabel.size}px ${FONT}`;
  ctx.textAlign = "center";
  const etiquetas = wrapLines(
    ctx,
    "Escanea para verificar esta credencial",
    qs + 40,
    LAYOUT.qrLabel.maxLines
  );
  etiquetas.forEach((linea, i) => {
    ctx.fillText(linea, LAYOUT.qrLabel.cx, LAYOUT.qrLabel.baseline + i * LAYOUT.qrLabel.lineHeight);
  });
  ctx.textAlign = "left";

  // Pie.
  ctx.strokeStyle = PDF_COLORS.bandAccent;
  ctx.lineWidth = LAYOUT.footerLine.h;
  ctx.beginPath();
  ctx.moveTo(LAYOUT.footerLine.x, LAYOUT.footerLine.y);
  ctx.lineTo(LAYOUT.footerLine.x + LAYOUT.footerLine.w, LAYOUT.footerLine.y);
  ctx.stroke();

  ctx.fillStyle = PDF_COLORS.muted;
  ctx.font = `${LAYOUT.footerSize}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(numero, LAYOUT.footerLeftX, LAYOUT.footerBaseline);
  ctx.textAlign = "right";
  ctx.fillText(`credencial-empleado · ${year}`, LAYOUT.footerRightX, LAYOUT.footerBaseline);
  ctx.textAlign = "left";
};
