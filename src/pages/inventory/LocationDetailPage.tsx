import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITLoader,
  ITPage,
} from "@axzydev/axzy_ui_system";
import { FaMapMarkerAlt, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { LocationCartasCard, LocationDevicesCard, LocationInfoCard, LocationStatsGrid, useLocationDetail } from "@features/location/location-detail";

export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["locations", "common"]);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const detail = useLocationDetail(id, () => navigate("/inventario/ubicaciones"));

  if (!detail.loc) {
    return (
      <ITPage
        title={tt("detail.loading")}
        backAction={() => navigate(-1)}
        icon={<FaMapMarkerAlt size={20} />}
        breadcrumbs={[
          { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
          { label: tt("list.breadcrumb"), onClick: () => navigate("/inventario/ubicaciones") },
        ]}
      >
        {detail.error ? (
          <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
            {detail.error}
          </ITAlert>
        ) : (
          <ITFlex justify="center">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        )}
      </ITPage>
    );
  }

  const loc = detail.loc;

  return (
    <ITPage
      title={loc.lugar}
      description={tt("detail.description")}
      backAction={() => navigate(-1)}
      icon={<FaMapMarkerAlt size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("list.breadcrumb"), onClick: () => navigate("/inventario/ubicaciones") },
        { label: loc.lugar },
      ]}
      actions={
        isAdmin ? (
          <ITButton
            variant="outlined"
            size="sm"
            color="danger"
            onClick={() => detail.setLocToDelete(true)}
            title={tt("list.delete")}
          >
            <FaTrash size={12} />
          </ITButton>
        ) : undefined
      }
    >
      {detail.error && (
        <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
          {detail.error}
        </ITAlert>
      )}

      <LocationStatsGrid loc={loc} />

      <LocationInfoCard
        loc={loc}
        isAdmin={isAdmin}
        newSublugar={detail.newSublugar}
        onNewSublugar={detail.setNewSublugar}
        onAddSublugar={detail.handleAddSublugar}
        onRemoveSublugar={detail.setSublugarToDelete}
      />

      <LocationDevicesCard devices={loc.devices ?? []} />

      <LocationCartasCard cartas={loc.cartas ?? []} />

      <ITConfirmDialog
        isOpen={!!detail.sublugarToDelete}
        onClose={() => detail.setSublugarToDelete(null)}
        onConfirm={detail.confirmRemoveSublugar}
        title={tt("detail.removeSubarea")}
        message={tt("detail.removeSubareaMsg", { name: detail.sublugarToDelete?.name })}
        confirmLabel={tt("common:actions.delete")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={detail.locToDelete}
        onClose={() => detail.setLocToDelete(false)}
        onConfirm={detail.confirmDeleteLoc}
        title={tt("detail.deleteLocation")}
        message={tt("detail.deleteLocationMsg", { name: loc.lugar })}
        confirmLabel={tt("common:actions.delete")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
        loading={detail.deleting}
      />
    </ITPage>
  );
}