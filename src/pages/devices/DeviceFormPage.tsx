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
          { label: tt("device:form.breadcrumb") },
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
              ? tt("device:form.locked")
              : saving
              ? tt("device:form.adding")
              : isBatch
              ? tt("device:form.registerUnits", { count: cantidad })
              : isEdit
              ? tt("device:form.saveChanges")
              : tt("common:actions.save")}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={
        isLoteEdit
          ? tt("device:form.editLoteTitle", { count: fx.loteRows.length })
          : isEdit
          ? tt("device:form.editDevice")
          : tt("device:form.newDevice")
      }
      description={
        isLoteEdit
          ? tt("device:form.loteEditDescription")
          : isEdit
          ? tt("device:form.editDescription")
          : tt("device:form.newDescription")
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
              {tt("device:form.lockedMessage", { code: blockedAssetCode })}
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