import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaFileExcel, FaUpload } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseEmployeeSync } from "../model/useEmployeeSync";

/**
 * Paso 1: elegir el Excel de nómina y pedir la previsualización.
 *
 * La previsualización no escribe nada: solo lee el archivo y propone altas,
 * bajas, cambios y filas por resolver.
 */
export default function EmployeeSyncUploadCard({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");

  return (
    <PanelCard
      title={t("sync.upload.title")}
      description={t("sync.upload.description")}
      icon={<FaFileExcel size={16} />}
    >
      <ITFlex direction="column" gap={3}>
        <ITAlert variant="info">{t("sync.upload.columns")}</ITAlert>

        <input
          ref={fx.inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => fx.selectFile(event.target.files?.[0] ?? null)}
        />

        <ITFlex
          align="center"
          gap={3}
          wrap="wrap"
          className="rounded-2xl border border-dashed border-slate-300 !bg-slate-50/60 px-5 py-6"
        >
          <ITText
            as="span"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-success-soft)] text-[color:color-mix(in_srgb,var(--color-success)_70%,black)]"
          >
            <FaFileExcel size={20} />
          </ITText>
          <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
            <ITText className="truncate !text-[12.5px] font-semibold text-slate-700">
              {fx.file ? t("sync.upload.chosen", { name: fx.file.name }) : t("sync.upload.noFile")}
            </ITText>
            <ITText muted className="!text-[11px]">
              {t("sync.upload.dropHint")}
            </ITText>
          </ITFlex>
          <ITFlex align="center" gap={2} wrap="wrap">
            <ITButton
              variant="outlined"
              color="secondary"
              disabled={fx.loading}
              onClick={() => fx.inputRef.current?.click()}
            >
              <ITFlex align="center" gap={1}>
                <FaFileExcel size={11} />
                <ITText className="!text-[11px] font-bold">{t("sync.upload.choose")}</ITText>
              </ITFlex>
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              disabled={!fx.file || fx.loading}
              onClick={() => void fx.runPreview()}
            >
              <ITFlex align="center" gap={1}>
                <FaUpload size={11} />
                <ITText className="!text-[11px] font-bold">
                  {fx.loading ? t("sync.upload.reading") : t("sync.upload.preview")}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITFlex>
    </PanelCard>
  );
}
