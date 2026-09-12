import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  inventoryApi,
  type DownloadInventoryPdf,
  type InventoryMovement,
} from "@entities/inventory-movement";
import { locationsApi, type Location } from "@entities/location";

interface Options {
  download: DownloadInventoryPdf;
}

export const useInventoryMovements = ({ download }: Options) => {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterStart, setFilterStart] = useState<string>("");
  const [filterEnd, setFilterEnd] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);

  const fetchMovements = useCallback(async () => {
    try {
      const data = await inventoryApi.listMovements({
        locationId: filterLocation || undefined,
        start: filterStart || undefined,
        end: filterEnd || undefined,
      });
      setMovements(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterLocation, filterStart, filterEnd]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await locationsApi.list();
      setLocations(data);
    } catch (e: any) {
      console.error("Error fetching locations", e);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      await download(movements, locations);
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
    locations,
    loading,
    error,
    setError,
    toast,
    setToast,
    downloadingPDF,
    handleDownloadPDF,
    filterLocation,
    setFilterLocation,
    setFilterStart,
    setFilterEnd,
    dateRange,
    setDateRange,
  };
};

export type UseInventoryMovements = ReturnType<typeof useInventoryMovements>;