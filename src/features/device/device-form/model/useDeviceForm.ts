import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  deviceTypeApi as deviceTypesApi,
  type DeviceType,
} from "@entities/device-type";
import { deviceApi as devicesApi } from "@entities/device";
import { locationsApi, type Location } from "@entities/location";
import { emptyUnit, toLoteRow, incrementIp, type UnitForm } from "./types";

interface BaseForm {
  typeId: string;
  descripcion: string;
  marca: string;
  modelo: string;
  area: string;
  locationId: string;
  sistemaOp: string;
  ram: string;
  almacenamiento: string;
}

export const useDeviceForm = () => {
  const { t: tt } = useTranslation(["device", "common"]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [types, setTypes] = useState<DeviceType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<BaseForm>({
    typeId: "",
    descripcion: "",
    marca: "",
    modelo: "",
    area: "SISTEMAS",
    locationId: "",
    sistemaOp: "",
    ram: "",
    almacenamiento: "",
  });

  const [editUnit, setEditUnit] = useState<UnitForm>(emptyUnit());
  const [blocked, setBlocked] = useState(false);
  const [blockedAssetCode, setBlockedAssetCode] = useState("");
  const [loteId, setLoteId] = useState<string | null>(null);
  const [loteSize, setLoteSize] = useState(1);
  const [loteRows, setLoteRows] = useState<ReturnType<typeof toLoteRow>[]>([]);
  const [loteLoading, setLoteLoading] = useState(false);

  const [cantidad, setCantidad] = useState(1);
  const [units, setUnits] = useState<ReturnType<typeof emptyUnit>[]>([
    emptyUnit(),
  ]);
  const [autoNombreBase, setAutoNombreBase] = useState("");
  const [autoNombreStart, setAutoNombreStart] = useState("1");
  const [autoIpBase, setAutoIpBase] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [addQty, setAddQty] = useState(1);
  const [addingUnits, setAddingUnits] = useState(false);

  const [unitToRemove, setUnitToRemove] = useState<ReturnType<
    typeof toLoteRow
  > | null>(null);
  const [removingUnit, setRemovingUnit] = useState(false);

  useEffect(() => {
    setLoading(true);
    locationsApi.list().then(setLocations).catch(() => setLocations([]));
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
            locationId: d.locationId ?? "",
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

  // Mantiene el arreglo de unidades sincronizado con la cantidad capturada.
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
  const showITSpecs = [
    "ip",
    "macAddress",
    "sistemaOp",
    "ram",
    "almacenamiento",
  ].some((field) => showField(field as keyof DeviceType["fieldConfig"]));
  const isBatch = !isEdit && cantidad > 1;
  const isLoteEdit = isEdit && !!loteId && loteSize > 1;
  const disabledAll = isEdit && blocked;
  const loteHasAssigned = useMemo(
    () => loteRows.some((r) => r.estado === "ASIGNADO"),
    [loteRows]
  );

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

  // Autocompleta el nombre de cada unidad en vivo.
  useEffect(() => {
    if (!autoNombreBase.trim()) return;
    const startNum = Number(autoNombreStart) || 1;
    setUnits((prev) =>
      prev.map((u, i) => ({
        ...u,
        nombreEquipo: `${autoNombreBase.trim()}-${String(startNum + i).padStart(
          2,
          "0"
        )}`,
      }))
    );
  }, [autoNombreBase, autoNombreStart, cantidad]);

  // Autocompleta la IP de cada unidad en vivo (autoincrementando).
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
            typeId: form.typeId,
            descripcion: form.descripcion,
            marca: form.marca,
            modelo: form.modelo,
            sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
            ram: showField("ram") ? form.ram || undefined : undefined,
            almacenamiento: showField("almacenamiento")
              ? form.almacenamiento || undefined
              : undefined,
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
          return;
        }
        await devicesApi.update(id, {
          typeId: form.typeId,
          descripcion: form.descripcion,
          marca: form.marca,
          modelo: form.modelo,
          area: form.area,
          // Se manda siempre (aunque venga vacío) para poder quitar una
          // ubicación ya asignada: "" le indica al backend "sin ubicación".
          locationId: form.locationId,
          numeroSerie: editUnit.numeroSerie || undefined,
          nombreEquipo: editUnit.nombreEquipo || undefined,
          ip: showField("ip") ? editUnit.ip || undefined : undefined,
          macAddress: showField("macAddress")
            ? editUnit.macAddress || undefined
            : undefined,
          sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
          ram: showField("ram") ? form.ram || undefined : undefined,
          almacenamiento: showField("almacenamiento")
            ? form.almacenamiento || undefined
            : undefined,
        });
        return;
      }

      const res = await devicesApi.createBatch({
        typeId: form.typeId,
        descripcion: form.descripcion,
        marca: form.marca,
        modelo: form.modelo,
        area: form.area,
        locationId: form.locationId || undefined,
        sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
        ram: showField("ram") ? form.ram || undefined : undefined,
        almacenamiento: showField("almacenamiento")
          ? form.almacenamiento || undefined
          : undefined,
        units: units.slice(0, cantidad).map((u) => ({
          numeroSerie: u.numeroSerie || undefined,
          nombreEquipo: u.nombreEquipo || undefined,
          ip: showField("ip") ? u.ip || undefined : undefined,
          macAddress: showField("macAddress") ? u.macAddress || undefined : undefined,
        })),
      });

      if (cantidad > 1) {
        setSuccess(tt("device:form.addedCount", { count: res.total }));
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

  const requestRemoveLoteUnit = (row: ReturnType<typeof toLoteRow>) =>
    setUnitToRemove(row);
  const cancelRemoveLoteUnit = () => setUnitToRemove(null);

  const confirmRemoveLoteUnit = async () => {
    if (!unitToRemove || !loteId) return;
    setRemovingUnit(true);
    setError(null);
    setSuccess(null);
    try {
      // force=true: se está deshaciendo un alta reciente (unidad nunca
      // asignada), así que se borra por completo en lugar de solo darla
      // de baja — de otro modo seguiría contando en el tamaño del lote.
      await devicesApi.remove(unitToRemove.id, true);
      const freshLote = await devicesApi.getLote(loteId);
      setLoteRows(freshLote.data.map(toLoteRow));
      setLoteSize(freshLote.total);
      setSuccess(`Unidad ${unitToRemove.controlActivos} eliminada del lote.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRemovingUnit(false);
      setUnitToRemove(null);
    }
  };

  return {
    id,
    navigate,
    isEdit,
    types,
    locations,
    form,
    setForm,
    editUnit,
    setEditUnit,
    blocked,
    blockedAssetCode,
    loteId,
    loteSize,
    loteRows,
    setLoteRows,
    loteLoading,
    loteHasAssigned,
    unitToRemove,
    removingUnit,
    requestRemoveLoteUnit,
    cancelRemoveLoteUnit,
    confirmRemoveLoteUnit,
    cantidad,
    setCantidad,
    units,
    setUnits,
    autoNombreBase,
    setAutoNombreBase,
    autoNombreStart,
    setAutoNombreStart,
    autoIpBase,
    setAutoIpBase,
    loading,
    saving,
    error,
    setError,
    success,
    setSuccess,
    addQty,
    setAddQty,
    addingUnits,
    selectedType,
    showField,
    showITSpecs,
    isBatch,
    isLoteEdit,
    disabledAll,
    handleUnitField,
    removeUnitRow,
    handleSubmit,
    handleAddUnits,
  };
};

export type UseDeviceForm = ReturnType<typeof useDeviceForm>;