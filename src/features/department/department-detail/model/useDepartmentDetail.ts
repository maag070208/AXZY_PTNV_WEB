import { useCallback, useEffect, useState } from "react";
import { departmentsApi, type Department, type DepartmentLocation, type Subarea } from "@entities/department";
import { locationsApi, type Location } from "@entities/location";

export const useDepartmentDetail = (id?: string, onDeleted?: () => void) => {
  const [dept, setDept] = useState<Department | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newSubarea, setNewSubarea] = useState("");
  const [subareaToDelete, setSubareaToDelete] = useState<Subarea | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationToDelete, setLocationToDelete] = useState<DepartmentLocation | null>(null);
  const [deptToDelete, setDeptToDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setDept(await departmentsApi.get(id));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadLocations = useCallback(() => {
    locationsApi.list().then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleAddSubarea = async () => {
    if (!id || !newSubarea.trim()) return;
    try {
      await departmentsApi.addSubarea(id, newSubarea);
      setNewSubarea("");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmRemoveSubarea = async () => {
    if (!subareaToDelete) return;
    try {
      await departmentsApi.removeSubarea(subareaToDelete.id);
      setSubareaToDelete(null);
      await load();
    } catch (e: any) {
      setError(e.message);
      setSubareaToDelete(null);
    }
  };

  const handleAddLocation = async () => {
    if (!id || !selectedLocationId) return;
    try {
      await departmentsApi.addLocation(id, selectedLocationId);
      setSelectedLocationId("");
      await Promise.all([load(), loadLocations()]);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmRemoveLocation = async () => {
    if (!id || !locationToDelete) return;
    try {
      await departmentsApi.removeLocation(id, locationToDelete.id);
      setLocationToDelete(null);
      await Promise.all([load(), loadLocations()]);
    } catch (e: any) {
      setError(e.message);
      setLocationToDelete(null);
    }
  };

  const confirmDeleteDept = async () => {
    if (!dept) return;
    setDeleting(true);
    try {
      await departmentsApi.remove(dept.id);
      onDeleted?.();
    } catch (e: any) {
      setError(e.message);
      setDeptToDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return {
    dept,
    locations,
    error,
    setError,
    deleting,
    newSubarea,
    setNewSubarea,
    subareaToDelete,
    setSubareaToDelete,
    selectedLocationId,
    setSelectedLocationId,
    locationToDelete,
    setLocationToDelete,
    deptToDelete,
    setDeptToDelete,
    handleAddSubarea,
    confirmRemoveSubarea,
    handleAddLocation,
    confirmRemoveLocation,
    confirmDeleteDept,
  };
};