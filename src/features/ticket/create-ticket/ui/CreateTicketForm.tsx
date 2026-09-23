import {
  ITBadget,
  ITDropfile,
  FileTypeEnum,
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import {
  FaBan,
  FaExclamationTriangle,
  FaFire,
  FaInfoCircle,
  FaPaperclip,
  FaTicketAlt,
} from "react-icons/fa";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import type { TicketCategory } from "@entities/ticket";
import type { TicketDraft } from "../model/useCreateTicket";
import { PRIORITIES } from "../model/constants";

interface Props {
  form: TicketDraft;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof TicketDraft, value: string) => void;
  categories: TicketCategory[];
  files: File[];
  onAddFile: (file: File) => void;
  onRemoveFile: (index: number) => void;
  dropfileKey: number;
}

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Each priority carries its own semantic color, used consistently
// across the segmented control, the badge, and the submit-area accent.
const PRIORITY_PRESETS: Record<
  string,
  { icon: ReactNode; ring: string; text: string; dot: string }
> = {
  BAJA: {
    icon: <FaInfoCircle size={12} />,
    ring: "ring-slate-300",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  MEDIA: {
    icon: <FaExclamationTriangle size={12} />,
    ring: "ring-amber-300",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  ALTA: {
    icon: <FaFire size={12} />,
    ring: "ring-orange-300",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  URGENTE: {
    icon: <FaBan size={12} />,
    ring: "ring-red-300",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export default function CreateTicketForm({
  form,
  errors,
  onFieldChange,
  categories,
  files,
  onAddFile,
  onRemoveFile,
  dropfileKey,
}: Props) {
  const { t: tt } = useTranslation("tickets");

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const selectedPriority = PRIORITIES.find((p) => p.value === form.priority);
  const selectedPreset = selectedPriority
    ? PRIORITY_PRESETS[selectedPriority.value]
    : undefined;

  return (
    <ITGrid container columns={12} spacing={6}>
      <ITGrid item xs={12} lg={8}>
        <ITFlex direction="column" gap={6}>
          <ITFlex
            as="section"
            direction="column"
            gap={6}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <ITFlex direction="column" gap={1}>
              <ITText as="h2" className="text-xl font-bold text-slate-900">
                {tt("new.formTitle")}
              </ITText>
              <ITText as="p" className="max-w-lg text-sm leading-6 text-slate-500">
                {tt("new.formSub")}
              </ITText>
            </ITFlex>

            <ITGrid container columns={12} spacing={5}>
              <ITGrid item xs={12} md={7}>
                <ITInput
                  name="titulo"
                  label={tt("new.titleLabel")}
                  value={form.titulo}
                  onChange={(e) => onFieldChange("titulo", e.target.value)}
                  placeholder={tt("new.titlePlaceholder")}
                  required
                  aria-invalid={!!errors?.titulo}
                />
                {errors?.titulo && (
                  <span role="alert" className="text-red-500 text-xs mt-1 block">
                    {errors.titulo}
                  </span>
                )}
              </ITGrid>
              <ITGrid item xs={12} md={5}>
                <ITSelect
                  name="category"
                  label={tt("new.categoryLabel")}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.nombre,
                  }))}
                  value={form.categoryId}
                  onChange={(e) => onFieldChange("categoryId", e.target.value)}
                />
              </ITGrid>
            </ITGrid>

            <ITFlex direction="column" gap={1}>
              <ITTextarea
                name="descripcion"
                label={tt("new.descLabel")}
                value={form.descripcion}
                onChange={(v) => onFieldChange("descripcion", v)}
                placeholder={tt("new.descPlaceholder")}
                rows={7}
              />
              <ITText className="text-right text-xs text-slate-400">
                {form.descripcion.length} / 2000
              </ITText>
            </ITFlex>

            <ITFlex as="fieldset" direction="column" gap={2}>
              <ITText as="legend" className="text-sm font-semibold text-slate-700">
                {tt("new.urgency")}
              </ITText>
              <ITFlex gap={2} wrap="wrap">
                {PRIORITIES.map((p) => {
                  const preset = PRIORITY_PRESETS[p.value];
                  const isActive = form.priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => onFieldChange("priority", p.value)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? `border-transparent bg-slate-50 ring-2 ${preset.ring} ${preset.text}`
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {preset.icon}
                      <span>{dyn(tt)(`priorityLabels.${p.value}`)}</span>
                    </button>
                  );
                })}
              </ITFlex>
            </ITFlex>
          </ITFlex>
        </ITFlex>
      </ITGrid>

      <ITGrid item xs={12} lg={4}>
        <ITFlex direction="column" gap={4} className="lg:sticky lg:top-6">
          <ITFlex
            as="section"
            direction="column"
            gap={4}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <ITFlex align="center" gap={2}>
              <FaPaperclip className="text-slate-400" size={14} />
              <ITText className="text-sm font-semibold text-slate-800">
                {tt("new.evidenceTitle")}
              </ITText>
            </ITFlex>
            <ITText className="text-xs text-slate-400">
              {tt("new.evidenceSub")}
            </ITText>

            <ITDropfile
              key={dropfileKey}
              onFileSelect={() => {}}
              onSubmit={(file) => onAddFile(file)}
              acceptedFileTypes={[
                FileTypeEnum.PNG,
                FileTypeEnum.JPG,
                FileTypeEnum.JPEG,
                FileTypeEnum.PDF,
              ]}
              showStatusBadge
              containerClassName="!mt-0"
            />

            {files.length > 0 && (
              <ITFlex direction="column" gap={2}>
                {files.map((file, index) => (
                  <ITFlex
                    key={`${file.name}-${index}`}
                    justify="between"
                    align="center"
                    gap={2}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <ITFlex align="center" gap={2} className="min-w-0">
                      <FaPaperclip className="shrink-0 text-slate-400" size={11} />
                      <ITText className="truncate text-xs font-medium text-slate-600">
                        {file.name}
                      </ITText>
                      <ITText className="shrink-0 text-xs text-slate-400">
                        {formatBytes(file.size)}
                      </ITText>
                    </ITFlex>
                    <button
                      type="button"
                      className="shrink-0 cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
                      onClick={() => onRemoveFile(index)}
                    >
                      {tt("new.removeFile")}
                    </button>
                  </ITFlex>
                ))}
              </ITFlex>
            )}
          </ITFlex>

          {/* Compact status strip instead of a full duplicate card:
              only shows once category or priority is actually picked. */}
          {(form.categoryId || selectedPriority) && (
            <ITFlex
              align="center"
              justify="between"
              gap={2}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <ITFlex align="center" gap={2}>
                {selectedPreset && (
                  <span className={`h-2 w-2 rounded-full ${selectedPreset.dot}`} />
                )}
                <ITText className="text-xs text-slate-500">
                  {selectedCategory
                    ? selectedCategory.nombre
                    : tt("detail.category")}
                </ITText>
              </ITFlex>
              {selectedPriority && (
                <ITBadget color={selectedPriority.badgeColor} size="lg">
                  {dyn(tt)(`priorityLabels.${selectedPriority.value}`)}
                </ITBadget>
              )}
            </ITFlex>
          )}
        </ITFlex>
      </ITGrid>
    </ITGrid>
  );
}