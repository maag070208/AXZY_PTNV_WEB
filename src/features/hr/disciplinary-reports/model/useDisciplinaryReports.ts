import { useCallback, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { personalApi } from "@entities/hr";
import type { User } from "@entities/user";
import { usersApi } from "@entities/user";
import { i18n } from "@shared/i18n";

export const useDisciplinaryReports = () => {
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const reload = () => setReloadKey((k) => k + 1);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await personalApi.disciplinaryReports({
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

  const createDisciplinaryReport = async (input: {
    userId: string;
    reason: string;
    incidentDate: string;
    description: string;
    sanction?: string;
  }) => {
    setSaving(true);
    try {
      await personalApi.createDisciplinaryReport({
        userId: input.userId,
        reason: input.reason as never,
        incidentDate: input.incidentDate,
        description: input.description,
        sanction: input.sanction,
      });
      setShowForm(false);
      reload();
      return null;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : i18n.t("employees:disciplinary.saveError")
      );
      return err instanceof Error ? err.message : i18n.t("employees:disciplinary.saveError");
    } finally {
      setSaving(false);
    }
  };

  const deleteDisciplinaryReport = async (id: string) => {
    try {
      await personalApi.deleteDisciplinaryReport(id);
      reload();
      return null;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : i18n.t("employees:disciplinary.deleteError");
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
    createDisciplinaryReport,
    deleteDisciplinaryReport,
  };
};

export const searchEmployees = async (query?: string): Promise<User[]> => {
  try {
    return await usersApi.employees(undefined, query || undefined);
  } catch {
    return [];
  }
};