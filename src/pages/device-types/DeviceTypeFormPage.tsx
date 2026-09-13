import {
  ITAlert,
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  useDeviceTypeForm,
  DeviceTypeFieldsTable,
} from "@features/device-type/device-type-form";

export default function DeviceTypeFormPage() {
  const fx = useDeviceTypeForm();
  const { t: tt } = useTranslation(["device-types", "common"]);
  const { isEdit, form, setForm } = fx;

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
            onChange={(e) =>
              setForm((f) => ({ ...f, prefix: e.target.value.toUpperCase() }))
            }
            placeholder="LPT"
          />
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-2">
            {tt("form.prefixHint")}
          </ITText>
        </ITStack>
      </ITCard>

      <ITCard className="p-6 mt-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITFlex direction="column" gap={1} className="mb-4">
          <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
            {tt("form.fieldsSectionTitle")}
          </ITText>
          <ITText className="text-[11px] text-slate-400">
            {tt("form.fieldsSectionHint")}
          </ITText>
        </ITFlex>
        <DeviceTypeFieldsTable fx={fx} />
      </ITCard>
    </ITPage>
  );
}