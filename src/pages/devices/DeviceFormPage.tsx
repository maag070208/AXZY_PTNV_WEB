import {
  ITAlert,
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaLock, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDeviceForm, DeviceFormBody } from "@features/device/device-form";

export default function DeviceFormPage() {
  const { t: tt } = useTranslation(["device", "common"]);
  const navigate = useNavigate();
  const fx = useDeviceForm();

  const {
    loading,
    saving,
    disabledAll,
    blockedAssetCode,
    error,
    setError,
    success,
    setSuccess,
    isLoteEdit,
    isEdit,
    isBatch,
    cantidad,
    form,
    handleSubmit,
  } = fx;

  if (loading) {
    return (
      <ITPage
        title={tt("device:list.title")}
        loading
        backAction={() => navigate(-1)}
        breadcrumbs={[
          {
            label: tt("device:list.title"),
            onClick: () => navigate("/dispositivos"),
          },
          { label: "Formulario" },
        ]}
      >
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const actions = (
    <ITFlex gap={2}>
      <ITButton variant="outlined" onClick={() => navigate("/dispositivos")}>
        {tt("common:actions.cancel")}
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={
          saving ||
          disabledAll ||
          !form.typeId ||
          !form.descripcion ||
          !form.marca ||
          !form.modelo
        }
      >
        <ITFlex align="center" gap={1}>
          {disabledAll ? <FaLock size={12} /> : <FaSave size={12} />}
          <ITText className="font-bold text-[11px]">
            {disabledAll
              ? "Asignado — bloqueado"
              : saving
              ? "Guardando…"
              : isBatch
              ? `Dar de alta ${cantidad} unidades`
              : isEdit
              ? "Guardar cambios"
              : "Guardar"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={
        isLoteEdit
          ? `Editar lote (${fx.loteRows.length} unidades)`
          : isEdit
          ? "Editar dispositivo"
          : "Nuevo dispositivo"
      }
      description={
        isLoteEdit
          ? "Los datos compartidos se aplican a todo el lote. Cada unidad edita su serie, nombre, IP, MAC y área por separado."
          : isEdit
          ? "Si cambias el tipo se generará un nuevo control de activos"
          : "Indica la cantidad si vas a dar de alta varias unidades iguales"
      }
      backAction={() => navigate(-1)}
      breadcrumbs={[
        {
          label: tt("device:list.title"),
          onClick: () => navigate("/dispositivos"),
        },
        { label: isEdit ? tt("common:actions.edit") : tt("common:actions.new") },
      ]}
      actions={actions}
    >
      {disabledAll && (
        <ITAlert variant="warning">
          <ITFlex align="center" gap={2}>
            <FaLock size={14} />
            <ITText className="text-[12px] font-bold">
              Este dispositivo (activo {blockedAssetCode}) está asignado y no se
              puede editar. Registra su devolución para poder modificarlo.
            </ITText>
          </ITFlex>
        </ITAlert>
      )}
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      {success && (
        <ITAlert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </ITAlert>
      )}

      <div className="max-w-2xl">
        <DeviceFormBody fx={fx} />
      </div>
    </ITPage>
  );
}