import { useState } from "react";
import { deviceApi, type Device } from "@entities/device";

/**
 * Flujo completo de "dar de baja / eliminar" un dispositivo: confirmación,
 * llamada al backend (soft-delete o forzado si está ASIGNADO) y manejo de
 * error. `onDeleted` deja que quien use el hook decida qué recargar.
 */
export function useDeleteDevice(onDeleted: () => void) {
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const requestDelete = (device: Device) => setDeviceToDelete(device);
  const cancelDelete = () => setDeviceToDelete(null);

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    try {
      await deviceApi.remove(deviceToDelete.id, deviceToDelete.estado === "ASIGNADO");
      onDeleted();
    } catch (e: any) {
      setDeleteError(e.message);
    }
    setDeviceToDelete(null);
  };

  return {
    deviceToDelete,
    deleteError,
    setDeleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
