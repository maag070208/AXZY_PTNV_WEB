import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deviceTypeApi as deviceTypesApi,
  type DeviceFieldKey,
  type DeviceType,
} from "@entities/device-type";
import { deviceApi as devicesApi } from "@entities/device";
import { i18n } from "@shared/i18n";

export const GENERIC_TYPE_CODE = "GENERICO";

export interface UnitRow {
  numeroSerie: string;
  ip: string;
  macAddress: string;
}

export interface Row {
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

export interface RowResult {
  key: string;
  modelo: string;
  ok: boolean;
  detail: string;
}

export const SHARED_FIELDS = ["sistemaOp", "ram", "almacenamiento"] as const;
export const UNIT_FIELDS = ["numeroSerie", "ip", "macAddress"] as const;

export const useDeviceImport = () => {
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
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);

  useEffect(() => {
    deviceTypesApi
      .list()
      .then(setDeviceTypes)
      .catch(() => setDeviceTypes([]))
      .finally(() => setTypesLoaded(true));
  }, []);

  const defaultTypeId =
    deviceTypes.find((t) => t.code?.toUpperCase() === GENERIC_TYPE_CODE)?.id ??
    deviceTypes[0]?.id ??
    "";

  const normalizeTypeText = (value: string) =>
    value.trim().toUpperCase().replace(/\s+/g, "_");

  const resolveTypeId = (value?: string) => {
    if (!value?.trim()) return defaultTypeId;
    const normalized = normalizeTypeText(value);
    return (
      deviceTypes.find(
        (type) =>
          normalizeTypeText(type.code) === normalized ||
          normalizeTypeText(type.name) === normalized
      )?.id ?? ""
    );
  };

  const createUnits = (cantidad: string | number, previous: UnitRow[] = []) => {
    const total = Math.max(
      0,
      Math.min(500, Math.trunc(Number(cantidad) || 0))
    );
    return Array.from(
      { length: total },
      (_, index) =>
        previous[index] ?? { numeroSerie: "", ip: "", macAddress: "" }
    );
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
      const unknown = Array.from(
        new Set(
          res.rows
            .map((row) => row.tipo?.trim())
            .filter(
              (tipo): tipo is string =>
                Boolean(tipo && !resolveTypeId(tipo))
            )
        )
      );
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

  const updateRow = (key: string, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.cantidad !== undefined)
          next.units = createUnits(patch.cantidad, r.units);
        return next;
      })
    );
  };

  const updateUnit = (key: string, index: number, patch: Partial<UnitRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const units = r.units.map((unit, unitIndex) =>
          unitIndex === index ? { ...unit, ...patch } : unit
        );
        return { ...r, units };
      })
    );
  };

  const getType = (row: Row) =>
    deviceTypes.find((type) => type.id === row.typeId);
  const fieldEnabled = (row: Row, field: DeviceFieldKey) =>
    Boolean(getType(row)?.fieldConfig?.[field]?.enabled);
  const fieldRequired = (row: Row, field: DeviceFieldKey) =>
    Boolean(getType(row)?.fieldConfig?.[field]?.required);

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
      SHARED_FIELDS.every(
        (field) => !fieldRequired(r, field) || Boolean(r[field].trim())
      ) &&
      UNIT_FIELDS.every(
        (field) =>
          !fieldRequired(r, field) ||
          r.units
            .slice(0, cantidad)
            .every((unit) => Boolean(unit[field].trim()))
      )
    );
  };

  const validCount = rows.filter(isRowValid).length;
  const unitTotal = rows.reduce(
    (sum, r) => sum + (Number(r.cantidad) || 0),
    0
  );

  const handleConfirm = async () => {
    const toProcess = rows.filter(isRowValid);
    const invalid = rows.filter((r) => !isRowValid(r));
    setCommitting(true);
    setProgress({ done: 0, total: toProcess.length });

    const outcomes: RowResult[] = invalid.map((r) => ({
      key: r.key,
      modelo: r.modelo || i18n.t("device:import.noModel"),
      ok: false,
      detail: i18n.t("device:import.rowIncomplete"),
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
          sistemaOp: fieldEnabled(r, "sistemaOp")
            ? r.sistemaOp.trim() || undefined
            : undefined,
          ram: fieldEnabled(r, "ram") ? r.ram.trim() || undefined : undefined,
          almacenamiento: fieldEnabled(r, "almacenamiento")
            ? r.almacenamiento.trim() || undefined
            : undefined,
          units: r.units.slice(0, cantidad).map((unit) => ({
            ...(fieldEnabled(r, "numeroSerie") && unit.numeroSerie.trim()
              ? { numeroSerie: unit.numeroSerie.trim() }
              : {}),
            ...(fieldEnabled(r, "ip") && unit.ip.trim()
              ? { ip: unit.ip.trim() }
              : {}),
            ...(fieldEnabled(r, "macAddress") && unit.macAddress.trim()
              ? { macAddress: unit.macAddress.trim() }
              : {}),
          })),
        });
        outcomes.push({
          key: r.key,
          modelo: r.modelo,
          ok: true,
          detail: `${res.total} dispositivo(s) creado(s) (${type.name})`,
        });
      } catch (e: any) {
        outcomes.push({
          key: r.key,
          modelo: r.modelo,
          ok: false,
          detail: e.message ?? "Error",
        });
      }
      setProgress({ done: i + 1, total: toProcess.length });
    }

    setResults(outcomes);
    setRows([]);
    setFile(null);
    setCommitting(false);
    setProgress(null);
  };

  return {
    navigate,
    deviceTypes,
    typesLoaded,
    file,
    parsing,
    rows,
    error,
    setError,
    warnings,
    unknownTypes,
    inputRef,
    committing,
    progress,
    results,
    handleParse,
    updateRow,
    updateUnit,
    fieldEnabled,
    fieldRequired,
    removeRow,
    isRowValid,
    validCount,
    unitTotal,
    handleConfirm,
  };
};

export type UseDeviceImport = ReturnType<typeof useDeviceImport>;