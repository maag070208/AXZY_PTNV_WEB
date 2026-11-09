import { createElement } from "react";
import { pdf } from "@react-pdf/renderer";
import type { HotelProduct, HotelProductKind } from "@entities/hotel-linen";
import BlankFormPdf, { type BlankFormConfig } from "../ui/BlankFormPdf";

export type GenericBlankForm = "delivery" | "dirty" | "towelLoan" | "extras" | "equipmentLoan";

const label = (p: HotelProduct) => (p.size ? `${p.name} · ${p.size}` : p.name);

const FORMS: Record<GenericBlankForm, { meta: string[]; columns: string[]; kinds: HotelProductKind[] | null; blankRows: number; signatures: string[] }> = {
  delivery: { meta: ["area", "date", "shift", "cart"], columns: ["item", "delivered", "received", "notes"], kinds: ["LINEN"], blankRows: 2, signatures: ["delivers", "receives"] },
  dirty: { meta: ["area", "cart", "date", "shift"], columns: ["item", "deliveredFloor", "receivedDirty", "inUse", "shortage", "good", "stained", "damaged"], kinds: ["LINEN"], blankRows: 2, signatures: ["delivers", "receives"] },
  towelLoan: { meta: ["point", "date", "shift"], columns: ["voucher", "guest", "room", "quantity", "deposit", "method", "returned", "signature"], kinds: null, blankRows: 18, signatures: ["lends", "closes"] },
  extras: { meta: ["date", "shift"], columns: ["room", "item", "quantity", "requestedBy", "deliveredBy", "collectedBy", "missing"], kinds: null, blankRows: 18, signatures: ["delivers", "receives"] },
  equipmentLoan: { meta: ["date", "shift"], columns: ["tag", "equipment", "room", "deliveredAt", "test", "returnedAt", "condition", "signature"], kinds: null, blankRows: 18, signatures: ["delivers", "receives"] },
};

/** Arma la configuración del formato con el catálogo vivo (solo los de lista de artículos lo usan). */
export const buildBlankFormConfig = (kind: GenericBlankForm, products: HotelProduct[]): BlankFormConfig => {
  const f = FORMS[kind];
  const items = f.kinds
    ? products.filter((p) => p.active && f.kinds!.includes(p.kind)).sort((a, b) => a.code.localeCompare(b.code)).map((p) => ({ code: p.code, label: label(p) }))
    : [];
  return { kind, meta: f.meta, columns: f.columns, items, blankRows: f.blankRows, signatures: f.signatures };
};

const save = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

/** Genera y descarga el formato en blanco (`formato-<tipo>.pdf`). */
export const downloadBlankFormPdf = async (kind: GenericBlankForm, products: HotelProduct[]): Promise<void> => {
  const config = buildBlankFormConfig(kind, products);
  const blob = await pdf(createElement(BlankFormPdf, { config }) as any).toBlob();
  save(blob, `formato-${kind}.pdf`);
};
