import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deviceTypeApi as deviceTypesApi,
  type DeviceType,
} from "@entities/device-type";
import { deviceApi as devicesApi } from "@entities/device";
import { emptyUnit, toLoteRow, incrementIp, type UnitForm } from "./types";

interface BaseForm {
  typeId: string;
  descripcion: string;
  marca: string;
  modelo: string;
  area: string;
  sistemaOp: string;
  ram: string;
  almacenamiento: string;
}

export const useDeviceForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [types, setTypes] = useState<DeviceType[]>([]);
  const [form, setForm] = useState<BaseForm>({
    typeId: "",
    descripcion: "",
    marca: "",
    modelo: "",
    area: "SISTEMAS",
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
          macAddress: showField("macAddress")
            ? editUnit.macAddress || undefined
            : undefined,
          sistemaOp: showField("sistemaOp") ? form.sistemaOp || undefined : undefined,
          ram: showField("ram") ? form.ram || undefined : undefined,
          almacenamiento: showField("almacenamiento")
            ? form.almacenamiento || undefined
            : undefined,
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

  return {
    id,
    navigate,
    isEdit,
    types,
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