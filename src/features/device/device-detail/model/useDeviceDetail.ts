import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { deviceApi as devicesApi, type Device } from "@entities/device";

export const useDeviceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = authUser?.role === "ADMIN";

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loteDevices, setLoteDevices] = useState<Device[]>([]);
  const [loteLoading, setLoteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    devicesApi
      .get(id)
      .then(setDevice)
      .catch(() => setDevice(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!device?.loteId || !device.loteSize || device.loteSize <= 1) {
      setLoteDevices([]);
      return;
    }
    setLoteLoading(true);
    devicesApi
      .getLote(device.loteId)
      .then((res) => setLoteDevices(res.data))
      .catch(() => setLoteDevices([]))
      .finally(() => setLoteLoading(false));
  }, [device?.loteId, device?.loteSize]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDeleteDevice = async () => {
    if (!device) return;
    try {
      await devicesApi.remove(device.id, device.estado === "ASIGNADO");
      setDeleteOpen(false);
      navigate("/dispositivos");
    } catch (e: any) {
      setToastType("error");
      setToast(e.message);
      setDeleteOpen(false);
    }
  };

  const handleAddComment = async () => {
    if (!device || !commentText.trim()) return;
    setSendingComment(true);
    try {
      const entry = await devicesApi.addHistory(device.id, {
        type: "COMMENT",
        detail: commentText.trim(),
      });
      setDevice(
        (prev) =>
          prev ? { ...prev, history: [...(prev.history ?? []), entry] } : prev
      );
      setCommentText("");
      setToastType("success");
      setToast("Comentario agregado");
    } catch {
      setToastType("error");
      setToast("Error al agregar comentario");
    } finally {
      setSendingComment(false);
    }
  };

  return {
    id,
    navigate,
    device,
    loading,
    toast,
    toastType,
    setToast,
    commentText,
    setCommentText,
    sendingComment,
    deleteOpen,
    setDeleteOpen,
    loteDevices,
    loteLoading,
    isAdmin,
    handleDeleteDevice,
    handleAddComment,
  };
};

export type UseDeviceDetail = ReturnType<typeof useDeviceDetail>;