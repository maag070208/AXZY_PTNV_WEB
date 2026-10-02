import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaDownload, FaFileExcel, FaUpload } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseDeviceImport } from "../model/useDeviceImport";

/**
 * Paso 1: la plantilla y el archivo.
 *
 * La plantilla la genera el API (mismos encabezados que lee el parser y el
 * catálogo de tipos vigente en una segunda hoja), así que no puede quedar
 * desincronizada con lo que la carga acepta.
 */
export default function ImportUploadCard({ fx }: { fx: UseDeviceImport }) {
  const { t } = useTranslation("inventory");

  const columns = [
    { name: t("import.colType"), hint: t("import.colTypeHint"), required: false },
    { name: t("import.colName"), hint: t("import.colNameHint"), required: true },
    { name: t("import.colBrand"), hint: t("import.colBrandHint"), required: false },
    { name: t("import.colModel"), hint: t("import.colBrandHint"), required: false },
    { name: t("import.colQuantity"), hint: t("import.colQuantityHint"), required: true },
  ];

  return (
    <ITFlex direction="column" gap={5}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <PanelCard
        title={t("import.templateTitle")}
        description={t("import.templateDescription")}
        actions={
          <ITButton variant="outlined" color="secondary" onClick={() => void fx.downloadTemplate()}>
            <ITFlex align="center" gap={1}>
              <FaDownload size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.downloadTemplate")}</ITText>
            </ITFlex>
          </ITButton>
        }
      >
        <div className="grid gap-3 sm:!grid-cols-2 lg:!grid-cols-5">
          {columns.map((column) => (
            <div key={column.name} className="rounded-xl border border-slate-200 !bg-white p-3">
              <ITText className="!text-[10px] font-black uppercase tracking-wider text-slate-700">
                {column.name}
                {column.required ? " *" : ""}
              </ITText>
              <ITText className="mt-1 block !text-[11px] leading-snug text-slate-500">
                {column.hint}
              </ITText>
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard title={t("import.stepUpload")} description={t("import.dropHint")}>
        <input
          ref={fx.inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => fx.selectFile(event.target.files?.[0] ?? null)}
        />

        <ITFlex
          direction="column"
          align="center"
          justify="center"
          gap={3}
          className="rounded-2xl border border-dashed border-slate-300 !bg-slate-50/60 px-6 py-8"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#ea580c]">
            <FaFileExcel size={20} />
          </span>
          <ITText className="!text-[12px] font-semibold text-slate-600">
            {fx.file ? t("import.file", { name: fx.file.name }) : t("import.dropHint")}
          </ITText>
          <ITFlex align="center" gap={2} wrap="wrap" justify="center">
            <ITButton
              variant="filled"
              color="primary"
              disabled={fx.loading}
              onClick={() => fx.inputRef.current?.click()}
            >
              <ITFlex align="center" gap={1}>
                <FaUpload size={11} />
                <ITText className="!text-[11px] font-bold">
                  {fx.loading ? t("import.reading") : t("import.chooseFile")}
                </ITText>
              </ITFlex>
            </ITButton>
            {fx.file && (
              <ITButton variant="outlined" color="secondary" onClick={fx.reset} disabled={fx.loading}>
                <ITText className="!text-[11px] font-bold">{t("import.changeFile")}</ITText>
              </ITButton>
            )}
          </ITFlex>
        </ITFlex>
      </PanelCard>
    </ITFlex>
  );
}
