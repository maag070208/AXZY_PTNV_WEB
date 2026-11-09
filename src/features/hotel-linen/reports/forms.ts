export const BLANK_FORMS = ["delivery", "dirty", "writeoff", "towelLoan", "extras", "equipmentLoan", "amenityWeekly"] as const;
export type BlankFormKind = (typeof BLANK_FORMS)[number];
