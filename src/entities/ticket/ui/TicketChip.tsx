import type { ReactNode } from "react";
import { ToneChip, type ToneChipTone } from "@shared/ui/tone-chip";

export type TicketChipTone = ToneChipTone;

interface Props {
  label: string;
  tone?: TicketChipTone;
  icon?: ReactNode;
  className?: string;
}

/** Chip de estado/prioridad de tickets: envoltorio delgado de `ToneChip`. */
export default function TicketChip({ label, tone = "neutral", icon, className }: Props) {
  return <ToneChip label={label} tone={tone} icon={icon} className={className} />;
}
