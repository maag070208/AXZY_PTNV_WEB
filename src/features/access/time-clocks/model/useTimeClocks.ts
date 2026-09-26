import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  checadorApi,
  type ChecadorDispositivo,
  type ChecadorRelojConfig,
  type ChecadorStatus,
} from "@entities/checador";

/** Refresco del estado mientras algún reloj sincroniza. */
const STATUS_POLL_MS = 5_000;

/** Configuración de un reloj leída en vivo: cargando, leída o con error. */
export interface ConfigDeReloj {
  cargando: boolean;
  data: ChecadorRelojConfig | null;
  error: string | null;
}

const mensajeDe = (e: unknown, fallback: string): string => (e instanceof Error ? e.message : fallback);

/**
 * Relojes dados de alta: su sincronización (se refresca sola mientras alguno
 * corre), su configuración leída en vivo, el alta, la edición (nombre y si
 * cuenta para entradas/salidas) y la baja. Del reloj solo se LEE: nada de esto
 * lo modifica, solo cambia cómo el sistema se conecta y usa sus checadas.
 */
export const useChecadorRelojes = () => {
  const { t } = useTranslation(["checador", "common"]);

  const [status, setStatus] = useState<ChecadorStatus | null>(null);
  const [configs, setConfigs] = useState<Record<string, ConfigDeReloj>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Alta
  const [altaAbierta, setAltaAbierta] = useState(false);
  const [url, setUrl] = useState("");
  const [nombre, setNombre] = useState("");
  const [asistencia, setAsistencia] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [altaError, setAltaError] = useState<string | null>(null);

  // Edición (solo el registro del sistema)
  const [editTarget, setEditTarget] = useState<ChecadorDispositivo | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editAsistencia, setEditAsistencia] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Baja
  const [bajaTarget, setBajaTarget] = useState<ChecadorDispositivo | null>(null);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await checadorApi.status());
    } catch (e) {
      setError(mensajeDe(e, t("relojes.errors.status")));
    }
  }, [t]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const sincronizando = status?.enCurso != null;
  useEffect(() => {
    if (!sincronizando) return undefined;
    const timer = window.setTimeout(() => void loadStatus(), STATUS_POLL_MS);
    return () => window.clearTimeout(timer);
  }, [sincronizando, status, loadStatus]);

  const cargarConfig = useCallback(
    async (serie: string) => {
      setConfigs((c) => ({ ...c, [serie]: { cargando: true, data: c[serie]?.data ?? null, error: null } }));
      try {
        const data = await checadorApi.configuracionReloj(serie);
        setConfigs((c) => ({ ...c, [serie]: { cargando: false, data, error: null } }));
      } catch (e) {
        setConfigs((c) => ({
          ...c,
          [serie]: { cargando: false, data: null, error: mensajeDe(e, t("relojes.errors.config")) },
        }));
      }
    },
    [t]
  );

  // La configuración de cada reloj se lee una vez, al aparecer en la lista.
  const series = useMemo(
    () => (status?.dispositivos ?? []).map((d) => d.dispositivoSerie).join("|"),
    [status?.dispositivos]
  );
  const pedidas = useRef(new Set<string>());
  useEffect(() => {
    for (const serie of series ? series.split("|") : []) {
      if (pedidas.current.has(serie)) continue;
      pedidas.current.add(serie);
      void cargarConfig(serie);
    }
  }, [series, cargarConfig]);

  const abrirAlta = () => {
    setUrl("");
    setNombre("");
    setAsistencia(true);
    setAltaError(null);
    setAltaAbierta(true);
  };

  const registrar = async () => {
    setConectando(true);
    setAltaError(null);
    try {
      const reloj = await checadorApi.registrarReloj({
        url: url.trim(),
        nombre: nombre.trim() || undefined,
        asistencia,
      });
      setAltaAbierta(false);
      setToast(t("relojes.toasts.alta", { nombre: reloj.nombre }));
      await loadStatus();
    } catch (e) {
      setAltaError(mensajeDe(e, t("relojes.errors.alta")));
    } finally {
      setConectando(false);
    }
  };

  const abrirEdicion = (reloj: ChecadorDispositivo) => {
    setEditNombre(reloj.nombre);
    setEditAsistencia(reloj.asistencia);
    setEditError(null);
    setEditTarget(reloj);
  };

  const guardarEdicion = async () => {
    if (!editTarget) return;
    setGuardando(true);
    setEditError(null);
    try {
      const reloj = await checadorApi.actualizarReloj(editTarget.dispositivoSerie, {
        nombre: editNombre.trim(),
        asistencia: editAsistencia,
      });
      setEditTarget(null);
      setToast(t("relojes.toasts.editado", { nombre: reloj.nombre }));
      await loadStatus();
    } catch (e) {
      setEditError(mensajeDe(e, t("relojes.errors.editar")));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBaja = async () => {
    if (!bajaTarget) return;
    const { dispositivoSerie: serie, nombre: nombreReloj } = bajaTarget;
    setDandoDeBaja(true);
    try {
      await checadorApi.darDeBajaReloj(serie);
      setBajaTarget(null);
      setToast(t("relojes.toasts.baja", { nombre: nombreReloj }));
      // Si se vuelve a dar de alta, su configuración se lee de nuevo.
      pedidas.current.delete(serie);
      setConfigs((c) => {
        const resto = { ...c };
        delete resto[serie];
        return resto;
      });
      await loadStatus();
    } catch (e) {
      setBajaTarget(null);
      setError(mensajeDe(e, t("relojes.errors.baja")));
    } finally {
      setDandoDeBaja(false);
    }
  };

  return {
    t,
    status,
    configs,
    cargarConfig,
    altaAbierta,
    setAltaAbierta,
    abrirAlta,
    url,
    setUrl,
    nombre,
    setNombre,
    asistencia,
    setAsistencia,
    conectando,
    altaError,
    registrar,
    editTarget,
    setEditTarget,
    abrirEdicion,
    editNombre,
    setEditNombre,
    editAsistencia,
    setEditAsistencia,
    guardando,
    editError,
    guardarEdicion,
    bajaTarget,
    setBajaTarget,
    dandoDeBaja,
    confirmarBaja,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseChecadorRelojes = ReturnType<typeof useChecadorRelojes>;
