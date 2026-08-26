import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITLoader,
  ITPage,
  ITSearchSelect,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaBoxOpen, FaCalendarAlt, FaMapMarkerAlt, FaSave, FaTicketAlt, FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@core/store/store";
import { devicesApi, type Device, type Location } from "@core/api/devices.api";
import { locationsApi } from "@core/api/locations.api";
import { inventoryApi, type MovementType, type CondicionType } from "@core/api/inventory.api";

const TIPO_OPTIONS = [
  { value: "ENTRADA", label: "Entrada (alta en inventario)" },
  { value: "SALIDA", label: "Salida (retirar de ubicación)" },
  { value: "TRASLADO", label: "Traslado (mover a otra ubicación)" },
  { value: "BAJA", label: "Baja (dar de baja el dispositivo)" },
  { value: "PRESTAMO", label: "Préstamo (equipo prestado a alguien)" },
  { value: "DEVOLUCION", label: "Devolución (equipo regresado de préstamo)" },
];

const CONDICION_OPTIONS = [
  { value: "BUENO", label: "Bueno", color: "success" },
  { value: "ACEPTABLE", label: "Aceptable", color: "warning" },
  { value: "MALO", label: "Malo", color: "danger" },
  { value: "ROTO", label: "Roto", color: "danger" },
];

const formatLocation = (loc?: Location | null): string => {
  if (!loc) return "Sin ubicación";
  const parts = [loc.lugar, loc.subLugar, loc.numero].filter(Boolean);
  return parts.length > 0 ? parts.join("-") : "Ubicación";
};

