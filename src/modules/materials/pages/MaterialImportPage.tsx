import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBoxes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaLaptop,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { materialsApi } from "@core/api/materials.api";
import { deviceTypesApi, devicesApi, type DeviceType } from "@core/api/devices.api";

type Manejo = "DISPOSITIVO" | "MATERIAL";
const NEW_TYPE_VALUE = "__nuevo__";

interface Row {
  key: string;
  modelo: string;
  descripcion: string;
  cantidad: string;
  manejo: Manejo;
  typeId: string;
  newTypeName: string;
  newTypePrefix: string;
  marca: string;
  categoria: string;
}

interface RowResult {
  key: string;
  modelo: string;
  ok: boolean;
  detail: string;
}

export default function MaterialImportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);

  useEffect(() => {
    deviceTypesApi.list().then(setDeviceTypes).catch(() => setDeviceTypes([]));
    materialsApi.categorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    setResults(null);
    try {
      const res = await materialsApi.parseImport(file);
      setRows(
        res.rows.map((r, i) => ({
          key: `${i}-${r.modelo}`,
          modelo: r.modelo,
          descripcion: r.descripcion,
          cantidad: String(r.cantidad || 1),
          // La mayoría de lo que se entrega a una persona necesita su propia
          // carta responsiva (aunque no tenga serie), así que por default
          // cada fila se da de alta como Dispositivo. Las filas que son
          // puro consumible (nunca se asignan a nadie) se cambian a Material.
          manejo: "DISPOSITIVO",
          typeId: "",
          newTypeName: "",
          newTypePrefix: "",
          marca: "",
          categoria: "",
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  };

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const isRowValid = (r: Row): boolean => {
    const cantidad = Number(r.cantidad);
    if (!r.modelo.trim() || !r.descripcion.trim() || !Number.isFinite(cantidad) || cantidad <= 0) {
      return false;
    }
    if (r.manejo === "MATERIAL") return !!r.categoria.trim();
    if (!r.marca.trim()) return false;
    if (r.typeId === NEW_TYPE_VALUE) return !!r.newTypeName.trim() && !!r.newTypePrefix.trim();
    return !!r.typeId;
  };

  const validCount = rows.filter(isRowValid).length;

  const handleConfirm = async () => {
    const toProcess = rows.filter(isRowValid);
    const invalid = rows.filter((r) => !isRowValid(r));
    setCommitting(true);
    setProgress({ done: 0, total: toProcess.length });

    const newTypeIds = new Map<string, string>(); // "nombre|prefijo" -> id
    const outcomes: RowResult[] = invalid.map((r) => ({
      key: r.key,
      modelo: r.modelo || "(sin modelo)",
      ok: false,
      detail: "Fila incompleta — se omitió (falta modelo, descripción, cantidad, marca/tipo o categoría).",
    }));

    for (let i = 0; i < toProcess.length; i++) {
      const r = toProcess[i];
      try {
        if (r.manejo === "MATERIAL") {
          const m = await materialsApi.create({
            categoria: r.categoria.trim(),
            modelo: r.modelo.trim(),
            descripcion: r.descripcion.trim(),
            stock: Number(r.cantidad),
          });
          outcomes.push({
            key: r.key,
            modelo: r.modelo,
            ok: true,
            detail: `Material · stock actual: ${m.stock}`,
          });
        } else {
          let typeId = r.typeId;
          if (typeId === NEW_TYPE_VALUE) {
            const dedupeKey = `${r.newTypeName.trim().toUpperCase()}|${r.newTypePrefix.trim().toUpperCase()}`;
            const cached = newTypeIds.get(dedupeKey);
            if (cached) {
              typeId = cached;
            } else {
              const created = await deviceTypesApi.create({
                code: r.newTypePrefix.trim().toUpperCase(),
                name: r.newTypeName.trim(),
                prefix: r.newTypePrefix.trim().toUpperCase(),
              });
              newTypeIds.set(dedupeKey, created.id);
              setDeviceTypes((prev) => [...prev, created]);
              typeId = created.id;
            }
          }
          const cantidad = Math.max(1, Math.trunc(Number(r.cantidad)));
          const res = await devicesApi.createBatch({
            typeId,
            descripcion: r.descripcion.trim(),
            marca: r.marca.trim(),
            modelo: r.modelo.trim(),
            units: Array.from({ length: cantidad }, () => ({})),
          });
          outcomes.push({
            key: r.key,
            modelo: r.modelo,
            ok: true,
            detail: `${res.total} dispositivo(s) creado(s) (sin serie, con su propio activo)`,
          });
        }
      } catch (e: any) {
        outcomes.push({ key: r.key, modelo: r.modelo, ok: false, detail: e.message ?? "Error" });
      }
      setProgress({ done: i + 1, total: toProcess.length });
    }

    setResults(outcomes);
    setRows([]);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    setCommitting(false);
    setProgress(null);
  };

  return (
    <ITPage
      title="Cargar Excel"
      description='Sube un archivo con columnas "Modelo", "Descripción" y "Cantidad". Por cada fila eliges si es un Dispositivo (tiene su propia carta responsiva, aunque no tenga serie) o un Material (solo stock, nunca se asigna a una persona en particular).'
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

      {rows.length === 0 && !results && (
        <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
          <ITFlex direction="column" gap={4}>
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
              <ITButton variant="filled" color="primary" onClick={handleParse} disabled={!file || parsing}>
                <ITFlex align="center" gap={1}>
                  <FaUpload size={12} />
                  <ITText className="text-[11px] font-bold">{parsing ? "Leyendo…" : "Leer archivo"}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITCard>
      )}

      {rows.length > 0 && (
        <>
          <ITFlex justify="between" align="center" className="mb-3">
            <ITText className="text-[11px] font-bold text-slate-500">
              {rows.length} fila(s) leída(s) · {validCount} lista(s) para cargar
            </ITText>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleConfirm}
              disabled={committing || validCount === 0}
            >
              <ITFlex align="center" gap={1}>
                <FaUpload size={12} />
                <ITText className="text-[11px] font-bold">
                  {committing
                    ? `Cargando ${progress?.done ?? 0}/${progress?.total ?? 0}…`
                    : `Confirmar carga (${validCount})`}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>

          <ITFlex direction="column" gap={3}>
            {rows.map((r) => (
              <ITCard
                key={r.key}
                className={`p-4 border rounded-2xl ${
                  isRowValid(r) ? "border-slate-100" : "border-amber-300 bg-amber-50/30"
                }`}
              >
                <ITFlex justify="between" align="start" gap={3} wrap="wrap">
                  <ITFlex direction="column" gap={0.5} className="min-w-[220px]">
                    <ITText className="text-[12px] font-black text-slate-800">{r.modelo || "(sin modelo)"}</ITText>
                    <ITText className="text-[10px] font-bold text-slate-400">
                      {r.descripcion || "(sin descripción)"}
                    </ITText>
                  </ITFlex>

                  <ITFlex align="end" gap={2} wrap="wrap">
                    <div className="w-20">
                      <ITInput
                        name={`cant-${r.key}`}
                        label="Cant."
                        type="number"
                        min={1}
                        value={r.cantidad}
                        onChange={(e) => updateRow(r.key, { cantidad: e.target.value })}
                      />
                    </div>

                    <div className="w-36">
                      <ITSelect
                        name={`manejo-${r.key}`}
                        label="Manejo"
                        options={[
                          { value: "DISPOSITIVO", label: "Dispositivo" },
                          { value: "MATERIAL", label: "Material (stock)" },
                        ]}
                        value={r.manejo}
                        onChange={(e) => updateRow(r.key, { manejo: e.target.value as Manejo })}
                      />
                    </div>

                    {r.manejo === "DISPOSITIVO" ? (
                      <>
                        <div className="w-40">
                          <ITSelect
                            name={`tipo-${r.key}`}
                            label="Tipo"
                            options={[
                              ...deviceTypes.map((t) => ({ value: t.id, label: t.name })),
                              { value: NEW_TYPE_VALUE, label: "+ Nuevo tipo…" },
                            ]}
                            value={r.typeId}
                            onChange={(e) => updateRow(r.key, { typeId: e.target.value })}
                            placeholder="Elegir…"
                          />
                        </div>
                        {r.typeId === NEW_TYPE_VALUE && (
                          <>
                            <div className="w-32">
                              <ITInput
                                name={`newtype-name-${r.key}`}
                                label="Nombre tipo"
                                value={r.newTypeName}
                                onChange={(e) => updateRow(r.key, { newTypeName: e.target.value })}
                                placeholder="Teclado"
                              />
                            </div>
                            <div className="w-24">
                              <ITInput
                                name={`newtype-prefix-${r.key}`}
                                label="Prefijo"
                                value={r.newTypePrefix}
                                onChange={(e) =>
                                  updateRow(r.key, { newTypePrefix: e.target.value.toUpperCase() })
                                }
                                placeholder="TEC"
                              />
                            </div>
                          </>
                        )}
                        <div className="w-32">
                          <ITInput
                            name={`marca-${r.key}`}
                            label="Marca"
                            value={r.marca}
                            onChange={(e) => updateRow(r.key, { marca: e.target.value })}
                            placeholder="Logitech"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="w-44">
                        <ITInput
                          name={`categoria-${r.key}`}
                          label="Categoría"
                          value={r.categoria}
                          onChange={(e) => updateRow(r.key, { categoria: e.target.value })}
                          placeholder="Consumibles"
                        />
                      </div>
                    )}

                    <ITButton
                      variant="outlined"
                      size="small"
                      color="danger"
                      onClick={() => removeRow(r.key)}
                      title="Quitar esta fila (no se importa)"
                    >
                      <FaTrash size={11} />
                    </ITButton>
                  </ITFlex>
                </ITFlex>

                {r.manejo === "MATERIAL" && categorias.length > 0 && (
                  <ITFlex gap={1} wrap="wrap" className="mt-2">
                    {categorias.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateRow(r.key, { categoria: c })}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                      >
                        {c}
                      </button>
                    ))}
                  </ITFlex>
                )}
              </ITCard>
            ))}
          </ITFlex>
        </>
      )}

      {results && (
        <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mt-6">
          <ITFlex align="center" gap={2} className="mb-4">
            <FaCheckCircle size={14} className="text-emerald-600" />
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Resultado de la carga
            </ITText>
          </ITFlex>

          <ITFlex gap={4} wrap="wrap" className="mb-4">
            <ITBadget color="success" size="small">
              {`${results.filter((r) => r.ok).length} procesado(s) correctamente`}
            </ITBadget>
            {results.some((r) => !r.ok) && (
              <ITBadget color="warning" size="small">
                {`${results.filter((r) => !r.ok).length} con error / omitido(s)`}
              </ITBadget>
            )}
          </ITFlex>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100">
            {results.map((r, i) => (
              <ITFlex
                key={i}
                justify="between"
                align="center"
                className="px-3 py-2 border-b border-slate-100 last:border-b-0"
              >
                <ITFlex align="center" gap={2}>
                  {r.ok ? (
                    <FaCheckCircle size={11} className="text-emerald-600" />
                  ) : (
                    <FaExclamationTriangle size={11} className="text-amber-500" />
                  )}
                  <ITText className="text-[11px] font-bold text-slate-700">{r.modelo}</ITText>
                </ITFlex>
                <ITText className="text-[10px] font-bold text-slate-400">{r.detail}</ITText>
              </ITFlex>
            ))}
          </div>

          <ITFlex justify="end" gap={2} className="mt-5">
            <ITButton variant="outlined" color="secondary" onClick={() => navigate("/dispositivos")}>
              <ITFlex align="center" gap={1}>
                <FaLaptop size={12} />
                <ITText className="text-[11px] font-bold">Ver dispositivos</ITText>
              </ITFlex>
            </ITButton>
            <ITButton variant="filled" color="primary" onClick={() => navigate("/materiales")}>
              <ITFlex align="center" gap={1}>
                <FaBoxes size={12} />
                <ITText className="text-[11px] font-bold">Ver materiales</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITCard>
      )}
    </ITPage>
  );
}
