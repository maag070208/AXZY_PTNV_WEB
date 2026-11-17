import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITAlert, ITButton, ITCard, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaUndo } from "react-icons/fa";
import { useGetSysConfig, useUpdateSysConfig } from "@features/sys-config";

const KEY = "TIME_CLOCK_DUPLICATE_MINUTES";
const DEFAULT_MINUTES = 2;
const MAX_MINUTES = 30;

/** Entero 0..30; un valor inválido cae al default (igual que el API). */
const toMinutes = (raw: string | null | undefined): number => {
  const n = Number(raw);
  if (raw === null || raw === undefined || raw.trim() === "" || !Number.isFinite(n)) return DEFAULT_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(0, Math.round(n)));
};

interface Props {
  onResult: (message: string, type: "success" | "error") => void;
}

/**
 * Ventana de checadas duplicadas (`sys_config.TIME_CLOCK_DUPLICATE_MINUTES`):
 * dos checadas más cercanas que esto cuentan como una. Afecta jornadas,
 * tiempo extra y la línea de tiempo.
 */
export default function DuplicateWindowCard({ onResult }: Props) {
  const { t, i18n } = useTranslation(["catalog", "common"]);
  const { data, loading, error, reload } = useGetSysConfig(KEY);
  const { mutate, loading: saving, error: saveError } = useUpdateSysConfig(KEY);

  const [minutes, setMinutes] = useState(String(DEFAULT_MINUTES));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) setMinutes(String(toMinutes(data?.value)));
  }, [data, dirty]);

  const handleSave = async () => {
    if (!dirty || saving) return;
    const value = toMinutes(minutes);
    try {
      await mutate(String(value));
      setMinutes(String(value));
      setDirty(false);
      onResult(t("sysConfig.duplicateWindowSaved"), "success");
      await reload();
    } catch {
      onResult(t("sysConfig.duplicateWindowSaveError"), "error");
    }
  };

  const handleReset = () => {
    setMinutes(String(toMinutes(data?.value)));
    setDirty(false);
  };

  return (
    <ITCard
      title={t("sysConfig.duplicateWindowLabel")}
      className="!p-5 border border-slate-200"
      actions={
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={handleReset} disabled={!dirty || saving}>
            <ITFlex align="center" gap={1}>
              <FaUndo size={12} />
              <ITText className="font-bold text-[11px]">{t("common:actions.cancel")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={handleSave} disabled={!dirty || saving}>
            <ITText className="font-bold text-[11px]">
              {saving ? t("sysConfig.saving") : t("sysConfig.save")}
            </ITText>
          </ITButton>
        </ITFlex>
      }
    >
      {(error || saveError) && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {error ?? saveError}
        </ITAlert>
      )}

      <ITInput
        name="timeClockDuplicateMinutes"
        type="number"
        label={t("sysConfig.duplicateWindowLabel")}
        value={minutes}
        disabled={loading || saving}
        onChange={(e) => {
          setMinutes(e.target.value);
          setDirty(true);
        }}
      />

      <ITText className="mt-2 block text-[11px] text-slate-500">{t("sysConfig.duplicateWindowHelp")}</ITText>

      {data?.updatedBy && (
        <ITText className="mt-3 block text-[10px] text-slate-400">
          {data.updatedBy.name} · {new Date(data.updatedAt).toLocaleString(i18n.language)}
        </ITText>
      )}
    </ITCard>
  );
}
