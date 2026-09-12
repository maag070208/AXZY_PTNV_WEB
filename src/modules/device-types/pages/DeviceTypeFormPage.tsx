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
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DEVICE_FIELD_KEYS,
  deviceTypeApi as deviceTypesApi,
  type DeviceFieldConfig,
  type DeviceFieldKey,
} from "@entities/device-type";

const FIELD_LABELS: Record<DeviceFieldKey, string> = {
  numeroSerie: "Número de serie",
  nombreEquipo: "Nombre de equipo",
  ip: "Dirección IP",
  macAddress: "MAC Address",
  sistemaOp: "Sistema operativo",
  ram: "RAM",
  almacenamiento: "Almacenamiento",
};

const emptyFieldConfig = (): DeviceFieldConfig =>
  DEVICE_FIELD_KEYS.reduce((config, key) => {
    config[key] = { enabled: false, required: false };
    return config;
  }, {} as DeviceFieldConfig);

const normalizeFieldConfig = (config?: Partial<DeviceFieldConfig>): DeviceFieldConfig =>
  DEVICE_FIELD_KEYS.reduce((result, key) => {
    const value = config?.[key];
    result[key] = {
      enabled: value?.enabled ?? false,
      required: Boolean(value?.enabled && value.required),
    };
    return result;
  }, emptyFieldConfig());

export default function DeviceTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    code: "",
    name: "",
    prefix: "",
    fieldConfig: emptyFieldConfig(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (isEdit && id) {
      deviceTypesApi.get(id).then((d) => {
        setForm({
          code: d.code,
          name: d.name,
          prefix: d.prefix,
          fieldConfig: normalizeFieldConfig(d.fieldConfig),
        });
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.prefix) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await deviceTypesApi.update(id, form);
      } else {
        await deviceTypesApi.create(form);
      }
      navigate("/dispositivos/tipos");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title="Tipos de dispositivo" loading backAction={() => navigate(-1)} breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: "Tipos" },
      ]}>
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const actions = (
    <ITFlex gap={2}>
      <ITButton variant="outlined" onClick={() => navigate(-1)}>
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={saving || !form.code || !form.name || !form.prefix}
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
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: isEdit ? "Editar tipo" : "Nuevo tipo" },
      ]}
      actions={actions}
      maxWidth="7xl"
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
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
            Define qué datos aparecen al dar de alta cada dispositivo y cuáles son obligatorios.
          </ITText>
        </ITFlex>
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Campo</th>
                <th className="px-4 py-3 w-32 text-center">Mostrar</th>
                <th className="px-4 py-3 w-32 text-center">Obligatorio</th>
              </tr>
            </thead>
            <tbody>
              {DEVICE_FIELD_KEYS.map((key) => {
                const setting = form.fieldConfig[key];
                return (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-700">{FIELD_LABELS[key]}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Mostrar ${FIELD_LABELS[key]}`}
                        checked={setting.enabled}
                        onChange={(e) => setForm((current) => ({
                          ...current,
                          fieldConfig: {
                            ...current.fieldConfig,
                            [key]: { enabled: e.target.checked, required: e.target.checked && setting.required },
                          },
                        }))}
                        className="h-4 w-4 accent-slate-700"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Obligatorio ${FIELD_LABELS[key]}`}
                        checked={setting.required}
                        disabled={!setting.enabled}
                        onChange={(e) => setForm((current) => ({
                          ...current,
                          fieldConfig: {
                            ...current.fieldConfig,
                            [key]: { ...setting, required: e.target.checked },
                          },
                        }))}
                        className="h-4 w-4 accent-slate-700 disabled:opacity-30"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ITCard>
    </ITPage>
  );
}
