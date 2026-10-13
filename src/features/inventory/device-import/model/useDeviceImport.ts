import { useCallback, useEffect, useRef, useState } from "react";
import { inventoryApi } from "@entities/inventory";
import type { DeviceImportPreview, DeviceImportResult, DeviceType } from "@entities/inventory";
import { useRequestKey } from "@shared/lib/useRequestKey";

/** Paso del asistente: subir el archivo, revisar lo que va a pasar, confirmar. */
export type DeviceImportStep = "upload" | "review" | "done";

/** Tipo elegido a mano por número de fila de Excel. */
export type TypeOverrides = Record<number, string>;

/**
 * Asistente de carga masiva de dispositivos.
 *
 * El archivo se conserva en memoria entre los dos pasos porque la confirmación
 * lo vuelve a mandar a la API: el servidor revalida el archivo real en vez de
 * confiar en lo que la pantalla revisó. Los tipos elegidos por fila viajan con
 * el archivo en ambos pasos, así lo revisado es lo que se carga. La clave de
 * idempotencia se deriva del archivo y de esas elecciones, así que un doble clic
 * en "Confirmar" no da de alta las unidades dos veces.
 */
export const useDeviceImport = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<DeviceImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DeviceImportPreview | null>(null);
  const [result, setResult] = useState<DeviceImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeOverrides, setTypeOverrides] = useState<TypeOverrides>({});
  const [types, setTypes] = useState<DeviceType[]>([]);

  useEffect(() => {
    inventoryApi
      .types()
      .then((list) => setTypes(list.filter((type) => type.active)))
      .catch(() => setTypes([]));
  }, []);

  // Una clave por archivo+contenido+elecciones revisadas: reenviar lo MISMO no
  // duplica unidades; si cambia el archivo o un tipo, es una carga distinta.
  const requestKeyOf = useRequestKey();
  const requestKey = useCallback(
    () =>
      requestKeyOf({
        name: file?.name ?? "",
        size: file?.size ?? 0,
        lastModified: file?.lastModified ?? 0,
        summary: preview?.summary ?? null,
        typeOverrides,
      }),
    [file, preview, typeOverrides, requestKeyOf]
  );

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setTypeOverrides({});
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  /** Trae la previsualización (no crea nada) con las elecciones de tipo dadas. */
  const runPreview = useCallback(
    async (target: File, overrides: TypeOverrides) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await inventoryApi.previewDeviceImport(target, overrides);
        setFile(target);
        setPreview(data);
        setStep("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPreview(null);
        setStep("upload");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /** Paso 1: sube el archivo y trae la previsualización. Un archivo nuevo empieza sin elecciones. */
  const selectFile = useCallback(
    (selected: File | null) => {
      setFile(selected);
      setPreview(null);
      setResult(null);
      setError(null);
      setTypeOverrides({});
      if (selected) void runPreview(selected, {});
    },
    [runPreview]
  );

  /**
   * Cambia (o quita, con `typeId` vacío) el tipo de una fila y recalcula la
   * previsualización. Vacío = el tipo del archivo, y si no hay, el genérico.
   */
  const setTypeOverride = useCallback(
    (row: number, typeId: string) => {
      if (!file) return;
      const next = { ...typeOverrides };
      if (typeId) next[row] = typeId;
      else delete next[row];
      setTypeOverrides(next);
      void runPreview(file, next);
    },
    [file, typeOverrides, runPreview]
  );

  /** Paso 2: confirma la carga (todo o nada, en una transacción). */
  const confirm = useCallback(async () => {
    if (!file || !preview) return;
    setConfirming(true);
    setError(null);
    try {
      const data = await inventoryApi.importDevices(file, requestKey(), typeOverrides);
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  }, [file, preview, typeOverrides, requestKey]);

  /** Descarga la plantilla Excel con los encabezados y el catálogo de tipos. */
  const downloadTemplate = useCallback(async () => {
    setError(null);
    try {
      const blob = await inventoryApi.deviceImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "plantilla-dispositivos.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  return {
    inputRef,
    step,
    file,
    preview,
    result,
    loading,
    confirming,
    error,
    setError,
    types,
    typeOverrides,
    setTypeOverride,
    selectFile,
    confirm,
    downloadTemplate,
    reset,
    /** Filas que impiden confirmar: mientras haya errores, no se carga nada. */
    hasErrors: (preview?.summary.invalid ?? 0) > 0,
  };
};

export type UseDeviceImport = ReturnType<typeof useDeviceImport>;
