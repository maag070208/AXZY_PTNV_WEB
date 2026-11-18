import { ToneChip } from "@shared/ui/tone-chip";

interface Props {
  diff: number;
  /** Texto cuando no hay diferencia (por defecto "0"). */
  zeroLabel?: string;
}

/** Diferencia contado − esperado: rojo faltante, ámbar sobrante, verde sin diferencia. */
export default function DiffChip({ diff, zeroLabel = "0" }: Props) {
  if (diff < 0) return <ToneChip tone="danger" label={String(diff)} />;
  if (diff > 0) return <ToneChip tone="warning" label={`+${diff}`} />;
  return <ToneChip tone="success" label={zeroLabel} />;
}
