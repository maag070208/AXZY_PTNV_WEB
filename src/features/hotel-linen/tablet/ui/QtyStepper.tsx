import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaMinus, FaPlus } from "react-icons/fa";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

/** Cantidad con botones grandes − / + (uso táctil). */
export default function QtyStepper({ value, onChange, min = 0, max = 999, disabled = false }: Props) {
  return (
    <ITFlex align="center" gap={3}>
      <ITButton variant="outlined" color="secondary" className="!h-14 !w-14 !rounded-full" icon={<FaMinus size={16} />} disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))} />
      <ITText className="min-w-[48px] text-center text-[24px] font-bold tabular-nums">{value}</ITText>
      <ITButton variant="outlined" color="secondary" className="!h-14 !w-14 !rounded-full" icon={<FaPlus size={16} />} disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))} />
    </ITFlex>
  );
}
