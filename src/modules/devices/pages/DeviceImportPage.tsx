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
  FaBoxOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaLaptop,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deviceTypeApi as deviceTypesApi,
  type DeviceFieldKey,
  type DeviceType,
} from "@entities/device-type";
import { deviceApi as devicesApi } from "@entities/device";

const GENERIC_TYPE_CODE = "GENERICO";
interface UnitRow {
  numeroSerie: string;
  ip: string;
  macAddress: string;
}

interface Row {
  key: string;
  typeId: string;
  modelo: string;
  descripcion: string;
  cantidad: string;
  marca: string;
  sistemaOp: string;
  ram: string;
  almacenamiento: string;
  units: UnitRow[];
}

interface RowResult {
  key: string;
  modelo: string;
  ok: boolean;
  detail: string;
}

const SHARED_FIELDS = ["sistemaOp", "ram", "almacenamiento"] as const;
const UNIT_FIELDS = ["numeroSerie", "ip", "macAddress"] as const;

export default function DeviceImportPage() {
  const navigate = useNavigate();

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [unknownTypes, setUnknownTypes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);

  useEffect(() => {
    deviceTypesApi
      .list()
       .then((types) => {
         setDeviceTypes(types);
       })
      .catch(() => setDeviceTypes([]))
      .finally(() => setTypesLoaded(true));
  }, []);

  const defaultTypeId =
    deviceTypes.find((t) => t.code?.toUpperCase() === GENERIC_TYPE_CODE)?.id ?? deviceTypes[0]?.id ?? "";

  const normalizeTypeText = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "_");

  const resolveTypeId = (value?: string) => {
    if (!value?.trim()) return defaultTypeId;
    const normalized = normalizeTypeText(value);
    return deviceTypes.find((type) =>
      normalizeTypeText(type.code) === normalized || normalizeTypeText(type.name) === normalized
    )?.id ?? "";
  };

  const handleParse = async (selectedFile = file) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setParsing(true);
    setError(null);
    setWarnings([]);
    setUnknownTypes([]);
    setResults(null);
    try {
      const res = await devicesApi.importParse(selectedFile);
      setWarnings(res.errors ?? []);
      const unknown = Array.from(new Set(res.rows.map((row) => row.tipo?.trim()).filter((tipo): tipo is string => Boolean(tipo && !resolveTypeId(tipo)))));
      setUnknownTypes(unknown);
      setRows(
        res.rows.map((r, i) => ({
          key: `${i}-${r.modelo}`,
          typeId: resolveTypeId(r.tipo),
          modelo: r.modelo,
          descripcion: r.descripcion,
          cantidad: String(r.cantidad || 1),
          marca: r.marca ?? "",
          sistemaOp: "",
          ram: "",
          almacenamiento: "",
          units: createUnits(r.cantidad || 1),
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setParsing(false);
    }
  };

  const createUnits = (cantidad: string | number, previous: UnitRow[] = []) => {
    const total = Math.max(0, Math.min(500, Math.trunc(Number(cantidad) || 0)));
    return Array.from({ length: total }, (_, index) => previous[index] ?? {
      numeroSerie: "",
      ip: "",
      macAddress: "",
    });
  };

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => {
      if (r.key !== key) return r;
      const next = { ...r, ...patch };
      if (patch.cantidad !== undefined) next.units = createUnits(patch.cantidad, r.units);
      return next;
    }));
  };

  const updateUnit = (key: string, index: number, patch: Partial<UnitRow>) => {
    setRows((prev) => prev.map((r) => {
      if (r.key !== key) return r;
      const units = r.units.map((unit, unitIndex) => unitIndex === index ? { ...unit, ...patch } : unit);
      return { ...r, units };
    }));
  };

  const getType = (row: Row) => deviceTypes.find((type) => type.id === row.typeId);
  const fieldEnabled = (row: Row, field: DeviceFieldKey) => Boolean(getType(row)?.fieldConfig?.[field]?.enabled);
  const fieldRequired = (row: Row, field: DeviceFieldKey) => Boolean(getType(row)?.fieldConfig?.[field]?.required);

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const isRowValid = (r: Row): boolean => {
    const cantidad = Number(r.cantidad);
    return (
      !!r.typeId &&
      !!r.modelo.trim() &&
      !!r.descripcion.trim() &&
      !!r.marca.trim() &&
      Number.isFinite(cantidad) &&
      Number.isInteger(cantidad) &&
      cantidad > 0 &&
      cantidad <= 500 &&
      SHARED_FIELDS.every((field) => !fieldRequired(r, field) || Boolean(r[field].trim())) &&
      UNIT_FIELDS.every((field) => !fieldRequired(r, field) || r.units.slice(0, cantidad).every((unit) => Boolean(unit[field].trim())))
    );
  };

  const validCount = rows.filter(isRowValid).length;


  const handleConfirm = async () => {
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
      const type = deviceTypes.find((t) => t.id === r.typeId);
      if (!type) continue;
      try {
        const cantidad = Math.max(1, Math.trunc(Number(r.cantidad)));
        const res = await devicesApi.createBatch({
          typeId: type.id,
            descripcion: r.descripcion.trim(),
            marca: r.marca.trim(),
            modelo: r.modelo.trim(),
            sistemaOp: fieldEnabled(r, "sistemaOp") ? r.sistemaOp.trim() || undefined : undefined,
            ram: fieldEnabled(r, "ram") ? r.ram.trim() || undefined : undefined,
            almacenamiento: fieldEnabled(r, "almacenamiento") ? r.almacenamiento.trim() || undefined : undefined,
            units: r.units.slice(0, cantidad).map((unit) => ({
              ...(fieldEnabled(r, "numeroSerie") && unit.numeroSerie.trim() ? { numeroSerie: unit.numeroSerie.trim() } : {}),
              ...(fieldEnabled(r, "ip") && unit.ip.trim() ? { ip: unit.ip.trim() } : {}),
              ...(fieldEnabled(r, "macAddress") && unit.macAddress.trim() ? { macAddress: unit.macAddress.trim() } : {}),
            })),
        });
        outcomes.push({
          key: r.key,
          modelo: r.modelo,
          ok: true,
          detail: `${res.total} dispositivo(s) creado(s) (${type.name})`,
        });
      } catch (e: any) {
        outcomes.push({ key: r.key, modelo: r.modelo, ok: false, detail: e.message ?? "Error" });
      }
      setProgress({ done: i + 1, total: toProcess.length });
    }

    setResults(outcomes);
    setRows([]);
     setFile(null);
    setCommitting(false);
    setProgress(null);
  };

  return (
    <ITPage
      title="Cargar Excel"
       description='Sube un archivo con columnas "Modelo", "Descripción" y "Cantidad". Define tipo, marca y datos por unidad antes de confirmar la carga.'
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

      {warnings.length > 0 && (
        <ITAlert variant="warning">
          <ITText className="font-bold">Filas con observaciones:</ITText>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </ITAlert>
      )}

      {unknownTypes.length > 0 && (
        <ITAlert variant="error">
          <ITText className="font-bold">Tipos no registrados:</ITText>{" "}
          {unknownTypes.join(", ")}. Da de alta esos tipos en Dispositivos → Tipos antes de continuar.
        </ITAlert>
      )}

      {typesLoaded && deviceTypes.length === 0 && (
        <ITAlert variant="warning">
          No hay tipos de dispositivo disponibles. Créalo en Dispositivos → Tipos antes de
          cargar el Excel.
        </ITAlert>
      )}

      {rows.length === 0 && !results && (
        <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
           <ITFlex direction="column" gap={4}>
             <input
               ref={inputRef}
               type="file"
               accept=".xls,.xlsx"
               className="hidden"
               onChange={(event) => {
                 const selected = event.target.files?.[0];
                 if (selected) void handleParse(selected);
               }}
             />
             <ITButton variant="outlined" color="secondary" onClick={() => inputRef.current?.click()} disabled={parsing}>
               <ITFlex align="center" gap={1}><FaFileExcel size={12} /><ITText className="text-[11px] font-bold">{parsing ? "Leyendo archivo…" : "Elegir Excel"}</ITText></ITFlex>
             </ITButton>
             {file && <ITText className="text-[11px] font-bold text-slate-500">Archivo: {file.name}</ITText>}
             <ITCard className="border border-blue-100 bg-blue-50/50 p-4 rounded-2xl">
               <ITFlex direction="column" gap={2}>
                 <ITText className="text-[11px] font-black uppercase tracking-widest text-blue-800">Schema esperado</ITText>
                 <ITText className="text-[11px] text-slate-600">La primera hoja debe tener estas columnas, en cualquier orden:</ITText>
                 <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
                   <table className="w-full min-w-[520px] border-collapse text-left">
                     <thead className="bg-blue-50 text-[10px] font-black uppercase tracking-wider text-blue-800">
                       <tr><th className="px-3 py-2">Modelo *</th><th className="px-3 py-2">Descripción *</th><th className="px-3 py-2">Cantidad *</th><th className="px-3 py-2">Marca</th><th className="px-3 py-2">Tipo</th></tr>
                     </thead>
                     <tbody className="text-[11px] text-slate-600"><tr><td className="px-3 py-2">Laptop Latitude 5420</td><td className="px-3 py-2">Equipo para oficina</td><td className="px-3 py-2">3</td><td className="px-3 py-2">Dell</td><td className="px-3 py-2">LAPTOP</td></tr></tbody>
                   </table>
                 </div>
                 <ITText className="text-[10px] text-slate-500">Se aceptan `DESCRIPCIÓN` con acento. También puedes incluir `Marca` y `Tipo`; el tipo debe coincidir con código o nombre existente.</ITText>
               </ITFlex>
             </ITCard>
           </ITFlex>
        </ITCard>
      )}

      {rows.length > 0 && (
        <>
          <ITCard className="p-4 mb-4 border border-slate-100 rounded-2xl bg-slate-50/60">
            <ITFlex justify="between" align="end" gap={4} wrap="wrap">
              <ITText className="text-[11px] font-bold text-slate-500">
                {rows.length} fila(s) leída(s) · {validCount} lista(s) · {rows.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0)} unidad(es)
              </ITText>
              <ITButton
                variant="filled"
                color="primary"
                onClick={handleConfirm}
                disabled={committing || validCount === 0 || deviceTypes.length === 0}
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
          </ITCard>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-3 w-12">#</th>
                  <th className="px-3 py-3 min-w-[180px]">Tipo *</th>
                  <th className="px-3 py-3">Modelo *</th>
                  <th className="px-3 py-3 min-w-[260px]">Descripción *</th>
                  <th className="px-3 py-3 w-24">Cantidad *</th>
                  <th className="px-3 py-3 w-44">Marca *</th>
                  <th className="px-3 py-3 w-24">Estado</th>
                  <th className="px-3 py-3 w-14" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index) => {
                  const valid = isRowValid(r);
                  return (
                    <Fragment key={r.key}>
                      <tr className={`border-t border-slate-100 ${valid ? "" : "bg-amber-50/50"}`}>
                        <td className="px-3 py-2 text-[11px] font-bold text-slate-400">{index + 1}</td>
                        <td className="px-2 py-2">
                          <ITSelect
                            name={`tipo-${r.key}`}
                            aria-label="Tipo de dispositivo"
                            options={deviceTypes.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }))}
                            value={r.typeId}
                            onChange={(e) => updateRow(r.key, { typeId: e.target.value })}
                            disabled={committing}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <ITInput name={`modelo-${r.key}`} aria-label="Modelo" value={r.modelo} onChange={(e) => updateRow(r.key, { modelo: e.target.value })} />
                        </td>
                        <td className="px-2 py-2">
                          <ITInput name={`descripcion-${r.key}`} aria-label="Descripción" value={r.descripcion} onChange={(e) => updateRow(r.key, { descripcion: e.target.value })} />
                        </td>
                        <td className="px-2 py-2">
                          <ITInput name={`cant-${r.key}`} aria-label="Cantidad" type="number" min={1} max={500} value={r.cantidad} onChange={(e) => updateRow(r.key, { cantidad: e.target.value })} />
                        </td>
                        <td className="px-2 py-2">
                          <ITInput name={`marca-${r.key}`} aria-label="Marca" value={r.marca} onChange={(e) => updateRow(r.key, { marca: e.target.value })} placeholder="Logitech" />
                        </td>
                        <td className={`px-3 py-2 text-[10px] font-bold ${valid ? "text-emerald-600" : "text-amber-600"}`}>
                          {valid ? "Lista" : "Incompleta"}
                        </td>
                        <td className="px-2 py-2">
                          <ITButton variant="outlined" size="small" color="danger" onClick={() => removeRow(r.key)} title="Quitar esta fila">
                            <FaTrash size={11} />
                          </ITButton>
                        </td>
                      </tr>
                      {([...UNIT_FIELDS, ...SHARED_FIELDS] as DeviceFieldKey[]).some((field) => fieldEnabled(r, field)) && (
                        <tr className="border-t border-slate-100 bg-slate-50/70">
                          <td colSpan={8} className="px-5 py-3">
                            <ITText className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Datos configurables · {r.modelo || "sin modelo"}
                            </ITText>
                            {SHARED_FIELDS.some((field) => fieldEnabled(r, field)) && (
                              <ITFlex gap={3} wrap="wrap" className="mb-3">
                                {fieldEnabled(r, "sistemaOp") && <div className="w-full md:w-56"><ITInput name={`so-${r.key}`} label="Sistema operativo" value={r.sistemaOp} onChange={(e) => updateRow(r.key, { sistemaOp: e.target.value })} /></div>}
                                {fieldEnabled(r, "ram") && <div className="w-full md:w-40"><ITInput name={`ram-${r.key}`} label="RAM" value={r.ram} onChange={(e) => updateRow(r.key, { ram: e.target.value })} /></div>}
                                {fieldEnabled(r, "almacenamiento") && <div className="w-full md:w-56"><ITInput name={`storage-${r.key}`} label="Almacenamiento" value={r.almacenamiento} onChange={(e) => updateRow(r.key, { almacenamiento: e.target.value })} /></div>}
                              </ITFlex>
                            )}
                            {UNIT_FIELDS.some((field) => fieldEnabled(r, field)) && <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full min-w-[650px] border-collapse text-left">
                                <thead className="bg-slate-50">
                                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    <th className="px-3 py-2 w-12">#</th>
                                    {fieldEnabled(r, "numeroSerie") && <th className="px-3 py-2">Número de serie</th>}
                                    {fieldEnabled(r, "ip") && <th className="px-3 py-2">IP</th>}
                                    {fieldEnabled(r, "macAddress") && <th className="px-3 py-2">MAC</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.units.map((unit, unitIndex) => (
                                    <tr key={unitIndex} className="border-t border-slate-100">
                                      <td className="px-3 py-2 text-[10px] font-bold text-slate-400">{unitIndex + 1}</td>
                                      {fieldEnabled(r, "numeroSerie") && <td className="px-2 py-2">
                                        <ITInput name={`serie-${r.key}-${unitIndex}`} aria-label={`Número de serie ${unitIndex + 1}`} value={unit.numeroSerie} onChange={(e) => updateUnit(r.key, unitIndex, { numeroSerie: e.target.value })} />
                                      </td>}
                                      {fieldEnabled(r, "ip") && <td className="px-2 py-2">
                                        <ITInput name={`ip-${r.key}-${unitIndex}`} aria-label={`IP ${unitIndex + 1}`} value={unit.ip} onChange={(e) => updateUnit(r.key, unitIndex, { ip: e.target.value })} placeholder="192.168.1.10" />
                                      </td>}
                                      {fieldEnabled(r, "macAddress") && <td className="px-2 py-2">
                                        <ITInput name={`mac-${r.key}-${unitIndex}`} aria-label={`MAC ${unitIndex + 1}`} value={unit.macAddress} onChange={(e) => updateUnit(r.key, unitIndex, { macAddress: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" />
                                      </td>}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
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
