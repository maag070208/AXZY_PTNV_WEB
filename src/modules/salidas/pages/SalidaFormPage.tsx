import {
  ITAlert,
  ITButton,
  ITCard,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaClipboardList, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { salidasApi, type MaterialOutputInput } from "@core/api/salidas.api";

interface RowForm {
  descripcion: string;
  modelo: string;
  marca: string;
  proyecto: string;
  cantidad: string;
  departamento: string;
  usuario: string;
  observaciones: string;
}

const emptyRow = (): RowForm => ({
  descripcion: "",
  modelo: "",
  marca: "",
  proyecto: "",
  cantidad: "1",
  departamento: "",
  usuario: "",
  observaciones: "",
});

export default function SalidaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [area, setArea] = useState("Sistemas");
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [rows, setRows] = useState<RowForm[]>([emptyRow()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    salidasApi
      .get(id)
      .then((row) => {
        setArea(row.area);
        setFecha(new Date(row.fecha));
        setRows([
          {
            descripcion: row.descripcion,
            modelo: row.modelo ?? "",
            marca: row.marca ?? "",
            proyecto: row.proyecto ?? "",
            cantidad: String(row.cantidad ?? 1),
            departamento: row.departamento,
            usuario: row.usuario,
            observaciones: row.observaciones ?? "",
          },
        ]);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleRowField = (idx: number, field: keyof RowForm, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const isRowValid = (r: RowForm) =>
    r.descripcion.trim() && r.departamento.trim() && r.usuario.trim();

  const canSubmit = rows.every(isRowValid) && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEdit && id) {
        const r = rows[0];
        await salidasApi.update(id, {
          fecha: fecha ? fecha.toISOString() : undefined,
          descripcion: r.descripcion,
          modelo: r.modelo || undefined,
          marca: r.marca || undefined,
          proyecto: r.proyecto || undefined,
          cantidad: Number(r.cantidad) || 1,
          departamento: r.departamento,
          usuario: r.usuario,
          observaciones: r.observaciones || undefined,
          area,
        });
        navigate("/salidas");
        return;
      }

      const payload: MaterialOutputInput[] = rows.map((r) => ({
        descripcion: r.descripcion,
        modelo: r.modelo || undefined,
        marca: r.marca || undefined,
        proyecto: r.proyecto || undefined,
        cantidad: Number(r.cantidad) || 1,
        departamento: r.departamento,
        usuario: r.usuario,
        observaciones: r.observaciones || undefined,
        area,
      }));
      const res = await salidasApi.createBatch(payload);
      setSuccess(`Se registraron ${res.total} salida(s) correctamente.`);
      setTimeout(() => navigate("/salidas"), 900);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        title="Salidas de material"
        loading
        backAction={() => navigate(-1)}
        breadcrumbs={[
          { label: "Salidas", onClick: () => navigate("/salidas") },
          { label: "Formulario" },
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
      <ITButton variant="outlined" onClick={() => navigate("/salidas")}>
        Cancelar
      </ITButton>
      <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={!canSubmit}>
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {saving
              ? "Guardando…"
              : isEdit
              ? "Guardar cambios"
              : rows.length > 1
              ? `Registrar ${rows.length} salidas`
              : "Registrar salida"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? "Editar salida" : "Nueva salida de material"}
      description={
        isEdit
          ? "Corrige los datos de este renglón de la bitácora"
          : "Captura uno o varios renglones, igual que en la bitácora física F-SIS-0005"
      }
      backAction={() => navigate(-1)}
      icon={<FaClipboardList size={20} />}
      breadcrumbs={[
        { label: "Salidas", onClick: () => navigate("/salidas") },
        { label: isEdit ? "Editar" : "Nueva" },
      ]}
      actions={actions}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      {success && (
        <ITAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={isEdit ? 4 : 6}>
            <ITInput name="area" label="Área" value={area} onChange={(e) => setArea(e.target.value)} />
          </ITGrid>
          {isEdit && (
            <ITGrid item xs={12} md={4}>
              <ITDatePicker
                name="fecha"
                label="Fecha"
                value={fecha ?? undefined}
                onChange={(e) => setFecha(e.target.value as Date)}
              />
            </ITGrid>
          )}
        </ITGrid>
      </ITCard>

      <ITFlex direction="column" gap={3}>
        {rows.map((r, idx) => (
          <ITCard
            key={idx}
            className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]"
          >
            <ITFlex justify="between" align="center" className="mb-3">
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Renglón {idx + 1}
              </ITText>
              {!isEdit && rows.length > 1 && (
                <ITButton
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={() => removeRow(idx)}
                  title="Quitar renglón"
                >
                  <FaTrash size={11} />
                </ITButton>
              )}
            </ITFlex>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`desc-${idx}`}
                  label="Descripción *"
                  value={r.descripcion}
                  onChange={(e) => handleRowField(idx, "descripcion", e.target.value)}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITInput
                  name={`modelo-${idx}`}
                  label="Modelo"
                  value={r.modelo}
                  onChange={(e) => handleRowField(idx, "modelo", e.target.value)}
                />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITInput
                  name={`marca-${idx}`}
                  label="Marca"
                  value={r.marca}
                  onChange={(e) => handleRowField(idx, "marca", e.target.value)}
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name={`proyecto-${idx}`}
                  label="Proyecto"
                  value={r.proyecto}
                  onChange={(e) => handleRowField(idx, "proyecto", e.target.value)}
                />
              </ITGrid>
              <ITGrid item xs={12} md={2}>
                <ITInput
                  name={`cantidad-${idx}`}
                  label="Cantidad"
                  type="number"
                  min={1}
                  value={r.cantidad}
                  onChange={(e) => handleRowField(idx, "cantidad", e.target.value)}
                />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITInput
                  name={`depto-${idx}`}
                  label="Departamento *"
                  value={r.departamento}
                  onChange={(e) => handleRowField(idx, "departamento", e.target.value)}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITInput
                  name={`usuario-${idx}`}
                  label="Usuario *"
                  value={r.usuario}
                  onChange={(e) => handleRowField(idx, "usuario", e.target.value)}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITTextarea
                  name={`obs-${idx}`}
                  label="Observaciones"
                  value={r.observaciones}
                  onChange={(v) => handleRowField(idx, "observaciones", v)}
                  rows={2}
                />
              </ITGrid>
            </ITGrid>
          </ITCard>
        ))}
      </ITFlex>

      {!isEdit && (
        <ITFlex justify="end" className="mt-4">
          <ITButton variant="outlined" color="secondary" onClick={addRow}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Agregar renglón</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      )}
    </ITPage>
  );
}
