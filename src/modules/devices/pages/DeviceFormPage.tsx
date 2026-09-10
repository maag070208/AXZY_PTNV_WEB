import {
  ITAlert,
  ITBadget,
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
import { FaBoxes, FaBoxOpen, FaLayerGroup, FaLock, FaMagic, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deviceTypesApi,
  devicesApi,
  type Device,
  type DeviceType,
} from "@core/api/devices.api";
import { formatMacInput } from "@core/utils/itDevice";

interface UnitForm {
  numeroSerie: string;
  nombreEquipo: string;
  ip: string;
  macAddress: string;
}

interface LoteUnitRow {
  id: string;
  controlActivos: string;
  estado: Device["estado"];
  numeroSerie: string;
  nombreEquipo: string;
  ip: string;
  macAddress: string;
  area: string;
}

const emptyUnit = (): UnitForm => ({
  numeroSerie: "",
  nombreEquipo: "",
  ip: "",
  macAddress: "",
});

const toLoteRow = (d: Device): LoteUnitRow => ({
  id: d.id,
  controlActivos: d.controlActivos,
  estado: d.estado,
  numeroSerie: d.numeroSerie ?? "",
  nombreEquipo: d.nombreEquipo ?? "",
  ip: d.ip ?? "",
  macAddress: d.macAddress ?? "",
  area: d.area ?? "",
});

// Incrementa el último octeto de una IPv4 (ej. base .10 + offset 2 => .12).
// Regresa null si la IP base es inválida o si se sale de rango.
const incrementIp = (base: string, offset: number): string | null => {
  const parts = base.trim().split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  const last = nums[3] + offset;
  if (last < 0 || last > 255) return null;
  return [nums[0], nums[1], nums[2], last].join(".");
};

export default function DeviceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [types, setTypes] = useState<DeviceType[]>([]);
  const [form, setForm] = useState({
    typeId: "",
    descripcion: "",
    marca: "",
    modelo: "",
    area: "SISTEMAS",
    sistemaOp: "",
    ram: "",
    almacenamiento: "",
  });

  // Modo edición: un solo dispositivo, sus identificadores van aparte.
  const [editUnit, setEditUnit] = useState<UnitForm>(emptyUnit());
  const [blocked, setBlocked] = useState(false);
  const [blockedAssetCode, setBlockedAssetCode] = useState("");
  const [loteId, setLoteId] = useState<string | null>(null);
  const [loteSize, setLoteSize] = useState(1);
  const [loteRows, setLoteRows] = useState<LoteUnitRow[]>([]);
  const [loteLoading, setLoteLoading] = useState(false);

  // Modo alta: cantidad + un renglón por unidad.
  const [cantidad, setCantidad] = useState(1);
  const [units, setUnits] = useState<UnitForm[]>([emptyUnit()]);
  const [autoNombreBase, setAutoNombreBase] = useState("");
  const [autoNombreStart, setAutoNombreStart] = useState("1");
  const [autoIpBase, setAutoIpBase] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Agregar más unidades idénticas a un dispositivo ya existente (lo agrupa
  // en un lote si todavía no pertenecía a uno).
  const [addQty, setAddQty] = useState(1);
  const [addingUnits, setAddingUnits] = useState(false);

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
            marca: d.marca,
            modelo: d.modelo,
            area: d.area,
            sistemaOp: d.sistemaOp ?? "",
            ram: d.ram ?? "",
            almacenamiento: d.almacenamiento ?? "",
          });
          setEditUnit({
            numeroSerie: d.numeroSerie ?? "",
            nombreEquipo: d.nombreEquipo ?? "",
            ip: d.ip ?? "",
            macAddress: d.macAddress ?? "",
          });
          if (d.estado === "ASIGNADO") {
            setBlocked(true);
            setBlockedAssetCode(d.controlActivos);
          }
          if (d.loteId && d.loteSize && d.loteSize > 1) {
            setLoteId(d.loteId);
            setLoteSize(d.loteSize);
          }
        }
      })
      .then(async () => {
        if (isEdit && id && loteId) {
          setLoteLoading(true);
          try {
            const res = await devicesApi.getLote(loteId);
            setLoteRows(res.data.map(toLoteRow));
          } catch {
            setLoteRows([]);
          } finally {
            setLoteLoading(false);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, loteId]);

  // Mantiene el arreglo de unidades sincronizado con la cantidad capturada,
  // preservando lo ya escrito cuando la cantidad crece o se reduce.
  useEffect(() => {
    setUnits((prev) => {
      const next = [...prev];
      if (cantidad > next.length) {
        while (next.length < cantidad) next.push(emptyUnit());
      } else if (cantidad < next.length) {
        next.length = Math.max(cantidad, 1);
      }
      return next;
    });
  }, [cantidad]);

  const selectedType = useMemo(
    () => types.find((t) => t.id === form.typeId),
    [types, form.typeId]
  );
  const showField = (field: keyof NonNullable<DeviceType["fieldConfig"]>) =>
    Boolean(selectedType?.fieldConfig?.[field]?.enabled);
  const showITSpecs = ["ip", "macAddress", "sistemaOp", "ram", "almacenamiento"].some((field) =>
    showField(field as keyof DeviceType["fieldConfig"])
  );
  const isBatch = !isEdit && cantidad > 1;
  const isLoteEdit = isEdit && !!loteId && loteSize > 1;
  const disabledAll = isEdit && blocked;

  const handleUnitField = (idx: number, field: keyof UnitForm, value: string) => {
    setUnits((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeUnitRow = (idx: number) => {
    if (cantidad <= 1) return;
    setUnits((prev) => prev.filter((_, i) => i !== idx));
    setCantidad((c) => Math.max(1, c - 1));
  };

  // Autocompleta el nombre de cada unidad en vivo conforme se escribe la base
  // y el número inicial (antes requería presionar "Aplicar a todos").
  useEffect(() => {
    if (!autoNombreBase.trim()) return;
    const startNum = Number(autoNombreStart) || 1;
    setUnits((prev) =>
      prev.map((u, i) => ({
        ...u,
        nombreEquipo: `${autoNombreBase.trim()}-${String(startNum + i).padStart(2, "0")}`,
      }))
    );
  }, [autoNombreBase, autoNombreStart, cantidad]);

  // Autocompleta la IP de cada unidad en vivo (autoincrementando desde la
  // base) conforme se escribe, también sin necesidad de un botón "Aplicar".
  useEffect(() => {
    if (!autoIpBase.trim()) return;
    setUnits((prev) =>
      prev.map((u, i) => {
        const next = incrementIp(autoIpBase.trim(), i);
        return next ? { ...u, ip: next } : u;
      })
    );
  }, [autoIpBase, cantidad]);

  const handleSubmit = async () => {
    if (disabledAll) return;
    if (!form.typeId || !form.descripcion || !form.marca || !form.modelo) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEdit && id) {
        if (loteId && loteSize > 1) {
          const res = await devicesApi.updateLote(loteId, {
            descripcion: form.descripcion,
            marca: form.marca,
            modelo: form.modelo,
             sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
             ram: showField("ram") ? form.ram || undefined : undefined,
             almacenamiento: showField("almacenamiento") ? form.almacenamiento || undefined : undefined,
            units: loteRows
              .filter((r) => r.estado !== "ASIGNADO")
              .map((r) => ({
                id: r.id,
                numeroSerie: r.numeroSerie || undefined,
                nombreEquipo: r.nombreEquipo || undefined,
                 ip: showField("ip") ? r.ip || undefined : undefined,
                 macAddress: showField("macAddress") ? r.macAddress || undefined : undefined,
                area: r.area || undefined,
              })),
          });
          setSuccess(`Lote actualizado: ${res.total} unidad(es).`);
          setTimeout(() => navigate("/dispositivos"), 900);
          return;
        }
        await devicesApi.update(id, {
          typeId: form.typeId,
          descripcion: form.descripcion,
          marca: form.marca,
          modelo: form.modelo,
          area: form.area,
          numeroSerie: editUnit.numeroSerie || undefined,
          nombreEquipo: editUnit.nombreEquipo || undefined,
           ip: showField("ip") ? editUnit.ip || undefined : undefined,
           macAddress: showField("macAddress") ? editUnit.macAddress || undefined : undefined,
           sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
           ram: showField("ram") ? form.ram || undefined : undefined,
           almacenamiento: showField("almacenamiento") ? form.almacenamiento || undefined : undefined,
        });
        navigate("/dispositivos");
        return;
      }

      const res = await devicesApi.createBatch({
        typeId: form.typeId,
        descripcion: form.descripcion,
        marca: form.marca,
        modelo: form.modelo,
        area: form.area,
         sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
         ram: showField("ram") ? form.ram || undefined : undefined,
         almacenamiento: showField("almacenamiento") ? form.almacenamiento || undefined : undefined,
        units: units.slice(0, cantidad).map((u) => ({
          numeroSerie: u.numeroSerie || undefined,
          nombreEquipo: u.nombreEquipo || undefined,
           ip: showField("ip") ? u.ip || undefined : undefined,
           macAddress: showField("macAddress") ? u.macAddress || undefined : undefined,
        })),
      });

      if (cantidad > 1) {
        setSuccess(`Se dieron de alta ${res.total} dispositivos correctamente.`);
        setTimeout(() => navigate("/dispositivos"), 900);
      } else {
        navigate("/dispositivos");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUnits = async () => {
    if (!id || addQty < 1) return;
    setAddingUnits(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await devicesApi.addUnits(id, addQty);
      const freshLote = await devicesApi.getLote(res.loteId);
      setLoteId(res.loteId);
      setLoteRows(freshLote.data.map(toLoteRow));
      setLoteSize(freshLote.total);
      setSuccess(
        `Se agregaron ${res.total} unidad(es) más · ahora hay ${freshLote.total} en total.`
      );
      setAddQty(1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAddingUnits(false);
    }
  };

  if (loading) {
    return (
      <ITPage title="Dispositivos" loading backAction={() => navigate(-1)} breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: "Formulario" },
      ]}>
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
          saving ||
          disabledAll ||
          !form.typeId ||
          !form.descripcion ||
          !form.marca ||
          !form.modelo
        }
      >
        <ITFlex align="center" gap={1}>
          {disabledAll ? <FaLock size={12} /> : <FaSave size={12} />}
          <ITText className="font-bold text-[11px]">
            {disabledAll
              ? "Asignado — bloqueado"
              : saving
              ? "Guardando…"
              : isBatch
              ? `Dar de alta ${cantidad} unidades`
              : isEdit
              ? "Guardar cambios"
              : "Guardar"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isLoteEdit ? `Editar lote (${loteRows.length} unidades)` : isEdit ? "Editar dispositivo" : "Nuevo dispositivo"}
      description={
        isLoteEdit
          ? "Los datos compartidos se aplican a todo el lote. Cada unidad edita su serie, nombre, IP, MAC y área por separado."
          : isEdit
          ? "Si cambias el tipo se generará un nuevo control de activos"
          : "Indica la cantidad si vas a dar de alta varias unidades iguales"
      }
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: isEdit ? "Editar" : "Nuevo" },
      ]}
      actions={actions}
    >
      {disabledAll && (
        <ITAlert variant="warning">
          <ITFlex align="center" gap={2}>
            <FaLock size={14} />
            <ITText className="text-[12px] font-bold">
              Este dispositivo (activo {blockedAssetCode}) está asignado y no se
              puede editar. Registra su devolución para poder modificarlo.
            </ITText>
          </ITFlex>
        </ITAlert>
      )}
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

      {isEdit && (
        <ITCard className="p-5 sm:p-6 border border-blue-100 bg-blue-50/45 rounded-[24px] mb-6 shadow-lg shadow-blue-100/40">
          <ITFlex align="center" gap={4} wrap="wrap" justify="between">
            <ITFlex align="center" gap={3} className="min-w-0 flex-1">
              <ITFlex align="center" justify="center" className="h-11 w-11 shrink-0 rounded-2xl bg-blue-100 text-blue-600">
                <FaPlus size={16} />
              </ITFlex>
              <ITFlex direction="column" gap={0.5} className="min-w-0">
                <ITText className="text-[12px] font-black uppercase tracking-widest text-blue-800">
                  Agregar más unidades
                </ITText>
                <ITText className="text-[10px] font-bold leading-5 text-slate-600">
                  Crea copias idénticas sin serie. Cada unidad recibirá su propio folio de activo y podrá tener su carta responsiva.
                </ITText>
              </ITFlex>
            </ITFlex>
            <ITFlex align="end" gap={2}>
              <div className="w-24">
                <ITInput
                  name="addQty"
                  label="Cantidad"
                  type="number"
                  min={1}
                  value={String(addQty)}
                  onChange={(e) => setAddQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <ITButton
                variant="filled"
                color="primary"
                onClick={handleAddUnits}
                disabled={addingUnits}
              >
                <ITFlex align="center" gap={1}>
                  <FaPlus size={11} />
                  <ITText className="text-[11px] font-bold">
                    {addingUnits ? "Agregando…" : `Agregar ${addQty}`}
                  </ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITCard>
      )}

      {!isLoteEdit && (
        <>
      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
        <ITFlex align="center" gap={3} className="mb-5">
          <ITFlex align="center" justify="center" className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500">
            <FaBoxOpen size={14} />
          </ITFlex>
          <ITFlex direction="column" gap={0.25}>
            <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Datos del dispositivo</ITText>
            <ITText className="text-[10px] text-slate-400">Tipo, identificación y características principales</ITText>
          </ITFlex>
        </ITFlex>
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={isEdit ? 6 : 4}>
            <ITSelect
              name="typeId"
              label="Tipo"
              options={types.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.prefix})`,
              }))}
              value={form.typeId}
              onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))}
              required
              disabled={disabledAll}
            />
          </ITGrid>
          {!isEdit && (
            <ITGrid item xs={12} md={2}>
              <ITInput
                name="cantidad"
                label="Cantidad"
                type="number"
                min={1}
                max={500}
                value={String(cantidad)}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                  setCantidad(n);
                }}
              />
            </ITGrid>
          )}
          <ITGrid item xs={12}>
            <ITInput
              name="desc"
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              required
              disabled={disabledAll}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="marca"
              label="Marca"
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
              required
              disabled={disabledAll}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="modelo"
              label="Modelo"
              value={form.modelo}
              onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
              required
              disabled={disabledAll}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="area"
              label="Área"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              disabled={disabledAll}
            />
          </ITGrid>

          {isEdit && (
            <>
              {showField("numeroSerie") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="serie"
                  label="No. Serie"
                  value={editUnit.numeroSerie}
                  onChange={(e) =>
                    setEditUnit((u) => ({ ...u, numeroSerie: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </ITGrid>}
              {showField("nombreEquipo") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="eq"
                  label="Nombre del equipo"
                  value={editUnit.nombreEquipo}
                  onChange={(e) =>
                    setEditUnit((u) => ({ ...u, nombreEquipo: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </ITGrid>}
            </>
          )}

          {!isEdit && !isBatch && (
            <>
              {showField("numeroSerie") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="serie"
                  label="No. Serie"
                  value={units[0]?.numeroSerie ?? ""}
                  onChange={(e) => handleUnitField(0, "numeroSerie", e.target.value)}
                />
              </ITGrid>}
              {showField("nombreEquipo") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="eq"
                  label="Nombre del equipo"
                  value={units[0]?.nombreEquipo ?? ""}
                  onChange={(e) => handleUnitField(0, "nombreEquipo", e.target.value)}
                />
              </ITGrid>}
            </>
          )}

          {(showField("ip") || showField("macAddress")) && isEdit && (
            <>
              {showField("ip") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="ip"
                  label="Dirección IP"
                  value={editUnit.ip}
                  onChange={(e) => setEditUnit((u) => ({ ...u, ip: e.target.value }))}
                  placeholder="192.168.0.1"
                  disabled={disabledAll}
                />
              </ITGrid>}
              {showField("macAddress") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="mac"
                  label="MAC Address"
                  value={editUnit.macAddress}
                  onChange={(e) =>
                    setEditUnit((u) => ({ ...u, macAddress: formatMacInput(e.target.value) }))
                  }
                  placeholder="AA:BB:CC:DD:EE:FF"
                  disabled={disabledAll}
                />
              </ITGrid>}
            </>
          )}

          {(showField("ip") || showField("macAddress")) && !isEdit && !isBatch && (
            <>
              {showField("ip") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="ip"
                  label="Dirección IP"
                  value={units[0]?.ip ?? ""}
                  onChange={(e) => handleUnitField(0, "ip", e.target.value)}
                  placeholder="192.168.0.1"
                />
              </ITGrid>}
              {showField("macAddress") && <ITGrid item xs={12} md={6}>
                <ITInput
                  name="mac"
                  label="MAC Address"
                  value={units[0]?.macAddress ?? ""}
                  onChange={(e) =>
                    handleUnitField(0, "macAddress", formatMacInput(e.target.value))
                  }
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </ITGrid>}
            </>
          )}

          {showITSpecs && (
            <>
              {showField("sistemaOp") && <ITGrid item xs={12} md={4}>
                <ITInput
                  name="sistemaOp"
                  label="Sistema Operativo"
                  value={form.sistemaOp}
                  onChange={(e) => setForm((f) => ({ ...f, sistemaOp: e.target.value }))}
                  placeholder="Android 13 / Windows 11"
                  disabled={disabledAll}
                />
              </ITGrid>}
              {showField("ram") && <ITGrid item xs={12} md={4}>
                <ITInput
                  name="ram"
                  label="RAM"
                  value={form.ram}
                  onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))}
                  placeholder="4 GB"
                  disabled={disabledAll}
                />
              </ITGrid>}
              {showField("almacenamiento") && <ITGrid item xs={12} md={4}>
                <ITInput
                  name="almacenamiento"
                  label="Almacenamiento"
                  value={form.almacenamiento}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, almacenamiento: e.target.value }))
                  }
                  placeholder="64 GB"
                  disabled={disabledAll}
                />
              </ITGrid>}
            </>
          )}
        </ITGrid>
      </ITCard>

      {isBatch && (
        <>
          <ITCard className="p-5 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
            <ITFlex align="center" gap={2} className="mb-3">
              <FaMagic size={13} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Llenado rápido (opcional)
              </ITText>
            </ITFlex>
            <ITGrid container columns={12} spacing={3} className="items-end">
              <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                <ITInput
                  name="autoNombreBase"
                  label="Nombre de equipo (base)"
                  value={autoNombreBase}
                  onChange={(e) => setAutoNombreBase(e.target.value)}
                  placeholder="TABLET-AB"
                />
              </ITGrid>
              <ITGrid item xs={12} md={showITSpecs ? 2 : 3}>
                <ITInput
                  name="autoNombreStart"
                  label="Inicia en"
                  type="number"
                  min={1}
                  value={autoNombreStart}
                  onChange={(e) => setAutoNombreStart(e.target.value)}
                />
              </ITGrid>
              {showITSpecs && (
                <ITGrid item xs={12} md={4}>
                  <ITInput
                    name="autoIpBase"
                    label="IP inicial (autoincrementa)"
                    value={autoIpBase}
                    onChange={(e) => setAutoIpBase(e.target.value)}
                    placeholder="192.168.1.10"
                  />
                </ITGrid>
              )}
            </ITGrid>
            {(autoNombreBase.trim() || autoIpBase.trim()) && (
              <ITText className="text-[10px] font-bold text-emerald-600 mt-2">
                Se está autocompletando cada unidad conforme escribes — no hace falta aplicar nada.
              </ITText>
            )}
          </ITCard>

          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
            <ITFlex align="center" gap={2} className="mb-4">
              <FaBoxes size={14} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Unidades ({cantidad}) — captura serie{showITSpecs ? ", IP y MAC" : ""} de cada
                equipo
              </ITText>
            </ITFlex>

            <ITFlex direction="column" gap={3}>
              {units.slice(0, cantidad).map((u, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <ITFlex justify="between" align="center" className="mb-2">
                    <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Unidad {idx + 1} de {cantidad}
                    </ITText>
                    {cantidad > 1 && (
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => removeUnitRow(idx)}
                        title="Quitar esta unidad"
                      >
                        <FaTrash size={11} />
                      </ITButton>
                    )}
                  </ITFlex>
                  <ITGrid container columns={12} spacing={3}>
                    {showField("numeroSerie") && <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                      <ITInput
                        name={`serie-${idx}`}
                        label="No. Serie"
                        value={u.numeroSerie}
                        onChange={(e) => handleUnitField(idx, "numeroSerie", e.target.value)}
                      />
                    </ITGrid>}
                    {showField("nombreEquipo") && <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                      <ITInput
                        name={`eq-${idx}`}
                        label="Nombre del equipo"
                        value={u.nombreEquipo}
                        onChange={(e) => handleUnitField(idx, "nombreEquipo", e.target.value)}
                      />
                    </ITGrid>}
                    {(showField("ip") || showField("macAddress")) && (
                      <>
                        {showField("ip") && <ITGrid item xs={12} md={2}>
                          <ITInput
                            name={`ip-${idx}`}
                            label="IP"
                            value={u.ip}
                            onChange={(e) => handleUnitField(idx, "ip", e.target.value)}
                            placeholder="192.168.0.1"
                          />
                        </ITGrid>}
                        {showField("macAddress") && <ITGrid item xs={12} md={2}>
                          <ITInput
                            name={`mac-${idx}`}
                            label="MAC"
                            value={u.macAddress}
                            onChange={(e) =>
                              handleUnitField(idx, "macAddress", formatMacInput(e.target.value))
                            }
                            placeholder="AA:BB:CC:DD:EE:FF"
                          />
                        </ITGrid>}
                      </>
                    )}
</ITGrid>
                  </div>
                ))}
              </ITFlex>
            </ITCard>
          </>
        )}
        </>
      )}

      {isLoteEdit && (
        <>
          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
            <ITFlex align="center" gap={2} className="mb-4">
              <FaLayerGroup size={13} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Datos compartidos del lote
              </ITText>
            </ITFlex>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12}>
                <ITInput
                  name="desc"
                  label="Descripción"
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="marca"
                  label="Marca"
                  value={form.marca}
                  onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="modelo"
                  label="Modelo"
                  value={form.modelo}
                  onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                  required
                />
              </ITGrid>
              {showITSpecs && (
                <>
                  {showField("sistemaOp") && <ITGrid item xs={12} md={4}>
                    <ITInput
                      name="sistemaOp"
                      label="Sistema Operativo"
                      value={form.sistemaOp}
                      onChange={(e) => setForm((f) => ({ ...f, sistemaOp: e.target.value }))}
                      placeholder="Android 14 / Windows 11"
                    />
                  </ITGrid>}
                  {showField("ram") && <ITGrid item xs={12} md={4}>
                    <ITInput
                      name="ram"
                      label="RAM"
                      value={form.ram}
                      onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))}
                      placeholder="4 GB"
                    />
                  </ITGrid>}
                  {showField("almacenamiento") && <ITGrid item xs={12} md={4}>
                    <ITInput
                      name="almacenamiento"
                      label="Almacenamiento"
                      value={form.almacenamiento}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, almacenamiento: e.target.value }))
                      }
                      placeholder="64 GB"
                    />
                  </ITGrid>}
                </>
              )}
            </ITGrid>
          </ITCard>

          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
            <ITFlex align="center" gap={2} className="mb-4">
              <FaBoxes size={14} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Unidades ({loteRows.length})
              </ITText>
            </ITFlex>

            {loteLoading ? (
              <ITFlex justify="center" align="center" className="py-8">
                <ITLoader variant="spinner" size="md" color="primary" />
              </ITFlex>
            ) : (
              <ITFlex direction="column" gap={3}>
                {loteRows.map((r, idx) => {
                  const locked = r.estado === "ASIGNADO";
                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border p-4 ${
                        locked ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-slate-50/60"
                      }`}
                    >
                      <ITFlex justify="between" align="center" className="mb-2 flex-wrap">
                        <ITFlex align="center" gap={2}>
                          <ITText className="text-[11px] font-black text-slate-800">
                            {r.controlActivos}
                          </ITText>
                          <ITBadget
                            color={r.estado === "DISPONIBLE" ? "success" : r.estado === "ASIGNADO" ? "warning" : "gray"}
                            size="small"
                          >
                            {r.estado}
                          </ITBadget>
                        </ITFlex>
                        {locked && (
                          <ITFlex align="center" gap={1}>
                            <FaLock size={10} className="text-amber-600" />
                            <ITText className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                              Asignado — protegido
                            </ITText>
                          </ITFlex>
                        )}
                      </ITFlex>
                      <ITGrid container columns={12} spacing={3}>
                        {showField("numeroSerie") && <ITGrid item xs={12} md={showITSpecs ? 3 : 4}>
                          <ITInput
                            name={`lote-serie-${idx}`}
                            label="No. Serie"
                            value={r.numeroSerie}
                            onChange={(e) =>
                              setLoteRows((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, numeroSerie: e.target.value } : x))
                              )
                            }
                            disabled={locked}
                          />
                        </ITGrid>}
                        {showField("nombreEquipo") && <ITGrid item xs={12} md={showITSpecs ? 3 : 4}>
                          <ITInput
                            name={`lote-eq-${idx}`}
                            label="Nombre del equipo"
                            value={r.nombreEquipo}
                            onChange={(e) =>
                              setLoteRows((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, nombreEquipo: e.target.value } : x))
                              )
                            }
                            disabled={locked}
                          />
                        </ITGrid>}
                        {(showField("ip") || showField("macAddress")) && (
                          <>
                            {showField("ip") && <ITGrid item xs={12} md={3}>
                              <ITInput
                                name={`lote-ip-${idx}`}
                                label="IP"
                                value={r.ip}
                                onChange={(e) =>
                                  setLoteRows((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, ip: e.target.value } : x))
                                  )
                                }
                                placeholder="192.168.0.1"
                                disabled={locked}
                              />
                            </ITGrid>}
                            {showField("macAddress") && <ITGrid item xs={12} md={3}>
                              <ITInput
                                name={`lote-mac-${idx}`}
                                label="MAC Address"
                                value={r.macAddress}
                                onChange={(e) =>
                                  setLoteRows((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, macAddress: formatMacInput(e.target.value) } : x))
                                  )
                                }
                                placeholder="AA:BB:CC:DD:EE:FF"
                                disabled={locked}
                              />
                            </ITGrid>}
                          </>
                        )}
                        <ITGrid item xs={12} md={showITSpecs ? 12 : 4}>
                          <ITInput
                            name={`lote-area-${idx}`}
                            label="Área"
                            value={r.area}
                            onChange={(e) =>
                              setLoteRows((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, area: e.target.value } : x))
                              )
                            }
                            disabled={locked}
                          />
                        </ITGrid>
                      </ITGrid>
                    </div>
                  );
                })}
              </ITFlex>
            )}
          </ITCard>
        </>
      )}
    </ITPage>
  );
}
