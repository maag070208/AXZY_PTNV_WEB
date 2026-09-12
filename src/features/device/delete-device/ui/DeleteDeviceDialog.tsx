import { ITAlert, ITConfirmDialog } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { Device } from "@entities/device";

interface DeleteDeviceDialogProps {
  device: Device | null;
  error: string | null;
  onDismissError: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteDeviceDialog({
  device,
  error,
  onDismissError,
  onCancel,
  onConfirm,
}: DeleteDeviceDialogProps) {
  const { t } = useTranslation(["device", "common"]);

  const isAssigned = device?.estado === "ASIGNADO";
  const isDecommissioned = device?.estado === "BAJA";

  const title = isAssigned
    ? t("device:deleteDialog.forceTitle")
    : isDecommissioned
    ? t("device:deleteDialog.permanentTitle")
    : t("device:deleteDialog.decommissionTitle");

  const message = device
    ? isAssigned
      ? t("device:deleteDialog.forceMessage", { code: device.controlActivos })
      : isDecommissioned
      ? t("device:deleteDialog.permanentMessage", { code: device.controlActivos })
      : t("device:deleteDialog.decommissionMessage", { code: device.controlActivos })
    : "";

  const confirmLabel = isAssigned
    ? t("device:deleteDialog.forceConfirm")
    : isDecommissioned
    ? t("device:deleteDialog.permanentTitle")
    : t("device:deleteDialog.decommissionTitle");

  return (
    <>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={onDismissError}>
          {error}
        </ITAlert>
      )}
      <ITConfirmDialog
        isOpen={!!device}
        onClose={onCancel}
        onConfirm={onConfirm}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={t("common:actions.cancel")}
        variant="danger"
      />
    </>
  );
}
