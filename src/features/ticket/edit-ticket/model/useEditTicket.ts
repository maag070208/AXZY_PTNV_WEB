import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { AppDispatch, RootState } from "@app/store";
import {
  clearCurrent,
  fetchTicketById,
  updateTicketThunk,
} from "@entities/ticket";

export interface TicketEditDraft {
  title: string;
  description: string;
  priority: string;
}

export const useEditTicket = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation(["tickets", "common"]);
  const ticket = useSelector((s: RootState) => s.tickets.current);

  const [form, setForm] = useState<TicketEditDraft>({
    title: "",
    description: "",
    priority: "MEDIUM",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!id) return;
    dispatch(fetchTicketById(id)).finally(() => setLoading(false));
    return () => {
      dispatch(clearCurrent());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (ticket) {
      setForm({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
      });
    }
  }, [ticket]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleField = (field: keyof TicketEditDraft, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "El título es obligatorio";
    else if (form.title.trim().length < 3) e.title = "El título debe tener al menos 3 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = form.title.trim().length >= 3;

  const handleSave = async (): Promise<boolean> => {
    if (!validate() || !id) {
      setToastType("error");
      setToast(t("edit.required"));
      return false;
    }
    setSaving(true);
    try {
      const action = await dispatch(
        updateTicketThunk({
          id,
          data: {
            title: form.title.trim(),
            description: form.description.trim(),
            priority: form.priority,
          },
        })
      );
      if (updateTicketThunk.fulfilled.match(action)) {
        setToastType("success");
        setToast(t("edit.updated"));
        return true;
      }
      setToastType("error");
      setToast(t("edit.updateError"));
      return false;
    } catch {
      setToastType("error");
      setToast(t("edit.updateError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    id,
    ticket,
    form,
    errors,
    handleField,
    isValid,
    saving,
    loading,
    toast,
    toastType,
    dismissToast: () => setToast(null),
    handleSave,
  };
};