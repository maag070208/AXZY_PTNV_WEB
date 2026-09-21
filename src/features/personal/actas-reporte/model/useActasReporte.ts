import { useCallback, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { personalApi } from "@entities/personal";
import type { User } from "@entities/user";
import { usersApi } from "@entities/user";

export const useActasReporte = () => {
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const reload = () => setReloadKey((k) => k + 1);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await personalApi.actas({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort: params.sort,
    });
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const createActa = async (input: {
    userId: string;
    motivo: string;
    fechaIncidente: string;
    descripcion: string;
    sancion?: string;
  }) => {
    setSaving(true);
    try {
      await personalApi.crearActa({
        userId: input.userId,
        motivo: input.motivo as never,
        fechaIncidente: input.fechaIncidente,
        descripcion: input.descripcion,
        sancion: input.sancion,
      });
      setShowForm(false);
      reload();
      return null;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el acta administrativa"
      );
      return err instanceof Error ? err.message : "No se pudo guardar el acta administrativa";
    } finally {
      setSaving(false);
    }
  };

  const deleteActa = async (id: string) => {
    try {
      await personalApi.eliminarActa(id);
      reload();
      return null;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el acta administrativa";
      setError(message);
      return message;
    }
  };

  return {
    error,
    setError,
    reloadKey,
    reload,
    saving,
    showForm,
    setShowForm,
    fetchTableData,
    createActa,
    deleteActa,
  };
};

export const searchEmpleados = async (query?: string): Promise<User[]> => {
  try {
    return await usersApi.empleados(undefined, query || undefined);
  } catch {
    return [];
  }
};