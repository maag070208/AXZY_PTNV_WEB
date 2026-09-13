import {
  ITBadget,
  ITDropfile,
  FileTypeEnum,
  ITFlex,
  ITInput,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaPaperclip, FaTicketAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";
import type { TicketDraft } from "../model/useCreateTicket";
import { CATEGORIES, PRIORITIES } from "../model/constants";

interface Props {
  form: TicketDraft;
  onFieldChange: (field: keyof TicketDraft, value: string) => void;
  files: File[];
  onAddFile: (file: File) => void;
  onRemoveFile: (index: number) => void;
  dropfileKey: number;
}

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function CreateTicketForm({
  form,
  onFieldChange,
  files,
  onAddFile,
  onRemoveFile,
  dropfileKey,
}: Props) {
  const { t: tt } = useTranslation("tickets");
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-7 sm:px-8 sm:py-9 shadow-xl shadow-slate-200/40">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-50" />
          <div className="relative max-w-2xl mt-2">
            <ITFlex align="center" gap={2} className="mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FaTicketAlt size={14} /></span>
              <ITText className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">{tt("new.formHeadline")}</ITText>
            </ITFlex>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">{tt("new.formTitle")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{tt("new.formSub")}</p>
            <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
              <ITText className="mr-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{tt("new.urgency")}</ITText>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onFieldChange("priority", p.value)}
                  className={`rounded-full transition-all cursor-pointer ${form.priority === p.value ? "ring-2 ring-blue-200 ring-offset-1" : "opacity-75 hover:opacity-100"}`}
                >
                  <ITBadget color={p.badgeColor} size="small">{dyn(tt)(`priorityLabels.${p.value}`)}</ITBadget>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-100 bg-white p-5 sm:p-7 shadow-xl shadow-slate-200/35">
          <ITFlex align="center" gap={3} className="mb-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-600">01</span>
            <div>
              <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">{tt("new.step1Title")}</ITText>
              <ITText className="text-[10px] text-slate-400">{tt("new.step1Sub")}</ITText>
            </div>
          </ITFlex>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(190px,0.7fr)]">
              <ITInput name="titulo" label={tt("new.titleLabel")} value={form.titulo} onChange={(e) => onFieldChange("titulo", e.target.value)} placeholder={tt("new.titlePlaceholder")} required />
              <ITSelect name="category" label={tt("new.categoryLabel")} options={CATEGORIES.map((c) => ({ value: c, label: dyn(tt)(`categoryLabels.${c}`) }))} value={form.category} onChange={(e) => onFieldChange("category", e.target.value)} />
            </div>
            <ITTextarea name="descripcion" label={tt("new.descLabel")} value={form.descripcion} onChange={(v) => onFieldChange("descripcion", v)} placeholder={tt("new.descPlaceholder")} rows={7} />
            <ITText className="-mt-4 block text-right text-[9px] text-slate-400">{form.descripcion.length} / 2000</ITText>
          </div>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-5">
        <section className="rounded-[28px] border border-slate-100 bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/35">
          <ITFlex align="center" gap={3} className="mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FaPaperclip size={13} /></span>
            <div><ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">{tt("new.evidenceTitle")}</ITText><ITText className="text-[10px] text-slate-400">{tt("new.evidenceSub")}</ITText></div>
          </ITFlex>
          <ITDropfile
            key={dropfileKey}
            onFileSelect={() => {}}
            onSubmit={(file) => onAddFile(file)}
            acceptedFileTypes={[FileTypeEnum.PNG, FileTypeEnum.JPG, FileTypeEnum.JPEG, FileTypeEnum.PDF]}
            showStatusBadge
            containerClassName="!mt-0"
          />
          {files.length > 0 && (
            <ITFlex direction="column" gap={2} className="mt-4">
              {files.map((file, index) => (
                <ITFlex key={`${file.name}-${index}`} justify="between" align="center" gap={2} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <ITFlex align="center" gap={2} className="min-w-0">
                    <FaPaperclip className="shrink-0 text-slate-400" size={11} />
                    <ITText className="truncate text-[10px] font-bold text-slate-600">{file.name}</ITText>
                    <ITText className="shrink-0 text-[9px] text-slate-400">{formatBytes(file.size)}</ITText>
                  </ITFlex>
                  <button type="button" className="shrink-0 text-[10px] font-bold text-red-500 hover:text-red-700" onClick={() => onRemoveFile(index)}>{tt("new.removeFile")}</button>
                </ITFlex>
              ))}
            </ITFlex>
          )}
        </section>
      </aside>
    </div>
  );
}