import type { OptionStyle } from "./optionStyles";

interface Props extends OptionStyle {
  label: string;
  delay?: number;
  onClick: () => void;
}

// Opción tocable del chat, al estilo del ejemplo: pastilla blanca con borde
// suave y emoji a color. Se eleva al pasar el cursor y se encoge al tocarla.
export default function OptionChip({ emoji, label, delay = 0, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="agent-pop inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-95"
    >
      <span aria-hidden className="text-sm leading-none">
        {emoji}
      </span>
      {label}
    </button>
  );
}
