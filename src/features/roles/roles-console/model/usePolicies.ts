import { useCallback, useEffect, useState } from "react";
import {
  permissionApi,
  type PolicyCreateDto,
  type PolicyListData,
  type PolicyUpdateDto,
} from "@entities/permission";
import { i18n } from "@shared/i18n";
import type { RoleResult } from "./useRolesAdmin";

const errorMessage = (err: unknown, fallback: string): string =>
  (err as { message?: string })?.message ?? fallback;

export interface PoliciesState {
  data: PolicyListData | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  reload: () => Promise<void>;
  create: (dto: PolicyCreateDto) => Promise<RoleResult>;
  update: (id: string, dto: PolicyUpdateDto) => Promise<RoleResult>;
  remove: (id: string) => Promise<RoleResult>;
}

/** Políticas ABAC y catálogo de acciones con sus campos (`GET /permissions/policies`). */
export const usePolicies = (): PoliciesState => {
  const [data, setData] = useState<PolicyListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setData(await permissionApi.getPolicies());
    } catch (err) {
      setError(errorMessage(err, i18n.t("roles:policies.loadError")));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<RoleResult> => {
      setSaving(true);
      try {
        await action();
        await reload();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: errorMessage(err, i18n.t("roles:policies.saveError")) };
      } finally {
        setSaving(false);
      }
    },
    [reload]
  );

  const create = useCallback((dto: PolicyCreateDto) => run(() => permissionApi.createPolicy(dto)), [run]);
  const update = useCallback(
    (id: string, dto: PolicyUpdateDto) => run(() => permissionApi.updatePolicy(id, dto)),
    [run]
  );
  const remove = useCallback((id: string) => run(() => permissionApi.deletePolicy(id)), [run]);

  return { data, loading, error, saving, reload, create, update, remove };
};
