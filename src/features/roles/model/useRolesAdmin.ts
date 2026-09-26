import { useCallback, useEffect, useMemo, useState } from "react";
import {
  permissionApi,
  type CatalogCreateDto,
  type CatalogUpdateDto,
  type MatrixChange,
  type PermissionCatalog,
  type RolesAdminData,
} from "@entities/permission";
import type { PermissionScope } from "@entities/user";
import { i18n } from "@shared/i18n";

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { message?: string })?.message ?? fallback;

const cellKey = (role: string, permission: string): string => `${permission}|${role}`;

/**
 * Alcance por defecto cuando se marca desde "no" un permiso con alcance de
 * datos. Se eligió el **mínimo útil** para no ampliar accesos sin querer: los
 * tickets/tareas arrancan en Propio y la bitácora/checador/horas extra en Área.
 * El usuario puede cambiarlo desde el modal "cambiar alcance".
 */
export const DEFAULT_SCOPE: Record<string, PermissionScope> = {
  "tickets.view": "OWN",
  "tickets.edit": "OWN",
  "tickets.close": "OWN",
  "tasks.view": "OWN",
  "tasks.assign": "OWN",
  "tasks.complete": "OWN",
  "access.log": "AREA",
  "time_clock.view": "AREA",
  "overtime.view": "AREA",
  "overtime.approve": "AREA",
  "users.permissions": "AREA",
};

/** Permiso con alcance de datos (admite Propio/Área además de Todo). */
export const isScopedPermission = (permission: PermissionCatalog): boolean =>
  permission.scopes.some((scope) => scope === "OWN" || scope === "AREA");

/** Alcance que se aplica al marcar un permiso desde "no". */
export const defaultScopeFor = (
  permission: string,
  catalog: readonly PermissionCatalog[]
): PermissionScope => {
  const definition = catalog.find((item) => item.key === permission);
  const predefined = DEFAULT_SCOPE[permission];
  if (predefined && (!definition || definition.scopes.includes(predefined))) {
    return predefined;
  }
  if (!definition) return predefined ?? "ALL";
  if (definition.scopes.includes("ALL")) return "ALL";
  return definition.scopes[0] ?? "NONE";
};

const toBaseline = (data: RolesAdminData): Record<string, PermissionScope> => {
  const base: Record<string, PermissionScope> = {};
  for (const cell of data.matrix) {
    base[cellKey(cell.role, cell.permission)] = cell.scope;
  }
  return base;
};

export interface RolesAdminState {
  data: RolesAdminData | null;
  /** Alcance en edición por celda (`permiso|rol`). */
  draft: Record<string, PermissionScope>;
  /** Permisos en edición agrupados por rol (solo los ≠ NONE). */
  permissionsByRole: Record<string, Partial<Record<string, PermissionScope>>>;
  /** Cambios pendientes respecto a lo persistido. */
  changes: MatrixChange[];
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveError: string | null;
  setScope: (role: string, permission: string, scope: PermissionScope) => void;
  /** Marca/desmarca una celda (sí/no). Al marcar aplica el alcance por defecto. */
  toggle: (role: string, permission: string) => void;
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
  const [baseline, setBaseline] = useState<Record<string, PermissionScope>>({});
  const [draft, setDraft] = useState<Record<string, PermissionScope>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await permissionApi.getAdmin();
      const base = toBaseline(result);
      setData(result);
      setBaseline(base);
      setDraft({ ...base });
    } catch (err) {
      setError(errorMessage(err, i18n.t("roles:errors.load")));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setScope = useCallback(
    (role: string, permission: string, scope: PermissionScope) => {
      setDraft((prev) => ({ ...prev, [cellKey(role, permission)]: scope }));
    },
    []
  );

  const toggle = useCallback(
    (role: string, permission: string) => {
      setDraft((prev) => {
        const key = cellKey(role, permission);
        const current = prev[key] ?? "NONE";
        const next =
          current === "NONE"
            ? defaultScopeFor(permission, data?.catalog ?? [])
            : "NONE";
        return { ...prev, [key]: next };
      });
    },
    [data]
  );

  /** Mapa rol → { permiso: alcance } con los permisos ≠ NONE del borrador. */
  const permissionsByRole = useMemo<
    Record<string, Partial<Record<string, PermissionScope>>>
  >(() => {
    if (!data) return {};
    const map: Record<string, Partial<Record<string, PermissionScope>>> = {};
    for (const role of data.roles) map[role] = {};
    for (const permission of data.catalog) {
      for (const role of data.roles) {
        const scope = draft[cellKey(role, permission.key)] ?? "NONE";
        if (scope !== "NONE") map[role][permission.key] = scope;
      }
    }
    return map;
  }, [data, draft]);

  const discard = useCallback(() => {
    setDraft({ ...baseline });
    setSaveError(null);
  }, [baseline]);

  const changes = useMemo<MatrixChange[]>(() => {
    if (!data) return [];
    const out: MatrixChange[] = [];
    for (const permission of data.catalog) {
      for (const role of data.roles) {
        const key = cellKey(role, permission.key);
        const current = draft[key] ?? "NONE";
        const original = baseline[key] ?? "NONE";
        if (current !== original) {
          out.push({ role, permission: permission.key, scope: current });
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
      await permissionApi.saveMatrix(changes);
      await reload();
      return true;
    } catch (err) {
      setSaveError(errorMessage(err, i18n.t("roles:errors.saveMatrix")));
      return false;
    } finally {
      setSaving(false);
    }
  }, [changes, reload]);

  return {
    data,
    draft,
    permissionsByRole,
    changes,
    dirty: changes.length > 0,
    loading,
    saving,
    error,
    saveError,
    setScope,
    toggle,
    save,
    reload,
    discard,
  };
};

export interface CatalogAdminState {
  list: () => Promise<PermissionCatalog[]>;
  reloadKey: number;
  reload: () => void;
  create: (dto: CatalogCreateDto) => Promise<PermissionCatalog>;
  update: (key: string, dto: CatalogUpdateDto) => Promise<PermissionCatalog>;
  toggleActive: (permission: PermissionCatalog) => Promise<PermissionCatalog>;
  saving: boolean;
  error: string | null;
  setError: (message: string | null) => void;
}

/**
 * Alta/edición y activación del catálogo de permisos. El listado se lee vía
 * `GET /permisos/admin` (incluye inactivos) y cada mutación recarga la tabla.
 */
export const usePermissionCatalog = (): CatalogAdminState => {
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(
    async (): Promise<PermissionCatalog[]> => {
      const result = await permissionApi.getAdmin();
      return result.catalog;
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
    (dto: CatalogCreateDto) =>
      run(() => permissionApi.createCatalog(dto), i18n.t("roles:errors.create")),
    [run]
  );

  const update = useCallback(
    (key: string, dto: CatalogUpdateDto) =>
      run(
        () => permissionApi.updateCatalog(key, dto),
        i18n.t("roles:errors.update")
      ),
    [run]
  );

  const toggleActive = useCallback(
    (permission: PermissionCatalog) =>
      run(
        () => permissionApi.updateCatalog(permission.key, { active: !permission.active }),
        i18n.t("roles:errors.toggle")
      ),
    [run]
  );

  return { list, reloadKey, reload, create, update, toggleActive, saving, error, setError };
};
