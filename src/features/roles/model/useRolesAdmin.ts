import { useCallback, useEffect, useMemo, useState } from "react";
import {
  permisoApi,
  type CatalogoCreateDto,
  type CatalogoUpdateDto,
  type MatrizCambio,
  type PermisoCatalogo,
  type RolesAdminData,
} from "@entities/permiso";
import type { Alcance } from "@entities/user";

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { message?: string })?.message ?? fallback;

const cellKey = (rol: string, permiso: string): string => `${permiso}|${rol}`;

const toBaseline = (data: RolesAdminData): Record<string, Alcance> => {
  const base: Record<string, Alcance> = {};
  for (const celda of data.matriz) {
    base[cellKey(celda.rol, celda.permiso)] = celda.alcance;
  }
  return base;
};

export interface RolesAdminState {
  data: RolesAdminData | null;
  /** Alcance en edición por celda (`permiso|rol`). */
  draft: Record<string, Alcance>;
  /** Cambios pendientes respecto a lo persistido. */
  changes: MatrizCambio[];
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  setAlcance: (rol: string, permiso: string, alcance: Alcance) => void;
  save: () => Promise<boolean>;
  reload: () => Promise<void>;
  discard: () => void;
}

/**
 * Administración de la matriz rol → permiso → alcance. Carga
 * `GET /permisos/admin`, mantiene un borrador local de las celdas y expone el
 * diff contra lo persistido. Los permisos inactivos no se pueden conceder.
 */
export const useRolesAdmin = (): RolesAdminState => {
  const [data, setData] = useState<RolesAdminData | null>(null);
  const [baseline, setBaseline] = useState<Record<string, Alcance>>({});
  const [draft, setDraft] = useState<Record<string, Alcance>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await permisoApi.getAdmin();
      const base = toBaseline(result);
      setData(result);
      setBaseline(base);
      setDraft({ ...base });
    } catch (err) {
      setError(errorMessage(err, "Error al cargar los permisos"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setAlcance = useCallback(
    (rol: string, permiso: string, alcance: Alcance) => {
      setDraft((prev) => ({ ...prev, [cellKey(rol, permiso)]: alcance }));
    },
    []
  );

  const discard = useCallback(() => {
    setDraft({ ...baseline });
    setSaveError(null);
  }, [baseline]);

  const changes = useMemo<MatrizCambio[]>(() => {
    if (!data) return [];
    const out: MatrizCambio[] = [];
    for (const permiso of data.catalogo) {
      for (const rol of data.roles) {
        const key = cellKey(rol, permiso.clave);
        const current = draft[key] ?? "NINGUNO";
        const original = baseline[key] ?? "NINGUNO";
        if (current !== original) {
          out.push({ rol, permiso: permiso.clave, alcance: current });
        }
      }
    }
    return out;
  }, [data, draft, baseline]);

  const save = useCallback(async (): Promise<boolean> => {
    if (changes.length === 0) return false;
    setSaving(true);
    setSaveError(null);
    try {
      await permisoApi.saveMatriz(changes);
      await reload();
      return true;
    } catch (err) {
      setSaveError(errorMessage(err, "Error al guardar la matriz"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [changes, reload]);

  return {
    data,
    draft,
    changes,
    dirty: changes.length > 0,
    loading,
    saving,
    error,
    saveError,
    setAlcance,
    save,
    reload,
    discard,
  };
};

export interface CatalogoAdminState {
  list: () => Promise<PermisoCatalogo[]>;
  reloadKey: number;
  reload: () => void;
  create: (dto: CatalogoCreateDto) => Promise<PermisoCatalogo>;
  update: (clave: string, dto: CatalogoUpdateDto) => Promise<PermisoCatalogo>;
  toggleActivo: (permiso: PermisoCatalogo) => Promise<PermisoCatalogo>;
  saving: boolean;
  error: string | null;
  setError: (message: string | null) => void;
}

/**
 * Alta/edición y activación del catálogo de permisos. El listado se lee vía
 * `GET /permisos/admin` (incluye inactivos) y cada mutación recarga la tabla.
 */
export const useCatalogoPermisos = (): CatalogoAdminState => {
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(
    async (): Promise<PermisoCatalogo[]> => {
      const result = await permisoApi.getAdmin();
      return result.catalogo;
    },
    []
  );

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const run = useCallback(
    async <T>(action: () => Promise<T>, fallback: string): Promise<T> => {
      setSaving(true);
      setError(null);
      try {
        const result = await action();
        reload();
        return result;
      } catch (err) {
        setError(errorMessage(err, fallback));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload]
  );

  const create = useCallback(
    (dto: CatalogoCreateDto) =>
      run(() => permisoApi.createCatalogo(dto), "Error al crear el permiso"),
    [run]
  );

  const update = useCallback(
    (clave: string, dto: CatalogoUpdateDto) =>
      run(
        () => permisoApi.updateCatalogo(clave, dto),
        "Error al actualizar el permiso"
      ),
    [run]
  );

  const toggleActivo = useCallback(
    (permiso: PermisoCatalogo) =>
      run(
        () => permisoApi.updateCatalogo(permiso.clave, { activo: !permiso.activo }),
        "Error al cambiar el estado del permiso"
      ),
    [run]
  );

  return { list, reloadKey, reload, create, update, toggleActivo, saving, error, setError };
};
