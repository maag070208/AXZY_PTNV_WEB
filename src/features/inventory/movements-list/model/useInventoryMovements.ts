import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  inventoryApi,
  type DownloadInventoryPdf,
  type InventoryMovement,
} from "@entities/inventory-movement";
import { departmentsApi, type Department } from "@entities/department";
import type { InventorySummary } from "@entities/inventory-movement";

interface Options {
  download: DownloadInventoryPdf;
}

export const useInventoryMovements = ({ download }: Options) => {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  const fetchMovements = useCallback(async () => {
    try {
      const data = await inventoryApi.listMovements({
        departmentId: filterDepartment || undefined,
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
      setMovements(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterDepartment, filterStart, filterEnd]);

  const fetchDepartments = useCallback(async () => {
    try {
      const data = await departmentsApi.list();
      setDepartments(data);
    } catch (e: any) {
      console.error("Error fetching departments", e);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await inventoryApi.getSummary();
      setSummary(data);
    } catch {
      // el PDF simplemente omitirá el resumen por departamento
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      await download(movements, summary?.departments ?? []);
      setToast({ message: t("messages.pdfDownloaded"), type: "success" });
    } catch {
      setToast({ message: t("messages.pdfError"), type: "error" });
    } finally {
      setDownloadingPDF(false);
    }
  };

  return {
    navigate,
    t,
    movements,
    departments,
    loading,
    error,
    setError,
    toast,
    setToast,
    downloadingPDF,
    handleDownloadPDF,
    filterDepartment,
    setFilterDepartment,
    setFilterStart,
    setFilterEnd,
    dateRange,
    setDateRange,
  };
};

export type UseInventoryMovements = ReturnType<typeof useInventoryMovements>;