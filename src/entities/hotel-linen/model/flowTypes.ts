/** Tablero de flujo de blancos: 7 etapas + en tránsito, con detalle por artículo. */
export const FLOW_STAGES = ["AREAS", "DIRTY", "LAUNDRY", "CLEAN", "LENT", "QUARANTINE", "STORE"] as const;
export type FlowStage = (typeof FLOW_STAGES)[number];

export interface FlowItem {
  productId: string;
  code: string;
  name: string;
  size: string | null;
  stages: Record<FlowStage, number>;
  /** Parte de `LENT` que está en habitaciones por adicionales abiertos. */
  inRooms: number;
  /** Fuera de las 7 etapas (apartado HOLD, equipos). */
  other: number;
  inTransit: number;
  total: number;
}

export interface FlowBoard {
  kind: string;
  stages: FlowStage[];
  totals: { stages: Record<FlowStage, number>; inRooms: number; other: number; inTransit: number; total: number };
  /** El detalle por artículo cuadra con /stock/summary. */
  reconciled: boolean;
  mismatches: string[];
  summaryTotal: number;
  items: FlowItem[];
}
