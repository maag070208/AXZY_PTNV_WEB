import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deviceTypeApi as deviceTypesApi } from "@entities/device-type";
import { emptyFieldConfig, normalizeFieldConfig } from "./constants";

export interface DeviceTypeForm {
  code: string;
  name: string;
  prefix: string;
  fieldConfig: ReturnType<typeof emptyFieldConfig>;
}

export const useDeviceTypeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<DeviceTypeForm>({
    code: "",
    name: "",
    prefix: "",
    fieldConfig: emptyFieldConfig(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (isEdit && id) {
      deviceTypesApi
        .get(id)
        .then((d) => {
          setForm({
            code: d.code,
            name: d.name,
            prefix: d.prefix,
            fieldConfig: normalizeFieldConfig(d.fieldConfig),
          });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.prefix) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await deviceTypesApi.update(id, {
          name: form.name,
          fieldConfig: form.fieldConfig,
        });
      } else {
        await deviceTypesApi.create(form);
      }
      navigate("/dispositivos/tipos");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    id,
    navigate,
    isEdit,
    form,
    setForm,
    loading,
    saving,
    error,
    setError,
    handleSubmit,
  };
};

export type UseDeviceTypeForm = ReturnType<typeof useDeviceTypeForm>;