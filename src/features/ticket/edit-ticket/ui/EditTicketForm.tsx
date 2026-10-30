import {
  ITFlex,
  ITInput,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { LuFileText, LuFlag } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import { FormSection } from "@shared/ui/form-section";
import { PRIORITY_TONE } from "@entities/ticket";
import type { TicketEditDraft } from "../model/useEditTicket";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

interface Props {
  form: TicketEditDraft;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof TicketEditDraft, value: string) => void;
}

export default function EditTicketForm({ form, errors, onFieldChange }: Props) {
  const { t: tt } = useTranslation("tickets");
  return (
    <ITFlex justify="center">
      <ITStack direction="column" spacing={5} className="w-full">
        <FormSection
          number={1}
          icon={<LuFileText size={16} />}
          title={tt("edit.formInfoTitle")}
          complete={!!form.title.trim() && !!form.description.trim()}
        >
          <ITStack direction="column" spacing={5} className="w-full">
            <div>
              <ITInput
                name="title"
                label={tt("edit.titleLabel")}
                value={form.title}
                onChange={(e) => onFieldChange("title", e.target.value)}
                placeholder={tt("edit.titlePlaceholder")}
                aria-invalid={!!errors?.title}
              />
              {errors?.title && (
                <ITText as="span" role="alert" className="mt-1 block text-xs text-[color:var(--color-danger)]">
                  {errors.title}
                </ITText>
              )}
            </div>

            <ITFlex direction="column" gap={1}>
              <ITTextarea
                name="description"
                label={tt("edit.descLabel")}
                value={form.description}
                onChange={(v) => onFieldChange("description", v)}
                placeholder={tt("edit.descPlaceholder")}
                rows={6}
              />
              <ITText className="text-right text-[11px] text-slate-400">
                {form.description.length} / 2000
              </ITText>
            </ITFlex>
          </ITStack>
        </FormSection>

        <FormSection number={2} icon={<LuFlag size={16} />} title={tt("edit.priorityTitle")} complete={!!form.priority}>
          <ITFlex gap={2} wrap="wrap">
            {PRIORITIES.map((value) => {
              const active = form.priority === value;
              const tone = PRIORITY_TONE[value];
              const color = tone === "neutral" ? "var(--color-slate-500)" : `var(--color-${tone})`;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onFieldChange("priority", value)}
                  className="cursor-pointer rounded-full !border-0 px-4 py-2 text-[12px] font-semibold transition-all"
                  style={
                    active
                      ? { background: color, color: "#ffffff" }
                      : {
                          background: `color-mix(in srgb, ${color} 14%, transparent)`,
                          color: `color-mix(in srgb, ${color} 78%, #000)`,
                        }
                  }
                >
                  {dyn(tt)(`priorityLabels.${value}`)}
                </button>
              );
            })}
          </ITFlex>
        </FormSection>
      </ITStack>
    </ITFlex>
  );
}
