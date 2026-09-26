/**
 * Inserción de metadatos de resolución (DPI) en un PNG.
 *
 * El canvas exporta la imagen a 1016 × 638 px, pero sin declarar su densidad
 * física. El chunk `pHYs` del PNG indica los píxeles por unidad (metro) para
 * que imprenta y visores sepan que esos píxeles son 8.6 × 5.4 cm a 300 DPI.
 *
 * Se implementa aquí, sin dependencias: CRC-32 con el polinomio estándar PNG
 * (0xEDB88320) y el chunk insertado justo después de `IHDR`.
 */

const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Tabla CRC-32 (polinomio 0xEDB88320), calculada una sola vez. */
const CRC_TABLE = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

const leerUint32 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]) >>>
  0;

/** Arma el chunk `pHYs`: X px/metro, Y px/metro, unidad = 1 (metro). */
const construirChunkPhys = (pixelesPorMetro: number): Uint8Array => {
  const tipo = new Uint8Array([0x70, 0x48, 0x59, 0x73]); // "pHYs"
  const datos = new Uint8Array(9);
  const vistaDatos = new DataView(datos.buffer);
  vistaDatos.setUint32(0, pixelesPorMetro);
  vistaDatos.setUint32(4, pixelesPorMetro);
  datos[8] = 1;

  const chunk = new Uint8Array(4 + tipo.length + datos.length + 4);
  const vista = new DataView(chunk.buffer);
  vista.setUint32(0, datos.length);
  chunk.set(tipo, 4);
  chunk.set(datos, 8);

  const crcInput = new Uint8Array(tipo.length + datos.length);
  crcInput.set(tipo, 0);
  crcInput.set(datos, tipo.length);
  vista.setUint32(8 + datos.length, crc32(crcInput));

  return chunk;
};

const esPng = (bytes: Uint8Array): boolean =>
  bytes.length > FIRMA_PNG.length && FIRMA_PNG.every((b, i) => bytes[i] === b);

/**
 * Devuelve una copia del PNG con un chunk `pHYs` declarando `dpi`.
 *
 * Si los bytes no son un PNG, se devuelven intactos.
 */
export const setPngDpi = (bytes: Uint8Array, dpi: number): Uint8Array => {
  if (!esPng(bytes)) return bytes;

  const pixelesPorMetro = Math.round(dpi / 0.0254);

  // Salto del bloque IHDR: firma(8) + largo(4) + tipo(4) + datos + crc(4).
  const largoIhdr = leerUint32(bytes, 8);
  const finIhdr = 8 + 4 + 4 + largoIhdr + 4;

  const chunk = construirChunkPhys(pixelesPorMetro);
  const salida = new Uint8Array(bytes.length + chunk.length);
  salida.set(bytes.subarray(0, finIhdr), 0);
  salida.set(chunk, finIhdr);
  salida.set(bytes.subarray(finIhdr), finIhdr + chunk.length);

  return salida;
};
