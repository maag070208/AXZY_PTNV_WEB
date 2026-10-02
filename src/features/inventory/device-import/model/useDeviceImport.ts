import { useCallback, useRef, useState } from "react";
import { inventoryApi } from "@entities/inventory";
import type { DeviceImportPreview, DeviceImportResult } from "@entities/inventory";
import { useRequestKey } from "@shared/lib/useRequestKey";

/** Paso del asistente: subir el archivo, revisar lo que va a pasar, confirmar. */
export type DeviceImportStep = "upload" | "review" | "done";

/**
 * Asistente de carga masiva de dispositivos.
 *
 * El archivo se conserva en memoria entre los dos pasos porque la confirmación
 * lo vuelve a mandar a la API: el servidor revalida el archivo real en vez de
 * confiar en lo que la pantalla revisó. La clave de idempotencia se deriva del
 * archivo, así que un doble clic en "Confirmar" no da de alta las unidades dos
 * veces (la API devuelve el mismo movimiento y lo avisa).
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

  // Una clave por archivo+contenido revisado: reenviar el MISMO archivo (doble
  // clic, reintento tras un corte) no duplica unidades; si el archivo cambia,
  // la clave cambia y es una carga nueva.
  const requestKeyOf = useRequestKey();
  const requestKey = useCallback(
    () =>
      requestKeyOf({
        name: file?.name ?? "",
        size: file?.size ?? 0,
        lastModified: file?.lastModified ?? 0,
        summary: preview?.summary ?? null,
      }),
    [file, preview, requestKeyOf]
  );

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  /** Paso 1: sube el archivo y trae la previsualización (no crea nada). */
  const handlePreview = useCallback(
    async (selected?: File | null) => {
      const target = selected ?? file;
      if (!target) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await inventoryApi.previewDeviceImport(target);
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
    [file]
  );

  /** Paso 2: confirma la carga (todo o nada, en una transacción). */
  const confirm = useCallback(async () => {
    if (!file || !preview) return;
    setConfirming(true);
    setError(null);
    try {
      const data = await inventoryApi.importDevices(file, requestKey());
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  }, [file, preview, requestKey]);
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

  const selectFile = useCallback(
    (selected: File | null) => {
      setFile(selected);
      setPreview(null);
      setResult(null);
      setError(null);
      if (selected) void handlePreview(selected);
    },
    [handlePreview]
  );

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
    selectFile,
    confirm,
    downloadTemplate,
    reset,
    /** Filas que impiden confirmar: mientras haya errores, no se carga nada. */
    hasErrors: (preview?.summary.invalid ?? 0) > 0,
  };
};

export type UseDeviceImport = ReturnType<typeof useDeviceImport>;
