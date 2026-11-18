// Revisión de habitación: lo contado contra lo esperado por la dotación de blancos.
export type ReviewShift = "MORNING" | "AFTERNOON" | "NIGHT";
export const REVIEW_SHIFTS: readonly ReviewShift[] = ["MORNING", "AFTERNOON", "NIGHT"];

export interface ReviewProduct {
  id: string;
  code: string;
  name: string;
  size: string | null;
}

export interface ReviewTotals {
  expected: number;
  counted: number;
  missing: number;
  surplus: number;
}

export interface RoomReviewLine {
  product: ReviewProduct;
  expected: number;
  counted: number;
  /** counted − expected. */
  diff: number;
  unexpected: boolean;
}

export interface RoomReview {
  id: string;
  folio: string;
  room: { id: string; number: string; zoneId: string; zone: { id: string; name: string } };
  reviewedBy: { id: string; name: string };
  responsible: { id: string; name: string };
  shift: ReviewShift;
  reviewedAt: string;
  notes: string | null;
  totals: ReviewTotals;
  lines: RoomReviewLine[];
}

export interface RoomReviewInput {
  roomId: string;
  responsibleId: string;
  shift: ReviewShift;
  notes?: string | null;
  lines: Array<{ productId: string; counted: number }>;
}

/** GET /hotel/linen/rooms/:id/expected */
export interface RoomExpected {
  room: {
    id: string;
    number: string;
    zone: { id: string; name: string };
    type: { id: string; name: string };
    kingBeds: number;
    queenBeds: number;
    sofaBeds: number;
    bathrooms: number;
  };
  expected: Array<{ product: { id: string; code: string; name: string; kind: string }; quantity: number }>;
}

export interface ConsolidatedProductRow {
  product: ReviewProduct;
  expected: number;
  counted: number;
  missing: number;
  surplus: number;
}

export interface ConsolidatedResponsibleRow {
  responsible: { id: string; name: string };
  reviews: number;
  missing: number;
  surplus: number;
}

export interface RoomReviewConsolidated {
  from: string;
  to: string;
  reviews: number;
  byProduct: ConsolidatedProductRow[];
  byResponsible: ConsolidatedResponsibleRow[];
}
