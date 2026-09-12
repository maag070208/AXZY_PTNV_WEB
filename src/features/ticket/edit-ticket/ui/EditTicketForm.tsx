import {
  ITFlex,
  ITInput,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import {
  FaBan,
  FaExclamationTriangle,
  FaFire,
  FaInfoCircle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import type { TicketEditDraft } from "../model/useEditTicket";

const PRIORITIES = [
  { value: "BAJA", icon: <FaInfoCircle size={11} />, color: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200", activeColor: "bg-slate-600 text-white border-slate-600" },
  { value: "MEDIA", icon: <FaExclamationTriangle size={11} />, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", activeColor: "bg-amber-500 text-white border-amber-500" },
  { value: "ALTA", icon: <FaFire size={11} />, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", activeColor: "bg-orange-500 text-white border-orange-500" },
  { value: "URGENTE", icon: <FaBan size={11} />, color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100", activeColor: "bg-red-500 text-white border-red-500" },
];

interface Props {
  form: TicketEditDraft;
  onFieldChange: (field: keyof TicketEditDraft, value: string) => void;
}

export default function EditTicketForm({ form, onFieldChange }: Props) {
  const { t: tt } = useTranslation("tickets");
  return (
    <ITFlex justify="center">
      <ITStack direction="column" spacing={5} className="w-full">
        <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
          <ITStack direction="column" spacing={5} className="w-full">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("edit.formInfoTitle")}
            </ITText>

            <ITInput
              name="titulo"
              label={tt("edit.titleLabel")}
              value={form.titulo}
              onChange={(e) => onFieldChange("titulo", e.target.value)}
              placeholder={tt("edit.titlePlaceholder")}
            />

            <ITFlex direction="column" gap={1}>
              <ITTextarea
                name="descripcion"
                label={tt("edit.descLabel")}
                value={form.descripcion}
                onChange={(v) => onFieldChange("descripcion", v)}
                placeholder={tt("edit.descPlaceholder")}
                rows={6}
              />
              <ITText className="text-[9px] text-slate-400 text-right">
                {form.descripcion.length} / 2000
              </ITText>
            </ITFlex>
          </ITStack>
        </ITFlex>

        <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
          <ITStack direction="column" spacing={4} className="w-full">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("edit.priorityTitle")}
            </ITText>

            <ITFlex gap={2} wrap="wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onFieldChange("priority", p.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                    form.priority === p.value ? p.activeColor : p.color
                  }`}
                >
                  {p.icon}
                  {dyn(tt)(`priorityLabels.${p.value}`)}
                </button>
              ))}
            </ITFlex>
          </ITStack>
        </ITFlex>
      </ITStack>
    </ITFlex>
  );
}