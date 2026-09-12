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
import { FaArrowRight, FaBoxOpen, FaMapMarkerAlt, FaSave, FaTicketAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deviceApi as devicesApi, type Device } from "@entities/device";
import { locationsApi, type Location, formatLocation } from "@entities/location";
import { inventoryApi, type MovementType, type CondicionType } from "@entities/inventory-movement";

export default function NewInventoryMovementPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);
  const [searchParams] = useSearchParams();
  const deviceIdParam = searchParams.get("deviceId");

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

  const TIPO_OPTIONS: { value: MovementType; label: string }[] = [
    { value: "ENTRADA", label: t("typeTitles.ENTRADA") },
    { value: "SALIDA", label: t("typeTitles.SALIDA") },
    { value: "TRASLADO", label: t("typeTitles.TRASLADO") },
    { value: "BAJA", label: t("typeTitles.BAJA") },
    { value: "PRESTAMO", label: t("typeTitles.PRESTAMO") },
    { value: "DEVOLUCION", label: t("typeTitles.DEVOLUCION") },
  ];

  const CONDICION_OPTIONS: { value: CondicionType; label: string; color: string }[] = [
    { value: "BUENO", label: t("conditionLabels.BUENO"), color: "success" },
    { value: "ACEPTABLE", label: t("conditionLabels.ACEPTABLE"), color: "warning" },
    { value: "MALO", label: t("conditionLabels.MALO"), color: "danger" },
    { value: "ROTO", label: t("conditionLabels.ROTO"), color: "danger" },
  ];

  const handleSubmit = async () => {
    if (!form.deviceId) {
      setToast({ message: t("validation.selectDevice"), type: "error" });
      return;
    }
    if (!form.tipo) {
      setToast({ message: t("validation.selectType"), type: "error" });
      return;
    }
    if (requiresLocation && !form.locationId) {
      setToast({ message: t("validation.selectLocation"), type: "error" });
      return;
    }
    if (requiresPrestamoFields && (!form.prestadoA.trim() || !form.fechaRetornoEsperado)) {
      setToast({ message: t("validation.prestamoFields"), type: "error" });
      return;
    }
    if (requiresDevolucionFields && !form.condicion) {
      setToast({ message: t("validation.selectCondition"), type: "error" });
      return;
    }
    if (isMalasCondiciones && !form.accionMalasCondiciones) {
      setToast({ message: t("validation.malasAction"), type: "error" });
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
      setToast({ message: t("messages.movementRegistered"), type: "success" });
      setTimeout(() => navigate("/inventario/movimientos"), 1200);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("new.loadingTitle")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("new.title")}
      backAction={() => navigate("/inventario/movimientos")}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("index.title"), onClick: () => navigate("/inventario") },
        { label: t("movements.loadingTitle"), onClick: () => navigate("/inventario/movimientos") },
        { label: t("common:actions.new") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("new.register")}</ITText>
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
            {t("new.movementData")}
          </ITText>

          <ITSearchSelect
            name="device"
            label={t("new.device")}
            placeholder={t("new.devicePlaceholder")}
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
                    {t("new.currentLocation", { loc: formatLocation(selectedDevice.location) })}
                  </ITText>
                </ITFlex>
              </ITStack>
            </ITCard>
          )}

          <ITSearchSelect
            name="tipo"
            label={t("new.movementType")}
            options={TIPO_OPTIONS}
            value={form.tipo}
            onChange={(val) => setForm((f) => ({ ...f, tipo: val as MovementType, condicion: "", accionMalasCondiciones: "" }))}
          />

          {requiresLocation && (
            <ITSearchSelect
              name="location"
              label={t("new.destLocation")}
              placeholder={t("new.destPlaceholder")}
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
                {t("new.prestamoTitle")}
              </ITText>
              <ITInput
                name="prestadoA"
                label={t("new.assignedTo")}
                value={form.prestadoA}
                onChange={(e) => setForm((f) => ({ ...f, prestadoA: e.target.value }))}
                placeholder={t("new.assignedToPlaceholder")}
              />
              <ITInput
                name="fechaRetornoEsperado"
                label={t("new.returnDate")}
                value={form.fechaRetornoEsperado}
                onChange={(e) => setForm((f) => ({ ...f, fechaRetornoEsperado: e.target.value }))}
                placeholder={t("new.returnDatePlaceholder")}
              />
            </ITStack>
          )}

          {requiresDevolucionFields && (
            <ITStack direction="column" spacing={4} className="p-4 bg-green-50 rounded-xl border border-green-100">
              <ITText className="text-[11px] font-black uppercase tracking-widest text-green-600">
                {t("new.devolutionTitle")}
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
                {t("new.malasTitle")}
              </ITText>
              <ITFlex gap={2} wrap="wrap">
                <ITButton
                  variant={form.accionMalasCondiciones === "BAJA" ? "filled" : "outlined"}
                  color="danger"
                  onClick={() => setForm((f) => ({ ...f, accionMalasCondiciones: "BAJA" }))}
                >
                  <ITFlex align="center" gap={1}>
                    <FaArrowRight size={12} />
                    <ITText className="font-bold text-[11px]">{t("new.darDeBaja")}</ITText>
                  </ITFlex>
                </ITButton>
                <ITButton
                  variant={form.accionMalasCondiciones === "TICKET" ? "filled" : "outlined"}
                  color="warning"
                  onClick={() => setForm((f) => ({ ...f, accionMalasCondiciones: "TICKET" }))}
                >
                  <ITFlex align="center" gap={1}>
                    <FaTicketAlt size={12} />
                    <ITText className="font-bold text-[11px]">{t("new.crearTicket")}</ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
              {form.accionMalasCondiciones === "TICKET" && (
                <ITAlert variant="warning">
                  {t("new.ticketAlert")}
                </ITAlert>
              )}
              {form.accionMalasCondiciones === "BAJA" && (
                <ITAlert variant="error">
                  {t("new.bajaAlert")}
                </ITAlert>
              )}
            </ITStack>
          )}

          {form.tipo === "SALIDA" && selectedDevice?.location && (
            <ITFlex align="center" gap={2} className="p-3 bg-red-50 rounded-xl border border-red-100">
              <FaArrowRight size={14} className="text-red-500" />
              <ITText className="text-[11px] text-red-600">
                {t("new.retirarDe")} <strong>{formatLocation(selectedDevice.location)}</strong>
              </ITText>
            </ITFlex>
          )}

          {form.tipo === "BAJA" && (
            <ITStack direction="column" spacing={3}>
              <ITAlert variant="error" dismissible={false}>
                {t("new.bajaNota")}
              </ITAlert>
              <ITInput
                name="motivoBaja"
                label={t("new.motivoBaja")}
                value={form.motivoBaja}
                onChange={(e) => setForm((f) => ({ ...f, motivoBaja: e.target.value }))}
                placeholder={t("new.motivoBajaPlaceholder")}
              />
            </ITStack>
          )}

          <ITInput
            name="notas"
            label={t("new.notas")}
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            placeholder={t("new.notasPlaceholder")}
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