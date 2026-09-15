import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deviceApi as devicesApi, type Device } from "@entities/device";
import { departmentsApi, type Department } from "@entities/department";
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
  const tipoParam = searchParams.get("tipo");

  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const [form, setForm] = useState({
    deviceId: deviceIdParam || "",
    tipo: (tipoParam || "") as MovementType | "",
    departmentId: "",
    notas: "",
    prestadoA: "",
    fechaRetornoEsperado: "",
    condicion: "" as CondicionType | "",
    motivoBaja: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([devicesApi.list({}), departmentsApi.list()])
      .then(([devRes, deptRes]) => {
        setDevices(devRes.data ?? []);
        setDepartments(deptRes);
        if (deviceIdParam) {
          const found = devRes.data?.find((d: Device) => d.id === deviceIdParam);
          if (found) {
            setForm((f) => ({
              ...f,
              deviceId: found.id,
              departmentId: found.departmentId ?? "",
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

  const isValid =
    !!form.deviceId &&
    !!form.tipo &&
    (!requiresLocation || !!form.departmentId) &&
    (!requiresPrestamoFields ||
      (!!form.prestadoA.trim() && !!form.fechaRetornoEsperado)) &&
    (!requiresDevolucionFields || !!form.condicion);

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
    if (requiresLocation && !form.departmentId) {
      setToast({ message: t("validation.selectDepartment"), type: "error" });
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

    setSaving(true);
    try {
      await inventoryApi.registerMovement({
        deviceId: form.deviceId,
        tipo: form.tipo,
        departmentId: requiresLocation ? form.departmentId : undefined,
        notas: form.notas || undefined,
        prestadoA: requiresPrestamoFields ? form.prestadoA.trim() : undefined,
        fechaRetornoEsperado: requiresPrestamoFields
          ? form.fechaRetornoEsperado
          : undefined,
        condicion: requiresDevolucionFields
          ? (form.condicion as CondicionType)
          : undefined,
        motivoBaja: form.tipo === "BAJA" ? form.motivoBaja || undefined : undefined,
      });
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
    departments,
    loading,
    error,
    setError,
    toast,
    setToast,
    form,
    setForm,
    saving,
    isValid,
    selectedDevice,
    requiresLocation,
    requiresPrestamoFields,
    requiresDevolucionFields,
    TIPO_OPTIONS,
    CONDICION_OPTIONS,
    handleSubmit,
  };
};

export type UseNewInventoryMovement = ReturnType<typeof useNewInventoryMovement>;