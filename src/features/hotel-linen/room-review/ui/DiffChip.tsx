import { ITBadget } from "@axzydev/axzy_ui_system";

interface Props {
  diff: number;
  /** Texto cuando no hay diferencia (por defecto "0"). */
  zeroLabel?: string;
}

/** Diferencia contado − esperado: rojo faltante, ámbar sobrante, verde sin diferencia. */
export default function DiffChip({ diff, zeroLabel = "0" }: Props) {
  if (diff < 0) return <ITBadget color="danger" size="lg">{diff}</ITBadget>;
  if (diff > 0) return <ITBadget color="warning" size="lg">{`+${diff}`}</ITBadget>;
  return <ITBadget color="success" size="lg">{zeroLabel}</ITBadget>;
}
