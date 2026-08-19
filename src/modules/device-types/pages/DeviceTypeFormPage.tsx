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
import { deviceTypesApi } from "@core/api/devices.api";

export default function DeviceTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    code: "",
    name: "",
    prefix: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (isEdit && id) {
      deviceTypesApi.get(id).then((d) => {
        setForm({ code: d.code, name: d.name, prefix: d.prefix });
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
      <ITPage title="Tipos de dispositivo" loading backAction={() => navigate("/")}>
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
      backAction={() => navigate("/")}
      actions={actions}
      maxWidth="3xl"
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
    </ITPage>
  );
}