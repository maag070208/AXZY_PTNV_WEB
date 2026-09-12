import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import {
  inventoryApi,
  type DownloadInventoryPdf,
  type InventorySummary,
} from "@entities/inventory-movement";
import { locationsApi, type Location } from "@entities/location";
import { deviceApi as devicesApi, type Device } from "@entities/device";

interface Options {
  download: DownloadInventoryPdf;
}

export const useInventoryIndex = ({ download }: Options) => {
  const navigate = useNavigate();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [unlocatedDevices, setUnlocatedDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, locRes, devRes] = await Promise.all([
        inventoryApi.getSummary(),
        locationsApi.list(),
        devicesApi.list({}),
      ]);
      setSummary(sumRes);
      setLocations(locRes);
      const unlocated = (devRes.data ?? []).filter(
        (d: Device) => !d.locationId
      );
      setUnlocatedDevices(unlocated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadPDF = async () => {
    if (!summary) return;
    setDownloadingPDF(true);
    try {
      const movements = await inventoryApi.listMovements();
      await download(movements, locations);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingPDF(false);
    }
  };

  return {
    navigate,
    isAdmin,
    summary,
    locations,
    unlocatedDevices,
    loading,
    downloadingPDF,
    handleDownloadPDF,
  };
};

export type UseInventoryIndex = ReturnType<typeof useInventoryIndex>;