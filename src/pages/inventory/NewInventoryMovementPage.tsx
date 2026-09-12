import {
  ITAlert,
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import {
  useNewInventoryMovement,
  MovementFormBody,
} from "@features/inventory/new-movement";

export default function NewInventoryMovementPage() {
  const fx = useNewInventoryMovement();

  if (fx.loading) {
    return (
      <ITPage title={fx.t("new.loadingTitle")} loading backAction={() => fx.navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={fx.t("new.title")}
      backAction={() => fx.navigate("/inventario/movimientos")}
      breadcrumbs={[
        { label: fx.t("common:breadcrumbs.home"), onClick: () => fx.navigate("/") },
        { label: fx.t("index.title"), onClick: () => fx.navigate("/inventario") },
        {
          label: fx.t("movements.loadingTitle"),
          onClick: () => fx.navigate("/inventario/movimientos"),
        },
        { label: fx.t("common:actions.new") },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={fx.handleSubmit}
          disabled={fx.saving}
        >
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">
              {fx.saving ? fx.t("new.saving") : fx.t("new.register")}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <MovementFormBody fx={fx} />

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