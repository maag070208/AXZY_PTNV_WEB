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
import {
  useDeviceTypeForm,
  DeviceTypeFieldsTable,
} from "@features/device-type/device-type-form";

export default function DeviceTypeFormPage() {
  const fx = useDeviceTypeForm();
  const { isEdit, form, setForm } = fx;

  if (fx.loading) {
    return (
      <ITPage
        title="Tipos de dispositivo"
        loading
        backAction={() => fx.navigate(-1)}
        breadcrumbs={[
          { label: "Dispositivos", onClick: () => fx.navigate("/dispositivos") },
          { label: "Tipos" },
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
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={fx.handleSubmit}
        disabled={fx.saving || !form.code || !form.name || !form.prefix}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">Guardar</ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? "Editar tipo" : "Nuevo tipo de dispositivo"}
      backAction={() => fx.navigate(-1)}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => fx.navigate("/dispositivos") },
        { label: isEdit ? "Editar tipo" : "Nuevo tipo" },
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
            label="Código interno"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="LAPTOP"
            disabled={isEdit}
          />
          <ITInput
            name="name"
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Laptop"
          />
          <ITInput
            name="prefix"
            label="Prefijo (consecutivo)"
            value={form.prefix}
            onChange={(e) =>
              setForm((f) => ({ ...f, prefix: e.target.value.toUpperCase() }))
            }
            placeholder="LPT"
          />
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-2">
            Ej: LPT-0001, LPT-0002…
          </ITText>
        </ITStack>
      </ITCard>

      <ITCard className="p-6 mt-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITFlex direction="column" gap={1} className="mb-4">
          <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
            Campos de este tipo
          </ITText>
          <ITText className="text-[11px] text-slate-400">
            Define qué datos aparecen al dar de alta cada dispositivo y cuáles
            son obligatorios.
          </ITText>
        </ITFlex>
        <DeviceTypeFieldsTable fx={fx} />
      </ITCard>
    </ITPage>
  );
}