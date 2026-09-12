import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deviceApi as devicesApi, type Device } from "@entities/device";
import {
  locationsApi,
  type Location,
  formatLocation,
} from "@entities/location";
import {
  inventoryApi,
  type CondicionType,
  type MovementType,
} from "@entities/inventory-movement";

export const useNewInventoryMovement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);
  const [searchParams] = useSearchParams();
  const deviceIdParam = searchParams.get("deviceId");

  const [devices, setDevices] = useState<Device[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

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
    Promise.all([devicesApi.list({}), locationsApi.list()])
      .then(([devRes, locRes]) => {
        setDevices(devRes.data ?? []);
        setLocations(locRes);
        if (deviceIdParam) {
          const found = devRes.data?.find((d: Device) => d.id === deviceIdParam);
          if (found) {
            setForm((f) => ({
              ...f,
              deviceId: found.id,
              locationId: found.locationId ?? "",
            }));
          }
        }
      })
      .catch((e: any) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
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

  const CONDICION_OPTIONS: {
    value: CondicionType;
    label: string;
    color: string;
  }[] = [
    { value: "BUENO", label: t("conditionLabels.BUENO"), color: "success" },
    {
      value: "ACEPTABLE",
      label: t("conditionLabels.ACEPTABLE"),
      color: "warning",
    },
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
          notas: form.notas
            ? `${form.notas} | Condición: ${form.condicion}`
            : `Condición: ${form.condicion}`,
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
          fechaRetornoEsperado: requiresPrestamoFields
            ? form.fechaRetornoEsperado
            : undefined,
          condicion: requiresDevolucionFields
            ? (form.condicion as CondicionType)
            : undefined,
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

  return {
    navigate,
    t,
    devices,
    locations,
    loading,
    error,
    setError,
    toast,
    setToast,
    form,
    setForm,
    saving,
    selectedDevice,
    requiresLocation,
    requiresPrestamoFields,
    requiresDevolucionFields,
    isMalasCondiciones,
    TIPO_OPTIONS,
    CONDICION_OPTIONS,
    handleSubmit,
    formatLocation,
  };
};

export type UseNewInventoryMovement = ReturnType<typeof useNewInventoryMovement>;