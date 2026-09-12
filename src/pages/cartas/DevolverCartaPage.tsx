import { ITAlert, ITFlex, ITLoader, ITPage } from "@axzydev/axzy_ui_system";
import { FaFileSignature } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@core/utils/dates";
import {
  useDevolverCarta,
  DevolverCartaForm,
} from "@features/carta/devolver-carta";

export default function DevolverCartaPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("cartas");
  const {
    carta,
    loading,
    returnedBy,
    setReturnedBy,
    returnCondition,
    setReturnCondition,
    submitting,
    error,
    setError,
    isReturned,
    confirmUndo,
    setConfirmUndo,
    handleReturn,
    handleUndo,
  } = useDevolverCarta();

  const navigateToCartas = () => navigate(`/cartas`);

  if (loading) {
    return (
      <ITPage title={t("return.loading")} loading breadcrumbs={[
        { label: t("list.breadcrumb"), onClick: () => navigate("/cartas") },
        { label: t("return.loading") },
      ]}>
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!carta) {
    return (
      <ITPage title={t("return.loading")} backAction={() => navigate(-1)} breadcrumbs={[
        { label: t("list.breadcrumb"), onClick: () => navigate("/cartas") },
        { label: t("return.loading") },
      ]}>
        <ITAlert variant="error">Carta no encontrada</ITAlert>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={isReturned ? t("return.titleCancel") : t("return.titleMark")}
      description={`Folio ${carta.consecutivo} · ${formatFecha(carta.fecha)}`}
      backAction={() => navigate(-1)}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("list.breadcrumb"), onClick: () => navigate("/cartas") },
        { label: t("return.loading") },
      ]}
    >
      <DevolverCartaForm
        carta={carta}
        isReturned={isReturned}
        returnedBy={returnedBy}
        onReturnedByChange={setReturnedBy}
        returnCondition={returnCondition}
        onReturnConditionChange={setReturnCondition}
        submitting={submitting}
        error={error}
        onDismissError={() => setError(null)}
        confirmUndo={confirmUndo}
        onConfirmUndoChange={setConfirmUndo}
        onReturn={handleReturn}
        onUndo={handleUndo}
        onNavigateToCartas={navigateToCartas}
      />
    </ITPage>
  );
}