import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import type { AppDispatch } from "@app/store";
import { createTicketThunk, ticketsApi } from "@entities/ticket";

export interface TicketDraft {
  titulo: string;
  descripcion: string;
  priority: string;
  category: string;
}

export const useCreateTicket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation(["tickets", "common"]);

  const [form, setForm] = useState<TicketDraft>({
    titulo: "",
    descripcion: "",
    priority: "MEDIA",
    category: "OTRO",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleField = (field: keyof TicketDraft, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const addFile = (file: File) => setFiles((cur) => [...cur, file]);

  const removeFile = (index: number) =>
    setFiles((cur) => cur.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
    else if (form.titulo.trim().length < 3) e.titulo = "El título debe tener al menos 3 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = form.titulo.trim().length >= 3;

  const handleSave = async (): Promise<boolean> => {
    if (!validate()) {
      setToastType("error");
      setToast(t("new.required"));
      return false;
    }
    setSaving(true);
    try {
      const action = await dispatch(
        createTicketThunk({
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          priority: form.priority,
          category: form.category,
        })
      );
      if (createTicketThunk.fulfilled.match(action)) {
        const ticket = action.payload;
        for (const file of files) {
          await ticketsApi.uploadAttachment(ticket.id, file, "FOTO");
        }
        setToastType("success");
        setToast(t("new.created"));
        return true;
      }
      setToastType("error");
      setToast(t("new.createError"));
      return false;
    } catch {
      setToastType("error");
      setToast(t("new.createError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    errors,
    handleField,
    isValid,
    saving,
    files,
    addFile,
    removeFile,
    toast,
    toastType,
    dismissToast: () => setToast(null),
    handleSave,
  };
};