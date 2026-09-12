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
  titulo: string;
  descripcion: string;
  priority: string;
}

export const useEditTicket = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation(["tickets", "common"]);
  const ticket = useSelector((s: RootState) => s.tickets.current);

  const [form, setForm] = useState<TicketEditDraft>({
    titulo: "",
    descripcion: "",
    priority: "MEDIA",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
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

  const isValid =
    form.titulo.trim().length > 0 && form.descripcion.trim().length > 0;

  const handleSave = async (): Promise<boolean> => {
    if (!isValid || !id) {
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
            titulo: form.titulo.trim(),
            descripcion: form.descripcion.trim(),
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