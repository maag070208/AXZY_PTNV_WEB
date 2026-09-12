import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaFileExcel, FaPlus, FaTag } from "react-icons/fa";
import type { RootState } from "@core/store/store";
import { useIsMobile } from "@core/hooks/useIsMobile";
import { useDeviceSummary } from "@entities/device";
import { useDeviceTypes } from "@entities/device-type";
import { useDeviceFilters } from "@features/device/filter-devices/model/useDeviceFilters";
import DeviceFiltersBar from "@features/device/filter-devices/ui/DeviceFiltersBar";
import { useDeleteDevice } from "@features/device/delete-device/model/useDeleteDevice";
import DeleteDeviceDialog from "@features/device/delete-device/ui/DeleteDeviceDialog";
import DeviceSummaryCards from "@widgets/device-summary-cards/ui/DeviceSummaryCards";
import DevicesTable from "@widgets/devices-table/ui/DevicesTable";

/**
 * Orquesta la vista de lista de dispositivos: compone entities + features +
 * widgets. No conoce fetch, ni columnas de tabla, ni el flujo de borrado —
 * solo arma el layout y conecta el estado de arriba hacia abajo.
 *
 * Antes: 475 líneas mezclando fetch, columnas, tarjetas de resumen y el
 * diálogo de borrado en un solo archivo.
 */
export default function DevicesListPage() {
  const { t } = useTranslation(["device", "common"]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = authUser?.role === "ADMIN";

  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const { types } = useDeviceTypes();
  const { summary } = useDeviceSummary();
  const filters = useDeviceFilters();
  const deleteDevice = useDeleteDevice(() => setReloadKey((k) => k + 1));

  return (
    <ITPage
      title={t("device:list.title")}
      description={t("device:list.description", { total, typeCount: types.length })}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("device:list.title") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/dispositivos/tipos")}>
            <ITFlex align="center" gap={1}>
              <FaTag size={12} />
              <ITText className="font-bold text-[11px]">{t("device:list.typesButton")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" color="secondary" onClick={() => navigate("/dispositivos/importar")}>
            <ITFlex align="center" gap={1}>
              <FaFileExcel size={12} />
              <ITText className="font-bold text-[11px]">{t("device:list.importButton")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/dispositivos/nuevo")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("common:actions.new")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
      error={null}
      icon={<FaBoxOpen size={20} />}
    >
      <DeviceSummaryCards summary={summary} onToggleEstado={filters.toggleEstado} />

      <DeviceFiltersBar
        types={types}
        filterType={filters.filterType}
        onFilterTypeChange={filters.setFilterType}
        filterEstado={filters.filterEstado}
        onFilterEstadoChange={filters.setFilterEstado}
        search={filters.search}
        onSearchChange={filters.setSearch}
      />

      <DevicesTable
        isAdmin={isAdmin}
        isMobile={isMobile}
        externalFilters={filters.externalFilters}
        reloadTrigger={reloadKey}
        onTotalChange={setTotal}
        onDeleteRequest={deleteDevice.requestDelete}
      />

      <DeleteDeviceDialog
        device={deleteDevice.deviceToDelete}
        error={deleteDevice.deleteError}
        onDismissError={() => deleteDevice.setDeleteError(null)}
        onCancel={deleteDevice.cancelDelete}
        onConfirm={deleteDevice.confirmDelete}
      />
    </ITPage>
  );
}
