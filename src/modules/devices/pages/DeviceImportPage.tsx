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
import {
  FaBoxOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaLaptop,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deviceTypesApi, devicesApi, type DeviceType } from "@core/api/devices.api";

const GENERIC_TYPE_CODE = "GENERICO";

interface Row {
  key: string;
  modelo: string;
  descripcion: string;
  cantidad: string;
  marca: string;
}

interface RowResult {
  key: string;
  modelo: string;
  ok: boolean;
  detail: string;
}

export default function DeviceImportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);

  useEffect(() => {
    deviceTypesApi
      .list()
      .then(setDeviceTypes)
      .catch(() => setDeviceTypes([]))
      .finally(() => setTypesLoaded(true));
  }, []);

  // Todo lo que se carga por este asistente entra como Dispositivo con este
  // tipo "Genérico" (sin número de serie) — así cada unidad de todas formas
  // recibe su propio folio de activo y puede tener su carta responsiva.
  const genericType = deviceTypes.find(
    (t) => t.code?.toUpperCase() === GENERIC_TYPE_CODE
  );

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError(null);
    setResults(null);
    try {
      const res = await devicesApi.importParse(file);
      setRows(
        res.rows.map((r, i) => ({
          key: `${i}-${r.modelo}`,
          modelo: r.modelo,
          descripcion: r.descripcion,
          cantidad: String(r.cantidad || 1),
          marca: "",
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
    return (
      !!r.modelo.trim() &&
      !!r.descripcion.trim() &&
      !!r.marca.trim() &&
      Number.isFinite(cantidad) &&
      cantidad > 0
    );
  };

  const validCount = rows.filter(isRowValid).length;

  const handleConfirm = async () => {
    if (!genericType) return;
    const toProcess = rows.filter(isRowValid);
    const invalid = rows.filter((r) => !isRowValid(r));
    setCommitting(true);
    setProgress({ done: 0, total: toProcess.length });

    const outcomes: RowResult[] = invalid.map((r) => ({
      key: r.key,
      modelo: r.modelo || "(sin modelo)",
      ok: false,
      detail: "Fila incompleta — se omitió (falta modelo, descripción, marca o cantidad).",
    }));

    for (let i = 0; i < toProcess.length; i++) {
      const r = toProcess[i];
      try {
        const cantidad = Math.max(1, Math.trunc(Number(r.cantidad)));
        const res = await devicesApi.createBatch({
          typeId: genericType.id,
          descripcion: r.descripcion.trim(),
          marca: r.marca.trim(),
          modelo: r.modelo.trim(),
          units: Array.from({ length: cantidad }, () => ({})),
        });
        outcomes.push({
          key: r.key,
          modelo: r.modelo,
          ok: true,
          detail: `${res.total} dispositivo(s) creado(s) (Genérico, sin serie, con su propio activo)`,
        });
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
      description='Sube un archivo con columnas "Modelo", "Descripción" y "Cantidad". Cada fila se da de alta como Dispositivo tipo Genérico (sin número de serie), con su propio folio de activo para poder tener su carta responsiva individual.'
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: "Cargar Excel" },
      ]}
      icon={<FaFileExcel size={20} />}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {typesLoaded && !genericType && (
        <ITAlert variant="warning">
          No encontré el tipo de dispositivo "Genérico" (code: GENERICO). Créalo en
          Dispositivos → Tipos antes de cargar el Excel, o corre el seed de la base de
          datos para que se agregue automáticamente.
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
              disabled={committing || validCount === 0 || !genericType}
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
                      <ITInput
                        name={`marca-${r.key}`}
                        label="Marca"
                        value={r.marca}
                        onChange={(e) => updateRow(r.key, { marca: e.target.value })}
                        placeholder="Logitech"
                      />
                    </div>

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
            <ITButton variant="outlined" color="secondary" onClick={() => navigate("/dispositivos/tipos")}>
              <ITFlex align="center" gap={1}>
                <FaBoxOpen size={12} />
                <ITText className="text-[11px] font-bold">Ver tipos</ITText>
              </ITFlex>
            </ITButton>
            <ITButton variant="filled" color="primary" onClick={() => navigate("/dispositivos")}>
              <ITFlex align="center" gap={1}>
                <FaLaptop size={12} />
                <ITText className="text-[11px] font-bold">Ver dispositivos</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITCard>
      )}
    </ITPage>
  );
}
