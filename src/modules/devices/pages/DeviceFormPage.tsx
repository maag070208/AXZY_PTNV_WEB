import {
  ITAlert,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deviceTypesApi,
  devicesApi,
  type DeviceType,
} from "@core/api/devices.api";

export default function DeviceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [types, setTypes] = useState<DeviceType[]>([]);
  const [form, setForm] = useState({
    typeId: "",
    descripcion: "",
    cantidad: 1,
    marca: "",
    modelo: "",
    numeroSerie: "",
    nombreEquipo: "",
    area: "MANTENIMIENTO",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    deviceTypesApi
      .list()
      .then((t) => {
        setTypes(t);
        return isEdit && id ? devicesApi.get(id) : null;
      })
      .then((d) => {
        if (d) {
          setForm({
            typeId: d.typeId,
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            marca: d.marca,
            modelo: d.modelo,
            numeroSerie: d.numeroSerie ?? "",
            nombreEquipo: d.nombreEquipo ?? "",
            area: d.area,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!form.typeId || !form.descripcion || !form.marca || !form.modelo) return;
    setSaving(true);
    try {
      const payload = {
        typeId: form.typeId,
        descripcion: form.descripcion,
        cantidad: form.cantidad,
        marca: form.marca,
        modelo: form.modelo,
        numeroSerie: form.numeroSerie || undefined,
        nombreEquipo: form.nombreEquipo || undefined,
        area: form.area,
      };
      if (isEdit && id) {
        await devicesApi.update(id, payload);
      } else {
        await devicesApi.create(payload);
      }
      navigate("/dispositivos");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title="Dispositivos" loading backAction={() => navigate("/")}>
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const actions = (
    <ITFlex gap={2}>
      <ITButton variant="outlined" onClick={() => navigate("/dispositivos")}>
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={
          saving || !form.typeId || !form.descripcion || !form.marca || !form.modelo
        }
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {saving ? "Guardando…" : "Guardar"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? "Editar dispositivo" : "Nuevo dispositivo"}
      description={isEdit ? "Si cambias el tipo se generará un nuevo control de activos" : undefined}
      backAction={() => navigate("/")}
      actions={actions}
      maxWidth="4xl"
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="typeId"
              label="Tipo *"
              options={types.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.prefix})`,
              }))}
              value={form.typeId}
              onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="cantidad"
              type="number"
              label="Cantidad"
              min={1}
              value={form.cantidad}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cantidad: Math.max(1, parseInt(e.target.value || "1", 10)),
                }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITInput
              name="desc"
              label="Descripción *"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="marca"
              label="Marca *"
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="modelo"
              label="Modelo *"
              value={form.modelo}
              onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="serie"
              label="No. Serie"
              value={form.numeroSerie}
              onChange={(e) => setForm((f) => ({ ...f, numeroSerie: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="eq"
              label="Nombre del equipo"
              value={form.nombreEquipo}
              onChange={(e) => setForm((f) => ({ ...f, nombreEquipo: e.target.value }))}
            />
          </ITGrid>
        </ITGrid>
      </ITCard>
    </ITPage>
  );
}