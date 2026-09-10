import {
  ITAlert,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBoxes, FaSave } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { materialsApi } from "@core/api/materials.api";

export default function MaterialFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categorias, setCategorias] = useState<string[]>([]);
  const [form, setForm] = useState({
    categoria: "",
    modelo: "",
    descripcion: "",
    marca: "",
    unidad: "PZA",
  });
  const [stock, setStock] = useState("0");

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    materialsApi.categorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    materialsApi
      .get(id)
      .then((m) => {
        setForm({
          categoria: m.categoria,
          modelo: m.modelo,
          descripcion: m.descripcion,
          marca: m.marca ?? "",
          unidad: m.unidad,
        });
        setStock(String(m.stock));
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!form.categoria.trim() || !form.modelo.trim() || !form.descripcion.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const stockNum = Math.max(0, Math.trunc(Number(stock) || 0));
      if (isEdit && id) {
        await materialsApi.update(id, {
          categoria: form.categoria.trim(),
          modelo: form.modelo.trim(),
          descripcion: form.descripcion.trim(),
          marca: form.marca.trim() || undefined,
          unidad: form.unidad.trim() || "PZA",
          stock: stockNum,
        });
      } else {
        await materialsApi.create({
          categoria: form.categoria.trim(),
          modelo: form.modelo.trim(),
          descripcion: form.descripcion.trim(),
          marca: form.marca.trim() || undefined,
          unidad: form.unidad.trim() || "PZA",
          stock: stockNum,
        });
      }
      navigate("/materiales");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        title="Materiales"
        loading
        backAction={() => navigate(-1)}
        breadcrumbs={[
          { label: "Materiales", onClick: () => navigate("/materiales") },
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
      <ITButton variant="outlined" onClick={() => navigate("/materiales")}>
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={saving || !form.categoria.trim() || !form.modelo.trim() || !form.descripcion.trim()}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? "Editar material" : "Nuevo material"}
      description={
        isEdit
          ? "Si cambias el Modelo a uno ya existente, su stock se fusionará con el de ese material."
          : "Si el Modelo ya existe en el catálogo, la cantidad se sumará a su stock en vez de crear un renglón nuevo."
      }
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Materiales", onClick: () => navigate("/materiales") },
        { label: isEdit ? "Editar" : "Nuevo" },
      ]}
      actions={actions}
      icon={<FaBoxes size={20} />}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="categoria"
              label="Categoría *"
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              placeholder="Ej. Cómputo, Cableado, Consumibles"
              required
            />
            {categorias.length > 0 && (
              <ITFlex gap={1} wrap="wrap" className="mt-2">
                {categorias.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, categoria: c }))}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    {c}
                  </button>
                ))}
              </ITFlex>
            )}
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="marca"
              label="Marca"
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
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
          <ITGrid item xs={12}>
            <ITInput
              name="descripcion"
              label="Descripción *"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              required
            />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITInput
              name="stock"
              label={isEdit ? "Stock" : "Stock inicial"}
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITInput
              name="unidad"
              label="Unidad"
              value={form.unidad}
              onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
              placeholder="PZA"
            />
          </ITGrid>
        </ITGrid>
      </ITCard>
    </ITPage>
  );
}
