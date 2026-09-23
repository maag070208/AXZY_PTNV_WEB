import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ITAlert,
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaEnvelope, FaPlus, FaTrashAlt, FaUndo } from "react-icons/fa";
import {
  isValidEmail,
  useGetSysConfig,
  useUpdateSysConfig,
} from "@features/sys-config";

const KEY = "EMAIL_NOTIFICATION_RECIPIENTS";

const splitRecipients = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function SysConfigTab() {
  const { t } = useTranslation(["catalog", "common"]);
  const { data, loading, error, reload } = useGetSysConfig(KEY);
  const { mutate, loading: saving, error: saveError } = useUpdateSysConfig(KEY);

  const [recipients, setRecipients] = useState<string[]>([]);
  const [draftEmail, setDraftEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Hidratar la lista cuando llega el valor remoto (solo si no está editando).
  useEffect(() => {
    if (data && !dirty) setRecipients(splitRecipients(data.value));
  }, [data, dirty]);

  const addRecipient = () => {
    const email = draftEmail.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setAddError(t("sysConfig.invalidEmail"));
      return;
    }
    if (recipients.some((r) => r.toLowerCase() === email.toLowerCase())) {
      setAddError(t("sysConfig.duplicateEmail"));
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setDraftEmail("");
    setAddError(null);
    setDirty(true);
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    try {
      await mutate(recipients.join(", "));
      setDirty(false);
      setToast({ message: t("sysConfig.saved"), type: "success" });
      await reload();
    } catch {
      setToast({ message: t("sysConfig.saveError"), type: "error" });
    }
  };

  const handleReset = () => {
    setRecipients(splitRecipients(data?.value ?? ""));
    setDraftEmail("");
    setAddError(null);
    setDirty(false);
  };

  return (
    <ITFlex direction="column" gap={4} className="pt-2">
      <ITFlex align="center" gap={2}>
        <FaEnvelope className="text-[#0D5777]" />
        <ITText className="text-sm font-bold text-slate-800">
          {t("sysConfig.title")}
        </ITText>
      </ITFlex>

      <ITText className="-mt-2 text-xs text-slate-500">{t("sysConfig.subtitle")}</ITText>

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
              disabled={!dirty || saving}
            >
              <ITText className="font-bold text-[11px]">
                {saving ? t("sysConfig.saving") : t("sysConfig.save")}
              </ITText>
            </ITButton>
          </ITFlex>
        }
      >
        <ITFlex align="end" gap={2}>
          <ITFlex grow={1} className="min-w-0">
            <ITInput
              name="newRecipient"
              type="email"
              label={t("sysConfig.newRecipientLabel")}
              placeholder={t("sysConfig.newRecipientPlaceholder")}
              value={draftEmail}
              onChange={(e) => {
                setDraftEmail(e.target.value);
                if (addError) setAddError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && addRecipient()}
              error={addError ?? undefined}
            />
          </ITFlex>
          <ITButton
            variant="filled"
            color="primary"
            onClick={addRecipient}
            disabled={!draftEmail.trim()}
            className="mt-1"
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={11} />
              <ITText className="font-bold text-[11px]">
                {t("sysConfig.addRecipient")}
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>

        <ITText className="mt-2 block text-[11px] text-slate-500">
          {t("sysConfig.recipientsHelp")}
        </ITText>

        <ITFlex direction="column" gap={2} className="mt-4">
          {loading ? (
            <ITText className="text-xs text-slate-400">—</ITText>
          ) : recipients.length === 0 ? (
            <ITText className="text-xs italic text-slate-400">
              {t("sysConfig.empty")}
            </ITText>
          ) : (
            recipients.map((email) => (
              <ITFlex
                key={email}
                align="center"
                justify="between"
                gap={2}
                className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
              >
                <ITFlex align="center" gap={2} className="min-w-0">
                  <FaEnvelope size={11} className="shrink-0 text-slate-400" />
                  <ITText className="truncate text-[12px] font-medium text-slate-700">
                    {email}
                  </ITText>
                </ITFlex>
                <ITButton
                  variant="icon-only"
                  color="error"
                  size="sm"
                  onClick={() => removeRecipient(email)}
                  ariaLabel={t("sysConfig.removeRecipient")}
                  title={t("sysConfig.removeRecipient")}
                >
                  <FaTrashAlt size={11} />
                </ITButton>
              </ITFlex>
            ))
          )}
        </ITFlex>

        {data?.updatedBy && (
          <ITText className="mt-3 block text-[10px] text-slate-400">
            {data.updatedBy.name} ·{" "}
            {new Date(data.updatedAt).toLocaleString("es-MX")}
          </ITText>
        )}
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
