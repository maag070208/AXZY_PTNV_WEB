import {
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import {
  FaBoxOpen,
  FaEdit,
  FaExclamationTriangle,
  FaLock,
  FaTrash,
  FaTrashRestore,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  useDeviceDetail,
  DeviceInfoCard,
  DeviceLoteSection,
  DeviceTimeline,
  DeviceCommentBox,
} from "@features/device/device-detail";

export default function DeviceDetailPage() {
  const { t: tt } = useTranslation(["device", "common"]);
  const fx = useDeviceDetail();

  const { device, loading, navigate, toast, toastType, isAdmin, setDeleteOpen } =
    fx;

  if (loading) {
    return (
      <ITPage
        title="Dispositivo"
        backAction={() => navigate(-1)}
        icon={<FaBoxOpen size={20} />}
        breadcrumbs={[
          {
            label: tt("device:list.title"),
            onClick: () => navigate("/dispositivos"),
          },
          { label: "Detalle" },
        ]}
        loading
      >
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!device) {
    return (
      <ITPage
        title="Dispositivo"
        backAction={() => navigate(-1)}
        icon={<FaBoxOpen size={20} />}
        breadcrumbs={[
          {
            label: tt("device:list.title"),
            onClick: () => navigate("/dispositivos"),
          },
          { label: "Detalle" },
        ]}
      >
        <ITText className="text-slate-400">Dispositivo no encontrado</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={device.descripcion}
      description={`${device.marca} ${device.modelo} · ${device.controlActivos}`}
      backAction={() => navigate(-1)}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[
        {
          label: tt("device:list.title"),
          onClick: () => navigate("/dispositivos"),
        },
        { label: device.controlActivos },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() =>
              device.estado !== "ASIGNADO" &&
              navigate(`/dispositivos/${device.id}/editar`)
            }
            disabled={device.estado === "ASIGNADO"}
            title={
              device.estado === "ASIGNADO"
                ? tt("device:actions.editLocked", {
                    code: device.controlActivos,
                  })
                : undefined
            }
          >
            <ITFlex align="center" gap={1}>
              {device.estado === "ASIGNADO" ? (
                <FaLock size={12} />
              ) : (
                <FaEdit size={12} />
              )}
              <ITText className="font-bold text-[11px]">
                {device.estado === "ASIGNADO"
                  ? "Asignado"
                  : tt("common:actions.edit")}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="outlined"
            size="small"
            color="danger"
            onClick={() => setDeleteOpen(true)}
            disabled={device.estado === "ASIGNADO" && !isAdmin}
            title={
              device.estado === "ASIGNADO"
                ? isAdmin
                  ? tt("device:actions.forceDeleteWithCode", {
                      code: device.controlActivos,
                    })
                  : tt("device:actions.returnFirst", {
                      code: device.controlActivos,
                    })
                : device.estado === "BAJA"
                ? tt("device:actions.deletePermanent")
                : tt("device:actions.decommission")
            }
          >
            {device.estado === "ASIGNADO" && isAdmin ? (
              <FaExclamationTriangle size={12} />
            ) : device.estado === "BAJA" ? (
              <FaTrashRestore size={12} />
            ) : (
              <FaTrash size={12} />
            )}
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex justify="center">
        <ITStack direction="column" spacing={5} className="w-full">
          <DeviceInfoCard device={device} />
          {device.loteId && device.loteSize && device.loteSize > 1 && (
            <DeviceLoteSection
              device={device}
              loteDevices={fx.loteDevices}
              loteLoading={fx.loteLoading}
            />
          )}
          <DeviceTimeline device={device} />
          {device.estado !== "BAJA" && <DeviceCommentBox fx={fx} />}
        </ITStack>
      </ITFlex>

      {toast && (
        <ITToast
          message={toast}
          type={toastType}
          position="bottom-center"
          duration={2500}
          onClose={() => fx.setToast(null)}
        />
      )}

      <ITConfirmDialog
        isOpen={fx.deleteOpen}
        onClose={() => fx.setDeleteOpen(false)}
        onConfirm={fx.handleDeleteDevice}
        title={
          device.estado === "ASIGNADO"
            ? tt("device:deleteDialog.forceTitle")
            : device.estado === "BAJA"
            ? tt("device:deleteDialog.permanentTitle")
            : tt("device:deleteDialog.decommissionTitle")
        }
        message={
          device.estado === "ASIGNADO"
            ? tt("device:deleteDialog.forceMessage", {
                code: device.controlActivos,
              })
            : device.estado === "BAJA"
            ? tt("device:deleteDialog.permanentMessage", {
                code: device.controlActivos,
              })
            : tt("device:deleteDialog.decommissionMessage", {
                code: device.controlActivos,
              })
        }
        confirmLabel={
          device.estado === "ASIGNADO"
            ? tt("device:deleteDialog.forceConfirm")
            : device.estado === "BAJA"
            ? tt("device:actions.deletePermanent")
            : tt("device:actions.decommission")
        }
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}