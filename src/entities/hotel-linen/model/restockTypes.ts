/** Reposición por dotación: objetivo, existencia, en camino y déficit por artículo de blancos. */
export const RESTOCK_FACTORS = [1, 2, 3, 4, 5] as const;

export interface RestockLine {
  productId: string;
  code: string;
  name: string;
  size: string | null;
  target: number;
  onHand: number;
  incoming: number;
  deficit: number;
}

export interface RestockResult {
  warehouse: { id: string; code: string; name: string };
  factor: number;
  rooms: number;
  totals: { target: number; onHand: number; incoming: number; deficit: number };
  lines: RestockLine[];
}
