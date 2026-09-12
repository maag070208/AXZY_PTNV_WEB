import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { locationsApi, type Location } from "@entities/location";
import { deviceApi as devicesApi, type Device } from "@entities/device";

export const useLocations = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locToDelete, setLocToDelete] = useState<Location | null>(null);
  const [form, setForm] = useState({
    lugar: "",
    subLugar: "",
    numero: "",
    descripcion: "",
  });
  const [saving, setSaving] = useState(false);

  const [showDevicesDialog, setShowDevicesDialog] = useState(false);
  const [devicesLocation, setDevicesLocation] = useState<Location | null>(null);
  const [locationDevices, setLocationDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await locationsApi.list();
      setLocations(data);
      setTotal(data.length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const fetchTableData = useCallback(
    async (_params: ITDataTableFetchParams) => {
      return {
        data: locations as unknown as Record<string, unknown>[],
        total,
      };
    },
    [locations, total]
  );

  const handleSave = async () => {
    if (!form.lugar && !form.subLugar && !form.numero) {
      setToast({ message: t("messages.completeAtLeastOne"), type: "error" });
      return;
    }
    setSaving(true);
    try {
      if (editingLoc) {
        await locationsApi.update(editingLoc.id, form);
        setToast({ message: t("messages.updated"), type: "success" });
      } else {
        await locationsApi.create(form);
        setToast({ message: t("messages.created"), type: "success" });
      }
      setShowForm(false);
      setEditingLoc(null);
      setForm({ lugar: "", subLugar: "", numero: "", descripcion: "" });
      fetchLocations();
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorSaving"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!locToDelete) return;
    try {
      await locationsApi.remove(locToDelete.id);
      setLocToDelete(null);
      setToast({ message: t("messages.deleted"), type: "success" });
      fetchLocations();
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorDeleting"), type: "error" });
    }
  };

  const openEdit = (loc: Location) => {
    setEditingLoc(loc);
    setForm({
      lugar: loc.lugar ?? "",
      subLugar: loc.subLugar ?? "",
      numero: loc.numero ?? "",
      descripcion: loc.descripcion ?? "",
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingLoc(null);
    setForm({ lugar: "", subLugar: "", numero: "", descripcion: "" });
    setShowForm(true);
  };

  const openDevicesDialog = async (loc: Location) => {
    setDevicesLocation(loc);
    setShowDevicesDialog(true);
    setLoadingDevices(true);
    try {
      const res = await devicesApi.list({});
      const filtered = res.data.filter((d) => d.locationId === loc.id);
      setLocationDevices(filtered);
    } catch {
      setLocationDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  return {
    navigate,
    t,
    isAdmin,
    locations,
    loading,
    error,
    setError,
    toast,
    setToast,
    total,
    showForm,
    setShowForm,
    editingLoc,
    setEditingLoc,
    locToDelete,
    setLocToDelete,
    form,
    setForm,
    saving,
    showDevicesDialog,
    setShowDevicesDialog,
    devicesLocation,
    setDevicesLocation,
    locationDevices,
    loadingDevices,
    fetchTableData,
    handleSave,
    handleDelete,
    openEdit,
    openNew,
    openDevicesDialog,
  };
};

export type UseLocations = ReturnType<typeof useLocations>;