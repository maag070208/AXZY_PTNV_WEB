import {
  ITAlert,
  ITButton,
  ITCard,
  ITDialog,
  ITFlex,
  ITInput,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaQuestionCircle, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  useDeviceTypeForm,
  DeviceTypeFieldsTable,
} from "@features/device-type/device-type-form";

export default function DeviceTypeFormPage() {
  const fx = useDeviceTypeForm();
  const { t: tt } = useTranslation(["device-types", "common"]);
  const { isEdit, form, setForm } = fx;
  const [showHelp, setShowHelp] = useState(false);

  if (fx.loading) {
    return (
      <ITPage
        title={tt("list.title")}
        loading
        backAction={() => fx.navigate(-1)}
        breadcrumbs={[
          { label: tt("form.breadcrumbDevices"), onClick: () => fx.navigate("/dispositivos") },
          { label: tt("form.breadcrumbList") },
        ]}
      >
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const actions = (
    <ITFlex gap={2}>
      <ITButton variant="outlined" onClick={() => setShowHelp(true)}>
        <ITFlex align="center" gap={1}>
          <FaQuestionCircle size={12} />
          <ITText className="font-bold text-[11px]">{tt("form.helpButton")}</ITText>
        </ITFlex>
      </ITButton>
      <ITButton variant="outlined" onClick={() => fx.navigate(-1)}>
        {tt("common:actions.cancel")}
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={fx.handleSubmit}
        disabled={fx.saving || !form.code || !form.name || !form.prefix}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">{tt("common:actions.save")}</ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? tt("form.titleEdit") : tt("form.titleNew")}
      backAction={() => fx.navigate(-1)}
      breadcrumbs={[
        { label: tt("form.breadcrumbDevices"), onClick: () => fx.navigate("/dispositivos") },
        { label: isEdit ? tt("form.breadcrumbEdit") : tt("form.breadcrumbNew") },
      ]}
      actions={actions}
      maxWidth="7xl"
    >
      {fx.error && (
        <ITAlert
          variant="error"
          dismissible
          onDismiss={() => fx.setError(null)}
        >
          {fx.error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITStack direction="column" spacing={4}>
          <ITInput
            name="code"
            label={tt("form.code")}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="LAPTOP"
            disabled={isEdit}
          />
          <ITInput
            name="name"
            label={tt("form.name")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Laptop"
          />
          <ITInput
            name="prefix"
            label={tt("form.prefix")}
            value={form.prefix}
            maxLength={15}
            disabled={isEdit}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                prefix: e.target.value.toUpperCase().slice(0, 15),
              }))
            }
            placeholder="LPT"
          />
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-2">
            {isEdit ? tt("form.prefixLockHint") : tt("form.prefixHint")}
          </ITText>
        </ITStack>
      </ITCard>

      <ITCard className="p-6 mt-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITFlex direction="column" gap={1} className="mb-4">
          <ITFlex align="center" gap={2}>
            <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
              {tt("form.fieldsSectionTitle")}
            </ITText>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px] underline underline-offset-2"
            >
              {tt("form.helpFieldsLink")}
            </button>
          </ITFlex>
          <ITText className="text-[11px] text-slate-400">
            {tt("form.fieldsSectionHint")}
          </ITText>
        </ITFlex>
        <DeviceTypeFieldsTable fx={fx} />
      </ITCard>

      <ITDialog
        isOpen={showHelp}
        className="w-full max-w-lg"
        onClose={() => setShowHelp(false)}
      >
        <div className="pb-3 mb-3 border-b border-slate-100 pr-6">
          <ITFlex align="center" gap={2}>
            <FaQuestionCircle size={14} className="text-emerald-500" />
            <ITText className="text-lg font-black text-slate-800">
              {tt("form.helpTitle")}
            </ITText>
          </ITFlex>
          <ITText className="text-[11px] text-slate-400 mt-1">
            {tt("form.helpSubtitle")}
          </ITText>
        </div>
        <ITStack direction="column" spacing={3}>
          <div>
            <ITText className="text-[11px] font-black text-slate-700">
              {tt("form.helpCodeTitle")}
            </ITText>
            <ITText className="text-[11px] text-slate-500 mt-0.5">
              {tt("form.helpCodeDesc")}
            </ITText>
          </div>
          <div>
            <ITText className="text-[11px] font-black text-slate-700">
              {tt("form.helpNameTitle")}
            </ITText>
            <ITText className="text-[11px] text-slate-500 mt-0.5">
              {tt("form.helpNameDesc")}
            </ITText>
          </div>
          <div>
            <ITText className="text-[11px] font-black text-slate-700">
              {tt("form.helpPrefixTitle")}
            </ITText>
            <ITText className="text-[11px] text-slate-500 mt-0.5">
              {tt("form.helpPrefixDesc")}
            </ITText>
          </div>
          <div>
            <ITText className="text-[11px] font-black text-slate-700">
              {tt("form.helpFieldsTitle")}
            </ITText>
            <ITText className="text-[11px] text-slate-500 mt-0.5">
              {tt("form.helpFieldsDesc")}
            </ITText>
          </div>
        </ITStack>
        <ITFlex justify="end" className="mt-4 pt-3 border-t border-slate-100">
          <ITButton variant="outlined" size="sm" onClick={() => setShowHelp(false)}>
            {tt("common:actions.cancel")}
          </ITButton>
        </ITFlex>
      </ITDialog>
    </ITPage>
  );
}