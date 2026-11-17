/** Número a letra en español (hasta 999,999,999) y monto en pesos mexicanos. */

const UNITS = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ",
  "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
  "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO",
  "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
];
const TENS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
const HUNDREDS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

/** 1..999 en letra. */
const below1000 = (n: number): string => {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(HUNDREDS[h]);
  if (rest > 0) {
    if (rest < 30) parts.push(UNITS[rest]);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u ? `${TENS[t]} Y ${UNITS[u]}` : TENS[t]);
    }
  }
  return parts.join(" ");
};

/** Antes de "mil"/"millones" el uno se apocopa: UN, VEINTIÚN. */
const apocopate = (text: string): string =>
  text.replace(/VEINTIUNO$/, "VEINTIÚN").replace(/UNO$/, "UN");

/** Entero (0..999,999,999) en letra, en mayúsculas. */
export const integerToWords = (value: number): string => {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "CERO";
  if (n > 999_999_999) throw new RangeError("numberToWords: máximo 999,999,999");
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const units = n % 1000;
  const parts: string[] = [];
  if (millions) {
    parts.push(millions === 1 ? "UN MILLÓN" : `${apocopate(below1000(millions))} MILLONES`);
  }
  if (thousands) {
    parts.push(thousands === 1 ? "MIL" : `${apocopate(below1000(thousands))} MIL`);
  }
  if (units) parts.push(below1000(units));
  return parts.join(" ");
};

/**
 * Monto en pesos con centavos como fracción: 12345.5 →
 * "DOCE MIL TRESCIENTOS CUARENTA Y CINCO PESOS 50/100 M.N.".
 */
export const amountToWordsMxn = (amount: number): string => {
  const cents = Math.round(Math.abs(amount) * 100);
  const pesos = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  const words = integerToWords(pesos);
  // "UN MILLÓN DE PESOS": el "DE" solo cuando la cifra termina en millón(es).
  const de = pesos > 0 && pesos % 1_000_000 === 0 ? " DE" : "";
  const unit = pesos === 1 ? "PESO" : "PESOS";
  return `${words}${de} ${unit} ${rest}/100 M.N.`;
};

/** `12345.5` → `$12,345.50`. */
export const formatMxn = (amount: number): string =>
  `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
