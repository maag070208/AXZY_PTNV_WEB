import { useCallback, useEffect, useState } from "react";
import { departmentsApi, type Department, type Subarea } from "@entities/department";

export const useDepartmentDetail = (id?: string, onDeleted?: () => void) => {
  const [dept, setDept] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSubarea, setNewSubarea] = useState("");
  const [subareaToDelete, setSubareaToDelete] = useState<Subarea | null>(null);
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
    error,
    setError,
    deleting,
    newSubarea,
    setNewSubarea,
    subareaToDelete,
    setSubareaToDelete,
    deptToDelete,
    setDeptToDelete,
    handleAddSubarea,
    confirmRemoveSubarea,
    confirmDeleteDept,
  };
};