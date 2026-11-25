import { LuCircleHelp } from "react-icons/lu";

/** Botón «?» pequeño con la explicación en tooltip nativo y como etiqueta accesible. */
export default function HelpHint({ text }: { text: string }) {
  return (
    <button
      type="button"
      title={text}
      aria-label={text}
      className="inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full text-slate-500 hover:text-slate-900"
    >
      <LuCircleHelp size={15} />
    </button>
  );
}
