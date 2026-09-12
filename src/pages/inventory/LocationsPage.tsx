import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaMapMarkerAlt, FaPlus } from "react-icons/fa";
import { formatLocation } from "@entities/location";
import {
  useLocations,
  buildLocationsColumns,
  buildLocationCard,
  LocationFormDialog,
  LocationDevicesDialog,
} from "@features/inventory/locations";

export default function LocationsPage() {
  const fx = useLocations();

  if (fx.loading) {
    return (
      <ITPage title={fx.t("locations.title")} loading>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={fx.t("locations.title")}
      description={fx.t("locations.description", { count: fx.locations.length })}
      icon={<FaMapMarkerAlt size={20} />}
      breadcrumbs={[
        { label: fx.t("common:breadcrumbs.home"), onClick: () => fx.navigate("/") },
        { label: fx.t("index.title"), onClick: () => fx.navigate("/inventario") },
        { label: fx.t("locations.title") },
      ]}
      actions={
        fx.isAdmin ? (
          <ITButton variant="filled" color="primary" onClick={fx.openNew}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">
                {fx.t("locations.newLocation")}
              </ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ITDataTable
        columns={buildLocationsColumns(fx) as any}
        fetchData={fx.fetchTableData as any}
        renderCard={buildLocationCard(fx) as any}
        defaultItemsPerPage={20}
        size="sm"
      />

      <LocationFormDialog fx={fx} />

      <ITConfirmDialog
        isOpen={!!fx.locToDelete}
        onClose={() => fx.setLocToDelete(null)}
        onConfirm={fx.handleDelete}
        title={fx.t("locations.deleteTitle")}
        message={fx.t("locations.deleteMessage", {
          loc: fx.locToDelete ? formatLocation(fx.locToDelete) : "",
        })}
        confirmLabel={fx.t("locations.remove")}
        cancelLabel={fx.t("common:actions.cancel")}
        variant="danger"
      />

      <LocationDevicesDialog fx={fx} />

      {fx.toast && (
        <ITToast
          message={fx.toast.message}
          type={fx.toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => fx.setToast(null)}
        />
      )}
    </ITPage>
  );
}