import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import type { RootState } from "@app/store";
import {
  checadorApi,
  type ChecadorEmpleado,
  type ChecadorEmpleadoEstado,
  type ChecadorEmpleadosSummary,
} from "@entities/checador";
import { usersApi, type User } from "@entities/user";

/**
 * Empleados del reloj y su vínculo con los usuarios del sistema: tabla
 * server-side, aceptar sugerencias, vincular/cambiar con selector de usuario,
 * desvincular y vincular de un jalón las sugerencias seguras.
 */
export const useChecadorEmpleados = () => {
  const { t } = useTranslation(["checador", "common"]);
  const role = useSelector((s: RootState) => s.auth.user?.role);
  // Mismos roles que PUT/DELETE /checador/empleados en la API.
  const canLink = role === "ADMIN" || role === "RECURSOS_HUMANOS";

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<ChecadorEmpleadoEstado | "">("");
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<ChecadorEmpleadosSummary | null>(null);

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [target, setTarget] = useState<ChecadorEmpleado | null>(null);
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Usuarios activos (cualquier rol) para el selector; solo si puede vincular.
  useEffect(() => {
    if (!canLink) return undefined;
    let active = true;
    usersApi
      .empleados()
      .then((list) => {
        if (active) setUsuarios(list);
      })
      .catch(() => {
        if (active) setError(t("empleados.errors.usuarios"));
      });
    return () => {
      active = false;
    };
  }, [canLink, t]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    const query = q.trim();
    if (query) filters.q = query;
    if (estado) filters.estado = estado;
    return filters;
  }, [q, estado]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await checadorApi.empleados({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort: params.sort,
    });
    setSummary(res.summary);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const guardar = useCallback(
    async (row: ChecadorEmpleado, uid: string) => {
      setSaving(true);
      setError(null);
      try {
        const res = await checadorApi.vincular(row.numeroEmpleado, uid);
        setToast(
          t("empleados.toasts.vinculado", { numero: row.numeroEmpleado, nombre: res.vinculo?.name ?? "" })
        );
        setTarget(null);
        setReloadKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("empleados.errors.guardar"));
      } finally {
        setSaving(false);
      }
    },
    [t]
  );

  /** Abre el diálogo con el usuario actual, o el sugerido, ya elegido. */
  const abrirVincular = useCallback((row: ChecadorEmpleado) => {
    setTarget(row);
    setUserId(row.vinculo?.userId ?? row.sugerencia?.userId ?? "");
  }, []);

  const confirmar = () => {
    if (target && userId) void guardar(target, userId);
  };

  const aceptarSugerencia = useCallback(
    (row: ChecadorEmpleado) => {
      if (row.sugerencia) void guardar(row, row.sugerencia.userId);
    },
    [guardar]
  );

  const desvincular = useCallback(
    async (row: ChecadorEmpleado) => {
      setError(null);
      try {
        await checadorApi.desvincular(row.numeroEmpleado);
        setToast(t("empleados.toasts.desvinculado", { numero: row.numeroEmpleado }));
        setReloadKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("empleados.errors.guardar"));
      }
    },
    [t]
  );

  const vincularSugeridos = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const { vinculados } = await checadorApi.vincularSugeridos();
      setToast(t("empleados.toasts.sugeridos", { count: vinculados }));
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("empleados.errors.guardar"));
    } finally {
      setSaving(false);
    }
  }, [t]);

  return {
    t,
    canLink,
    q,
    setQ,
    estado,
    setEstado,
    externalFilters,
    fetchTableData,
    reloadKey,
    summary,
    usuarios,
    target,
    setTarget,
    userId,
    setUserId,
    saving,
    abrirVincular,
    confirmar,
    aceptarSugerencia,
    desvincular,
    vincularSugeridos,
    error,
    setError,
    toast,
    setToast,
  };
};

export type UseChecadorEmpleados = ReturnType<typeof useChecadorEmpleados>;
