import { useCallback, useEffect, useState } from "react";
import { locationsApi, type Location, type Sublugar } from "@entities/location";

export const useLocationDetail = (id?: string, onDeleted?: () => void) => {
  const [loc, setLoc] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSublugar, setNewSublugar] = useState("");
  const [sublugarToDelete, setSublugarToDelete] = useState<Sublugar | null>(null);
  const [locToDelete, setLocToDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoc(await locationsApi.get(id));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddSublugar = async () => {
    if (!id || !newSublugar.trim()) return;
    try {
      await locationsApi.addSublugar(id, newSublugar.trim());
      setNewSublugar("");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmRemoveSublugar = async () => {
    if (!sublugarToDelete) return;
    try {
      await locationsApi.removeSublugar(sublugarToDelete.id);
      setSublugarToDelete(null);
      await load();
    } catch (e: any) {
      setError(e.message);
      setSublugarToDelete(null);
    }
  };

  const confirmDeleteLoc = async () => {
    if (!loc) return;
    setDeleting(true);
    try {
      await locationsApi.remove(loc.id);
      onDeleted?.();
    } catch (e: any) {
      setError(e.message);
      setLocToDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return {
    loc,
    error,
    setError,
    deleting,
    newSublugar,
    setNewSublugar,
    sublugarToDelete,
    setSublugarToDelete,
    locToDelete,
    setLocToDelete,
    handleAddSublugar,
    confirmRemoveSublugar,
    confirmDeleteLoc,
  };
};