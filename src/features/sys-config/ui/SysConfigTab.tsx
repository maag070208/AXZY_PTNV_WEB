import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITText,
  ITTextarea,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaEnvelope, FaUndo } from "react-icons/fa";
import {
  parseEmailRecipients,
  useGetSysConfig,
  useUpdateSysConfig,
} from "@features/sys-config";

const KEY = "EMAIL_NOTIFICATION_RECIPIENTS";

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function SysConfigTab() {
  const { t } = useTranslation(["catalog", "common"]);
  const { data, loading, error, reload } = useGetSysConfig(KEY);
  const { mutate, loading: saving, error: saveError } = useUpdateSysConfig(KEY);

  const [draft, setDraft] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Hidratar el editor cuando llega el valor remoto (solo si no está editando).
  useEffect(() => {
    if (data && !dirty) setDraft(data.value);
  }, [data, dirty]);

  const { valid, invalid } = parseEmailRecipients(draft);
  const hasErrors = invalid.length > 0;
  const canSave = dirty && draft.trim().length > 0 && !hasErrors && !saving;

  const recipientList = useMemo(
    () =>
      (data?.value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [data?.value]
  );

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await mutate(draft);
      setDirty(false);
      setToast({ message: t("sysConfig.saved"), type: "success" });
      await reload();
    } catch {
      setToast({ message: t("sysConfig.saveError"), type: "error" });
    }
  };

  const handleReset = () => {
    setDraft(data?.value ?? "");
    setDirty(false);
  };

  return (
    <ITFlex direction="column" gap={4} className="pt-2">
      <ITFlex align="center" gap={2}>
        <FaEnvelope className="text-[#0a4560]" />
        <ITText className="text-sm font-bold text-slate-800">
          {t("sysConfig.title")}
        </ITText>
      </ITFlex>

      <p className="text-xs text-slate-500 -mt-2">{t("sysConfig.subtitle")}</p>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {error}
        </ITAlert>
      )}
      {saveError && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {saveError}
        </ITAlert>
      )}

      <ITCard
        title={t("sysConfig.currentValue")}
        className="!p-5 border border-slate-200"
      >
        {loading ? (
          <ITText className="text-xs text-slate-400">—</ITText>
        ) : recipientList.length > 0 ? (
          <ITFlex gap={1.5} className="flex-wrap">
            {recipientList.map((email) => (
              <ITBadget key={email} color="primary" size="lg">
                {email}
              </ITBadget>
            ))}
          </ITFlex>
        ) : (
          <ITText className="text-xs italic text-slate-400">
            {t("sysConfig.empty")}
          </ITText>
        )}
        {data?.updatedBy && (
          <ITText className="text-[10px] text-slate-400 mt-3 block">
            {data.updatedBy.name} ·{" "}
            {new Date(data.updatedAt).toLocaleString("es-MX")}
          </ITText>
        )}
      </ITCard>

      <ITCard
        title={t("sysConfig.recipientsLabel")}
        className="!p-5 border border-slate-200"
        actions={
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={handleReset}
              disabled={!dirty || saving}
            >
              <ITFlex align="center" gap={1}>
                <FaUndo size={12} />
                <ITText className="font-bold text-[11px]">
                  {t("common:actions.cancel")}
                </ITText>
              </ITFlex>
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSave}
              disabled={!canSave}
            >
              <ITText className="font-bold text-[11px]">
                {saving ? t("sysConfig.saving") : t("sysConfig.save")}
              </ITText>
            </ITButton>
          </ITFlex>
        }
      >
        <ITTextarea
          name="recipients"
          value={draft}
          onChange={(value) => {
            setDraft(value);
            setDirty(true);
          }}
          placeholder="aamaro@axzy.dev, maag070208@gmail.com"
          rows={4}
        />
        <ITText className="text-[11px] text-slate-500 mt-1 block">
          {t("sysConfig.recipientsHelp")}
        </ITText>
        <ITFlex justify="between" align="center" className="mt-2">
          <ITText
            className={`text-[11px] font-bold ${
              hasErrors ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {hasErrors
              ? t("sysConfig.invalidCount", { n: invalid.length })
              : t("sysConfig.validCount", { n: valid.length })}
          </ITText>
          {hasErrors && (
            <ITText className="text-[11px] text-red-500 truncate max-w-[60%]">
              {invalid.slice(0, 3).join(", ")}
              {invalid.length > 3 ? "…" : ""}
            </ITText>
          )}
        </ITFlex>
      </ITCard>

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}