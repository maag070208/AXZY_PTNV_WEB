import { useCallback, useState } from "react";
import type { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { locationsApi, type Location } from "@entities/location";

export const useLocationsCrud = () => {
  const [newForm, setNewForm] = useState({ lugar: "", descripcion: "" });
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [locToDelete, setLocToDelete] = useState<Location | null>(null);
  const [locToEdit, setLocToEdit] = useState<Location | null>(null);
  const [editForm, setEditForm] = useState({ lugar: "", descripcion: "" });

  const reload = () => setReloadKey((k) => k + 1);

  const handleCreate = async () => {
    const lugar = newForm.lugar.trim();
    if (!lugar) return;
    try {
      await locationsApi.create({ lugar, descripcion: newForm.descripcion.trim() || undefined });
      setNewForm({ lugar: "", descripcion: "" });
      setCreateOpen(false);
      reload();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openEdit = (loc: Location) => {
    setLocToEdit(loc);
    setEditForm({ lugar: loc.lugar, descripcion: loc.descripcion ?? "" });
  };

  const handleUpdate = async () => {
    const lugar = editForm.lugar.trim();
    if (!locToEdit || !lugar) return;
    try {
      await locationsApi.update(locToEdit.id, {
        lugar,
        descripcion: editForm.descripcion.trim() || undefined,
      });
      setLocToEdit(null);
      reload();
    } catch (e: any) {
      setError(e.message);
      setLocToEdit(null);
    }
  };

  const confirmDelete = async () => {
    if (!locToDelete) return;
    try {
      await locationsApi.remove(locToDelete.id);
      reload();
    } catch (e: any) {
      setError(e.message);
    }
    setLocToDelete(null);
  };

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await locationsApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  return {
    newForm,
    setNewForm,
    error,
    setError,
    createOpen,
    setCreateOpen,
    reloadKey,
    locToDelete,
    setLocToDelete,
    locToEdit,
    setLocToEdit,
    editForm,
    setEditForm,
    handleCreate,
    openEdit,
    handleUpdate,
    confirmDelete,
    fetchTableData,
  };
};