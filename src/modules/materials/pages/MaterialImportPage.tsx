import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaExclamationTriangle, FaFileExcel, FaUpload } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { materialsApi, type MaterialImportResult } from "@core/api/materials.api";

export default function MaterialImportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoria, setCategoria] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MaterialImportResult | null>(null);

  useEffect(() => {
    materialsApi.categorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  const handleImport = async () => {
    if (!file || !categoria.trim()) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await materialsApi.import(file, categoria.trim());
      setResult(res);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ITPage
      title="Cargar materiales desde Excel"
      description='El archivo debe traer columnas "Modelo", "Descripción" y "Cantidad" en la primera hoja.'
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Materiales", onClick: () => navigate("/materiales") },
        { label: "Cargar Excel" },
      ]}
      icon={<FaFileExcel size={20} />}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
        <ITFlex direction="column" gap={4}>
          <div>
            <ITInput
              name="categoria"
              label="Categoría para esta carga *"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ej. Cómputo, Cableado, Consumibles"
              required
            />
            <ITText className="text-[10px] text-slate-400 mt-1">
              Se aplica a todos los materiales nuevos de este archivo. Si un Modelo ya existe en
              el catálogo (sin importar su categoría actual), su cantidad se suma al stock que ya
              tiene en vez de crear un renglón nuevo.
            </ITText>
            {categorias.length > 0 && (
              <ITFlex gap={1} wrap="wrap" className="mt-2">
                {categorias.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoria(c)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    {c}
                  </button>
                ))}
              </ITFlex>
            )}
          </div>

          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <ITFlex align="center" gap={3}>
              <ITButton variant="outlined" color="secondary" onClick={() => inputRef.current?.click()}>
                <ITFlex align="center" gap={1}>
                  <FaFileExcel size={12} />
                  <ITText className="text-[11px] font-bold">Elegir archivo</ITText>
                </ITFlex>
              </ITButton>
              <ITText className="text-[11px] font-bold text-slate-500">
                {file ? file.name : "Ningún archivo seleccionado"}
              </ITText>
            </ITFlex>
          </div>

          <ITFlex justify="end">
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleImport}
              disabled={!file || !categoria.trim() || uploading}
            >
              <ITFlex align="center" gap={1}>
                <FaUpload size={12} />
                <ITText className="text-[11px] font-bold">
                  {uploading ? "Cargando…" : "Cargar"}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITCard>

      {result && (
        <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
          <ITFlex align="center" gap={2} className="mb-4">
            <FaCheckCircle size={14} className="text-emerald-600" />
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Resultado de la carga
            </ITText>
          </ITFlex>

          <ITFlex gap={4} wrap="wrap" className="mb-4">
            <ITBadget color="success" size="small">{`${result.creados} creado(s)`}</ITBadget>
            <ITBadget color="info" size="small">{`${result.actualizados} con stock sumado`}</ITBadget>
            {result.omitidos.length > 0 && (
              <ITBadget color="warning" size="small">{`${result.omitidos.length} omitido(s)`}</ITBadget>
            )}
          </ITFlex>

          {result.detalle.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
              {result.detalle.map((d, i) => (
                <ITFlex
                  key={i}
                  justify="between"
                  align="center"
                  className="px-3 py-2 border-b border-slate-100 last:border-b-0"
                >
                  <ITText className="text-[11px] font-bold text-slate-700">{d.modelo}</ITText>
                  <ITFlex align="center" gap={2}>
                    <ITBadget color={d.accion === "creado" ? "success" : "info"} size="small">
                      {d.accion === "creado" ? "Nuevo" : "Stock sumado"}
                    </ITBadget>
                    <ITText className="text-[11px] font-black text-slate-500">
                      stock: {d.stockFinal}
                    </ITText>
                  </ITFlex>
                </ITFlex>
              ))}
            </div>
          )}

          {result.omitidos.length > 0 && (
            <div className="mt-4">
              <ITFlex align="center" gap={2} className="mb-2">
                <FaExclamationTriangle size={12} className="text-amber-500" />
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Filas omitidas
                </ITText>
              </ITFlex>
              {result.omitidos.map((o, i) => (
                <ITText key={i} className="text-[11px] text-slate-500">
                  Fila {o.fila}: {o.motivo}
                </ITText>
              ))}
            </div>
          )}

          <ITFlex justify="end" className="mt-5">
            <ITButton variant="filled" color="primary" onClick={() => navigate("/materiales")}>
              Ver catálogo
            </ITButton>
          </ITFlex>
        </ITCard>
      )}
    </ITPage>
  );
}
