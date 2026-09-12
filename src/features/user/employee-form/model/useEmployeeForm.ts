import { useEffect, useState } from "react";
import { usersApi } from "@entities/user";
import { departmentsApi, type Department } from "@entities/department";

export interface EmployeeFormValues {
  name: string;
  numeroEmpleado: string;
  puesto: string;
  departmentId: string;
  subareaId: string;
}

export const useEmployeeForm = (id?: string) => {
  const isEdit = Boolean(id);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<EmployeeFormValues>({
    name: "",
    numeroEmpleado: "",
    puesto: "",
    departmentId: "",
    subareaId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    departmentsApi
      .list(true)
      .then((d) => {
        setDepartments(d);
        return isEdit && id ? usersApi.get(id) : null;
      })
      .then((u) => {
        if (u) {
          setForm({
            name: u.name,
            numeroEmpleado: u.numeroEmpleado ?? "",
            puesto: u.puesto ?? "",
            departmentId: u.departmentId ?? "",
            subareaId: "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const selectedDept = departments.find((d) => d.id === form.departmentId);

  const handleField = (field: keyof EmployeeFormValues, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setForm((f) => ({ ...f, departmentId: value, subareaId: "" }));
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!form.name || !id) return false;
    setSaving(true);
    try {
      await usersApi.update(id, {
        name: form.name,
        numeroEmpleado: form.numeroEmpleado || undefined,
        puesto: form.puesto || undefined,
        departmentId: form.departmentId || null,
        subareaId: form.subareaId || null,
      });
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!form.name;

  return {
    isEdit,
    departments,
    form,
    handleField,
    handleDepartmentChange,
    selectedDept,
    loading,
    saving,
    error,
    setError,
    handleSubmit,
    canSubmit,
  };
};