import { useCallback, useRef, useState } from "react";
import { kitchenApi } from "@entities/kitchen";
import type { KitchenImportPreview, KitchenImportResult, KitchenImportStrategy } from "@entities/kitchen";
import { useRequestKey } from "@shared/lib/useRequestKey";

/** Paso del asistente: subir el archivo, revisar lo que va a pasar, confirmar. */
export type KitchenImportStep = "upload" | "review" | "done";

/**
 * Asistente de la carga masiva del inventario de cocina.
 *
 * El archivo se conserva entre los dos pasos porque la confirmación lo vuelve a
 * mandar a la API: el servidor revalida el archivo real en vez de confiar en lo
 * que la pantalla revisó. La clave de idempotencia se deriva del archivo y de la
 * estrategia elegida, así que un doble clic en "Confirmar" no carga dos veces.
 *
 * Cambiar la estrategia ("sumar" vs "poner esa cantidad") vuelve a pedir la
 * previsualización: lo que se revisa es lo que se ejecuta.
 */
export const useKitchenImport = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<KitchenImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState<KitchenImportStrategy>("ADD");
  const [preview, setPreview] = useState<KitchenImportPreview | null>(null);
  /**
   * Cambia con cada previsualización resuelta. La tabla del kit NO vuelve a
   * consultar cuando cambia su `fetchData`, así que este contador se le pasa como
   * `reloadTrigger`: al cambiar la estrategia, la tabla se rehace y muestra el
   * resultado de la nueva decisión.
   */
  const [previewToken, setPreviewToken] = useState(0);
  const [result, setResult] = useState<KitchenImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestKeyOf = useRequestKey();
  const requestKey = useCallback(
    () =>
      requestKeyOf({
        name: file?.name ?? "",
        size: file?.size ?? 0,
        lastModified: file?.lastModified ?? 0,
        strategy,
        summary: preview?.summary ?? null,
      }),
    [file, strategy, preview, requestKeyOf]
  );

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const preview_ = useCallback(
    async (target: File, nextStrategy: KitchenImportStrategy) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await kitchenApi.previewItemImport(target, nextStrategy);
        setFile(target);
        setPreview(data);
        setPreviewToken((n) => n + 1);
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

  /** Paso 1: sube el archivo y trae la previsualización (no escribe nada). */
  const selectFile = useCallback(
    (selected: File | null) => {
      setFile(selected);
      setPreview(null);
      setResult(null);
      setError(null);
      if (selected) void preview_(selected, strategy);
    },
    [preview_, strategy]
  );

  /** Cambiar de estrategia re-resuelve el archivo con la nueva decisión. */
  const selectStrategy = useCallback(
    (next: KitchenImportStrategy) => {
      setStrategy(next);
      if (file) void preview_(file, next);
    },
    [file, preview_]
  );

  /** Paso 2: confirma la carga (todo o nada, en una transacción). */
  const confirm = useCallback(async () => {
    if (!file || !preview) return;
    setConfirming(true);
    setError(null);
    try {
      const data = await kitchenApi.importItems(file, strategy, requestKey());
      setResult(data);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(false);
    }
  }, [file, preview, strategy, requestKey]);

  /** Descarga la plantilla Excel con los encabezados y los catálogos vigentes. */
  const downloadTemplate = useCallback(async () => {
    setError(null);
    try {
      const blob = await kitchenApi.itemImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "plantilla-inventario-cocina.xlsx";
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
    strategy,
    preview,
    previewToken,
    result,
    loading,
    confirming,
    error,
    setError,
    selectFile,
    selectStrategy,
    confirm,
    downloadTemplate,
    reset,
    /** Filas que impiden confirmar: mientras haya errores, no se carga nada. */
    hasErrors: (preview?.summary.invalid ?? 0) > 0,
    /** Filas que ya existen y por lo tanto dependen de la estrategia elegida. */
    hasExisting: (preview?.summary.existingItems ?? 0) > 0,
  };
};

export type UseKitchenImport = ReturnType<typeof useKitchenImport>;
