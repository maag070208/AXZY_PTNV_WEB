import { useCallback, useEffect, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { personalApi } from "@entities/hr";
import {
  departmentsApi,
  type Department,
} from "@entities/department";

export const useEmployeesList = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    departmentsApi.list(true).then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await personalApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      setTotal(res.total);
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  return {
    departments,
    total,
    error,
    setError,
    reloadKey,
    reload,
    fetchTableData,
  };
};