export default function NewInventoryMovementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deviceIdParam = searchParams.get("deviceId");

  const currentUser = useSelector((s: RootState) => s.auth.user);

  const [devices, setDevices] = useState<Device[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [form, setForm] = useState({
    deviceId: deviceIdParam || "",
    tipo: "" as MovementType | "",
    locationId: "",
    notas: "",
    prestadoA: "",
    fechaRetornoEsperado: "",
    condicion: "" as CondicionType | "",
    motivoBaja: "",
    accionMalasCondiciones: "" as "BAJA" | "TICKET" | "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      devicesApi.list({}),
      locationsApi.list(),
    ]).then(([devRes, locRes]) => {
      setDevices(devRes.data ?? []);
      setLocations(locRes);
      if (deviceIdParam) {
        const found = devRes.data?.find((d: Device) => d.id === deviceIdParam);
        if (found) {
          setForm((f) => ({ ...f, deviceId: found.id, locationId: found.locationId ?? "" }));
        }
      }
    }).catch((e: any) => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [deviceIdParam]);

  const selectedDevice = devices.find((d) => d.id === form.deviceId);
  const requiresLocation = form.tipo === "ENTRADA" || form.tipo === "TRASLADO";
  const requiresPrestamoFields = form.tipo === "PRESTAMO";
  const requiresDevolucionFields = form.tipo === "DEVOLUCION";
  const isMalasCondiciones = form.condicion === "MALO" || form.condicion === "ROTO";

  const handleSubmit = async () => {
    if (!form.deviceId) {
      setToast({ message: "Selecciona un dispositivo", type: "error" });
      return;
    }
    if (!form.tipo) {
      setToast({ message: "Selecciona el tipo de movimiento", type: "error" });
      return;
    }
    if (requiresLocation && !form.locationId) {
      setToast({ message: "Selecciona una ubicación", type: "error" });
      return;
    }
    if (requiresPrestamoFields && (!form.prestadoA.trim() || !form.fechaRetornoEsperado)) {
      setToast({ message: "Ingresa el nombre de la persona y fecha de retorno", type: "error" });
      return;
    }
    if (requiresDevolucionFields && !form.condicion) {
      setToast({ message: "Selecciona la condición del equipo", type: "error" });
      return;
    }
    if (isMalasCondiciones && !form.accionMalasCondiciones) {
      setToast({ message: "Selecciona una acción para equipo en malas condiciones", type: "error" });
      return;
    }

    setSaving(true);
    try {
      if (isMalasCondiciones && form.accionMalasCondiciones === "BAJA") {
        await inventoryApi.registerMovement({
          deviceId: form.deviceId,
          tipo: "BAJA",
          notas: form.notas ? `${form.notas} | Condición: ${form.condicion}` : `Condición: ${form.condicion}`,
          motivoBaja: `Equipo devuelto en condiciones ${form.condicion.toLowerCase()}`,
        });
        await inventoryApi.registerMovement({
          deviceId: form.deviceId,
          tipo: "DEVOLUCION",
          notas: form.notas || undefined,
          condicion: form.condicion as CondicionType,
        });
      } else if (isMalasCondiciones && form.accionMalasCondiciones === "TICKET") {
        await inventoryApi.registerMovement({
          deviceId: form.deviceId,
          tipo: "DEVOLUCION",
          notas: form.notas || undefined,
          condicion: form.condicion as CondicionType,
        });
      } else {
        await inventoryApi.registerMovement({
          deviceId: form.deviceId,
          tipo: form.tipo,
          locationId: requiresLocation ? form.locationId : undefined,
          notas: form.notas || undefined,
          prestadoA: requiresPrestamoFields ? form.prestadoA.trim() : undefined,
          fechaRetornoEsperado: requiresPrestamoFields ? form.fechaRetornoEsperado : undefined,
          condicion: requiresDevolucionFields ? form.condicion as CondicionType : undefined,
        });
      }
      setToast({ message: "Movimiento registrado", type: "success" });
      setTimeout(() => navigate("/inventario/movimientos"), 1200);
    } catch (e: any) {
      setToast({ message: e.message || "Error al registrar", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title="Nuevo movimiento" loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title="Registrar movimiento"
      backAction={() => navigate("/inventario/movimientos")}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Inventario", onClick: () => navigate("/inventario") },
        { label: "Movimientos", onClick: () => navigate("/inventario/movimientos") },
        { label: "Nuevo" },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? "Guardando..." : "Registrar"}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] overflow-visible">
        <ITStack direction="column" spacing={5}>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Datos del movimiento
          </ITText>

          <ITSearchSelect
            name="device"
            label="Dispositivo"
            placeholder="Buscar por código, descripción o serie..."
            options={devices.map((d) => ({
              value: d.id,
              label: `${d.controlActivos} - ${d.descripcion} (${d.marca} ${d.modelo})`,
            }))}
            value={form.deviceId}
            onChange={(val) => {
              const dev = devices.find((d) => d.id === val);
              setForm((f) => ({
                ...f,
                deviceId: val as string,
                locationId: dev?.locationId ?? "",
              }));
            }}
          />

          {selectedDevice && (
            <ITCard className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <ITStack direction="column" spacing={2}>
                <ITFlex align="center" gap={2}>
                  <FaBoxOpen size={14} className="text-slate-400" />
                  <ITText className="text-[11px] font-bold text-slate-700">
                    {selectedDevice.controlActivos}
                  </ITText>
                  <ITBadget color={selectedDevice.estado === "DISPONIBLE" ? "success" : selectedDevice.estado === "ASIGNADO" ? "warning" : "danger"} size="small">
                    {selectedDevice.estado}
                  </ITBadget>
                </ITFlex>
                <ITFlex align="center" gap={2}>
                  <FaMapMarkerAlt size={12} className="text-slate-400" />
                  <ITText className="text-[11px] text-slate-500">
                    Ubicación actual: {formatLocation(selectedDevice.location)}
                  </ITText>
                </ITFlex>
              </ITStack>
            </ITCard>
          )}

          <ITSearchSelect
            name="tipo"
            label="Tipo de movimiento"
            options={TIPO_OPTIONS}
            value={form.tipo}
            onChange={(val) => setForm((f) => ({ ...f, tipo: val as MovementType, condicion: "", accionMalasCondiciones: "" }))}
          />

          {requiresLocation && (
            <ITSearchSelect
              name="location"
              label="Ubicación destino"
              placeholder="Seleccionar ubicación..."
              options={locations.map((l) => ({
                value: l.id,
                label: formatLocation(l),
              }))}
              value={form.locationId}
              onChange={(val) => setForm((f) => ({ ...f, locationId: val as string }))}
            />
          )}

          {requiresPrestamoFields && (
            <ITStack direction="column" spacing={4} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <ITText className="text-[11px] font-black uppercase tracking-widest text-blue-600">
                Datos del préstamo
              </ITText>
              <ITInput
                name="prestadoA"
                label="Prestado a"
                value={form.prestadoA}
                onChange={(e) => setForm((f) => ({ ...f, prestadoA: e.target.value }))}
                placeholder="Nombre de quien recibe el equipo..."
              />
              <ITInput
                name="fechaRetornoEsperado"
                label="Fecha de retorno esperada (YYYY-MM-DD)"
                value={form.fechaRetornoEsperado}
                onChange={(e) => setForm((f) => ({ ...f, fechaRetornoEsperado: e.target.value }))}
                placeholder="YYYY-MM-DD"
              />
            </ITStack>
          )}

          {requiresDevolucionFields && (
            <ITStack direction="column" spacing={4} className="p-4 bg-green-50 rounded-xl border border-green-100">
              <ITText className="text-[11px] font-black uppercase tracking-widest text-green-600">
                Condición del equipo al regresar
              </ITText>
              <ITFlex gap={2} wrap="wrap">
                {CONDICION_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, condicion: c.value as CondicionType, accionMalasCondiciones: "" }))}
                    className={`px-4 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                      form.condicion === c.value
                        ? c.value === "BUENO" ? "bg-emerald-500 text-white border-emerald-500"
                        : c.value === "ACEPTABLE" ? "bg-amber-500 text-white border-amber-500"
                        : "bg-red-500 text-white border-red-500"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </ITFlex>
            </ITStack>
          )}

          {isMalasCondiciones && (
            <ITStack direction="column" spacing={4} className="p-4 bg-red-50 rounded-xl border border-red-200">
              <ITText className="text-[11px] font-black uppercase tracking-widest text-red-600">
                El equipo está en malas condiciones. ¿Qué acción deseas tomar?
              </ITText>
              <ITFlex gap={2} wrap="wrap">
                <ITButton
                  variant={form.accionMalasCondiciones === "BAJA" ? "filled" : "outlined"}
                  color="danger"
                  onClick={() => setForm((f) => ({ ...f, accionMalasCondiciones: "BAJA" }))}
                >
                  <ITFlex align="center" gap={1}>
                    <FaArrowRight size={12} />
                    <ITText className="font-bold text-[11px]">Dar de baja</ITText>
                  </ITFlex>
                </ITButton>
                <ITButton
                  variant={form.accionMalasCondiciones === "TICKET" ? "filled" : "outlined"}
                  color="warning"
                  onClick={() => setForm((f) => ({ ...f, accionMalasCondiciones: "TICKET" }))}
                >
                  <ITFlex align="center" gap={1}>
                    <FaTicketAlt size={12} />
                    <ITText className="font-bold text-[11px]">Crear ticket de mantenimiento</ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
              {form.accionMalasCondiciones === "TICKET" && (
                <ITAlert variant="warning">
                  Se creará un ticket de mantenimiento URGENTE para este equipo.
                </ITAlert>
              )}
              {form.accionMalasCondiciones === "BAJA" && (
                <ITAlert variant="error">
                  El dispositivo será dado de baja permanentemente.
                </ITAlert>
              )}
            </ITStack>
          )}

          {form.tipo === "SALIDA" && selectedDevice?.location && (
            <ITFlex align="center" gap={2} className="p-3 bg-red-50 rounded-xl border border-red-100">
              <FaArrowRight size={14} className="text-red-500" />
              <ITText className="text-[11px] text-red-600">
                El dispositivo se retirará de: <strong>{formatLocation(selectedDevice.location)}</strong>
              </ITText>
            </ITFlex>
          )}

          {form.tipo === "BAJA" && (
            <ITStack direction="column" spacing={3}>
              <ITAlert variant="error" dismissible={false}>
                Esta acción marcará el dispositivo como BAJA. No podrá ser usado nuevamente.
              </ITAlert>
              <ITInput
                name="motivoBaja"
                label="Motivo de la baja (opcional)"
                value={form.motivoBaja}
                onChange={(e) => setForm((f) => ({ ...f, motivoBaja: e.target.value }))}
                placeholder="Ej. Equipo en mal estado, robado, etc."
              />
            </ITStack>
          )}

          <ITInput
            name="notas"
            label="Notas (opcional)"
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            placeholder="Observaciones adicionales..."
          />
        </ITStack>
      </ITCard>

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}