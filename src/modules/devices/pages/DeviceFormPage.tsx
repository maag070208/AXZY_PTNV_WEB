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
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBoxes, FaLayerGroup, FaLock, FaMagic, FaSave, FaTrash } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deviceTypesApi,
  devicesApi,
  type Device,
  type DeviceType,
} from "@core/api/devices.api";
import { formatMacInput, isITDeviceCode } from "@core/utils/itDevice";

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
  const showITSpecs = isITDeviceCode(selectedType?.code);
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

  const applyAutoNombre = () => {
    if (!autoNombreBase.trim()) return;
    const startNum = Number(autoNombreStart) || 1;
    setUnits((prev) =>
      prev.map((u, i) => ({
        ...u,
        nombreEquipo: `${autoNombreBase.trim()}-${String(startNum + i).padStart(2, "0")}`,
      }))
    );
  };

  const applyAutoIp = () => {
    if (!autoIpBase.trim()) return;
    setUnits((prev) =>
      prev.map((u, i) => {
        const next = incrementIp(autoIpBase.trim(), i);
        return next ? { ...u, ip: next } : u;
      })
    );
  };

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
            sistemaOp: showITSpecs ? form.sistemaOp || undefined : undefined,
            ram: showITSpecs ? form.ram || undefined : undefined,
            almacenamiento: showITSpecs ? form.almacenamiento || undefined : undefined,
            units: loteRows
              .filter((r) => r.estado !== "ASIGNADO")
              .map((r) => ({
                id: r.id,
                numeroSerie: r.numeroSerie || undefined,
                nombreEquipo: r.nombreEquipo || undefined,
                ip: showITSpecs ? r.ip || undefined : undefined,
                macAddress: showITSpecs ? r.macAddress || undefined : undefined,
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
          ip: showITSpecs ? editUnit.ip || undefined : undefined,
          macAddress: showITSpecs ? editUnit.macAddress || undefined : undefined,
          sistemaOp: showITSpecs ? form.sistemaOp || undefined : undefined,
          ram: showITSpecs ? form.ram || undefined : undefined,
          almacenamiento: showITSpecs ? form.almacenamiento || undefined : undefined,
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
        sistemaOp: showITSpecs ? form.sistemaOp || undefined : undefined,
        ram: showITSpecs ? form.ram || undefined : undefined,
        almacenamiento: showITSpecs ? form.almacenamiento || undefined : undefined,
        units: units.slice(0, cantidad).map((u) => ({
          numeroSerie: u.numeroSerie || undefined,
          nombreEquipo: u.nombreEquipo || undefined,
          ip: showITSpecs ? u.ip || undefined : undefined,
          macAddress: showITSpecs ? u.macAddress || undefined : undefined,
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

      {!isLoteEdit && (
        <>
      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={isEdit ? 6 : 4}>
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
              disabled={disabledAll}
            />
          </ITGrid>
          {!isEdit && (
            <ITGrid item xs={12} md={2}>
              <ITInput
                name="cantidad"
                label="Cantidad *"
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
              label="Descripción *"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              required
              disabled={disabledAll}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="marca"
              label="Marca *"
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
              required
              disabled={disabledAll}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="modelo"
              label="Modelo *"
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
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="serie"
                  label="No. Serie"
                  value={editUnit.numeroSerie}
                  onChange={(e) =>
                    setEditUnit((u) => ({ ...u, numeroSerie: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="eq"
                  label="Nombre del equipo"
                  value={editUnit.nombreEquipo}
                  onChange={(e) =>
                    setEditUnit((u) => ({ ...u, nombreEquipo: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </ITGrid>
            </>
          )}

          {!isEdit && !isBatch && (
            <>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="serie"
                  label="No. Serie"
                  value={units[0]?.numeroSerie ?? ""}
                  onChange={(e) => handleUnitField(0, "numeroSerie", e.target.value)}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="eq"
                  label="Nombre del equipo"
                  value={units[0]?.nombreEquipo ?? ""}
                  onChange={(e) => handleUnitField(0, "nombreEquipo", e.target.value)}
                />
              </ITGrid>
            </>
          )}

          {showITSpecs && isEdit && (
            <>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="ip"
                  label="Dirección IP"
                  value={editUnit.ip}
                  onChange={(e) => setEditUnit((u) => ({ ...u, ip: e.target.value }))}
                  placeholder="192.168.0.1"
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
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
              </ITGrid>
            </>
          )}

          {showITSpecs && !isEdit && !isBatch && (
            <>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="ip"
                  label="Dirección IP"
                  value={units[0]?.ip ?? ""}
                  onChange={(e) => handleUnitField(0, "ip", e.target.value)}
                  placeholder="192.168.0.1"
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="mac"
                  label="MAC Address"
                  value={units[0]?.macAddress ?? ""}
                  onChange={(e) =>
                    handleUnitField(0, "macAddress", formatMacInput(e.target.value))
                  }
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </ITGrid>
            </>
          )}

          {showITSpecs && (
            <>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="sistemaOp"
                  label="Sistema Operativo"
                  value={form.sistemaOp}
                  onChange={(e) => setForm((f) => ({ ...f, sistemaOp: e.target.value }))}
                  placeholder="Android 13 / Windows 11"
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="ram"
                  label="RAM"
                  value={form.ram}
                  onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))}
                  placeholder="4 GB"
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
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
              </ITGrid>
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
              <ITGrid item xs={12} md={3}>
                <ITInput
                  name="autoNombreBase"
                  label="Nombre de equipo (base)"
                  value={autoNombreBase}
                  onChange={(e) => setAutoNombreBase(e.target.value)}
                  placeholder="TABLET-AB"
                />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITInput
                  name="autoNombreStart"
                  label="Inicia en"
                  type="number"
                  min={1}
                  value={autoNombreStart}
                  onChange={(e) => setAutoNombreStart(e.target.value)}
                />
              </ITGrid>
              <ITGrid item xs={6} md={2}>
                <ITButton variant="outlined" color="secondary" onClick={applyAutoNombre}>
                  Aplicar a todos
                </ITButton>
              </ITGrid>
              {showITSpecs && (
                <>
                  <ITGrid item xs={12} md={3}>
                    <ITInput
                      name="autoIpBase"
                      label="IP inicial (autoincrementa)"
                      value={autoIpBase}
                      onChange={(e) => setAutoIpBase(e.target.value)}
                      placeholder="192.168.1.10"
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={2}>
                    <ITButton variant="outlined" color="secondary" onClick={applyAutoIp}>
                      Aplicar a todos
                    </ITButton>
                  </ITGrid>
                </>
              )}
            </ITGrid>
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
                    <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                      <ITInput
                        name={`serie-${idx}`}
                        label="No. Serie"
                        value={u.numeroSerie}
                        onChange={(e) => handleUnitField(idx, "numeroSerie", e.target.value)}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                      <ITInput
                        name={`eq-${idx}`}
                        label="Nombre del equipo"
                        value={u.nombreEquipo}
                        onChange={(e) => handleUnitField(idx, "nombreEquipo", e.target.value)}
                      />
                    </ITGrid>
                    {showITSpecs && (
                      <>
                        <ITGrid item xs={12} md={2}>
                          <ITInput
                            name={`ip-${idx}`}
                            label="IP"
                            value={u.ip}
                            onChange={(e) => handleUnitField(idx, "ip", e.target.value)}
                            placeholder="192.168.0.1"
                          />
                        </ITGrid>
                        <ITGrid item xs={12} md={2}>
                          <ITInput
                            name={`mac-${idx}`}
                            label="MAC"
                            value={u.macAddress}
                            onChange={(e) =>
                              handleUnitField(idx, "macAddress", formatMacInput(e.target.value))
                            }
                            placeholder="AA:BB:CC:DD:EE:FF"
                          />
                        </ITGrid>
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
              {showITSpecs && (
                <>
                  <ITGrid item xs={12} md={4}>
                    <ITInput
                      name="sistemaOp"
                      label="Sistema Operativo"
                      value={form.sistemaOp}
                      onChange={(e) => setForm((f) => ({ ...f, sistemaOp: e.target.value }))}
                      placeholder="Android 14 / Windows 11"
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={4}>
                    <ITInput
                      name="ram"
                      label="RAM"
                      value={form.ram}
                      onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))}
                      placeholder="4 GB"
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={4}>
                    <ITInput
                      name="almacenamiento"
                      label="Almacenamiento"
                      value={form.almacenamiento}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, almacenamiento: e.target.value }))
                      }
                      placeholder="64 GB"
                    />
                  </ITGrid>
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
                        <ITGrid item xs={12} md={showITSpecs ? 3 : 4}>
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
                        </ITGrid>
                        <ITGrid item xs={12} md={showITSpecs ? 3 : 4}>
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
                        </ITGrid>
                        {showITSpecs && (
                          <>
                            <ITGrid item xs={12} md={3}>
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
                            </ITGrid>
                            <ITGrid item xs={12} md={3}>
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
                            </ITGrid>
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
