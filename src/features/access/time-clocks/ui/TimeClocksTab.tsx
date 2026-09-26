import {
  ITAlert,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDialog,
  ITFlex,
  ITInput,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaLock, FaPlus } from "react-icons/fa";
import type { UseChecadorRelojes } from "../model/useChecadorRelojes";
import RelojCard from "./RelojCard";

/**
 * Relojes checadores: alta, baja, sincronización y configuración leída en vivo.
 * Del reloj solo se lee; nada de esta pantalla le cambia algo al equipo.
 */
export default function ChecadorRelojesTab({ fx }: { fx: UseChecadorRelojes }) {
  const {
    t,
    status,
    configs,
    altaAbierta,
    setAltaAbierta,
    abrirAlta,
    url,
    setUrl,
    nombre,
    setNombre,
    asistencia,
    setAsistencia,
    conectando,
    altaError,
    registrar,
    editTarget,
    setEditTarget,
    editNombre,
    setEditNombre,
    editAsistencia,
    setEditAsistencia,
    guardando,
    editError,
    guardarEdicion,
    bajaTarget,
    setBajaTarget,
    dandoDeBaja,
    confirmarBaja,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="!p-5 border border-slate-200">
        <ITFlex align="center" wrap="wrap" gap={3}>
          <ITFlex direction="column" gap={1} className="min-w-0">
            <ITFlex align="center" gap={1}>
              <FaLock size={11} className="text-slate-400" />
              <ITText className="text-[12px] font-bold text-slate-700">{t("relojes.readOnly")}</ITText>
            </ITFlex>
            <ITText className="text-[11px] text-slate-500">{t("relojes.credenciales")}</ITText>
          </ITFlex>
          <ITButton
            variant="filled"
            color="primary"
            size="sm"
            className="ml-auto"
            disabled={!status?.configurado}
            onClick={abrirAlta}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={10} />
              <ITText className="font-bold text-[11px]">{t("relojes.actions.alta")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITCard>

      {status && !status.configurado && <ITAlert variant="warning">{t("relojes.notConfigured")}</ITAlert>}

      {status && status.dispositivos.length === 0 && (
        <ITCard className="!p-5 border border-slate-200">
          <ITText className="text-[12px] text-slate-500">{t("relojes.empty")}</ITText>
        </ITCard>
      )}

      {status?.dispositivos.map((reloj) => (
        <RelojCard
          key={reloj.dispositivoSerie}
          fx={fx}
          reloj={reloj}
          config={configs[reloj.dispositivoSerie]}
        />
      ))}

      <ITDialog
        isOpen={altaAbierta}
        onClose={() => !conectando && setAltaAbierta(false)}
        title={t("relojes.dialog.altaTitle")}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={3} className="mt-2">
          <ITFlex direction="column" gap={1}>
            <ITInput
              name="checadorRelojUrl"
              label={t("relojes.dialog.url")}
              placeholder={t("relojes.dialog.urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full min-w-0"
            />
            <ITText className="text-[11px] text-slate-500">{t("relojes.dialog.urlHint")}</ITText>
          </ITFlex>
          <ITFlex direction="column" gap={1}>
            <ITInput
              name="checadorRelojNombre"
              label={t("relojes.dialog.nombre")}
              placeholder={t("relojes.dialog.nombrePlaceholder")}
              value={nombre}
              maxLength={80}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full min-w-0"
            />
            <ITText className="text-[11px] text-slate-500">{t("relojes.dialog.nombreHint")}</ITText>
          </ITFlex>
          <UsoDelReloj fx={fx} checked={asistencia} onChange={setAsistencia} name="checadorRelojAsistencia" />
          <ITText className="text-[11px] text-slate-600">{t("relojes.dialog.altaNota")}</ITText>
          {altaError && <ITAlert variant="error">{altaError}</ITAlert>}
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              color="secondary"
              disabled={conectando}
              onClick={() => setAltaAbierta(false)}
            >
              {t("relojes.actions.cancelar")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              disabled={!url.trim() || conectando}
              onClick={() => void registrar()}
            >
              {conectando ? t("relojes.actions.conectando") : t("relojes.actions.confirmarAlta")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={!!editTarget}
        onClose={() => !guardando && setEditTarget(null)}
        title={t("relojes.dialog.editarTitle", { nombre: editTarget?.nombre ?? "" })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={3} className="mt-2">
          <ITInput
            name="checadorRelojEditarNombre"
            label={t("relojes.dialog.nombreEditar")}
            value={editNombre}
            maxLength={80}
            onChange={(e) => setEditNombre(e.target.value)}
            className="w-full min-w-0"
          />
          <UsoDelReloj
            fx={fx}
            checked={editAsistencia}
            onChange={setEditAsistencia}
            name="checadorRelojEditarAsistencia"
          />
          <ITText className="text-[11px] text-slate-600">{t("relojes.dialog.editarNota")}</ITText>
          {editError && <ITAlert variant="error">{editError}</ITAlert>}
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              color="secondary"
              disabled={guardando}
              onClick={() => setEditTarget(null)}
            >
              {t("relojes.actions.cancelar")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              disabled={!editNombre.trim() || guardando}
              onClick={() => void guardarEdicion()}
            >
              {t("relojes.actions.guardar")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={!!bajaTarget}
        onClose={() => !dandoDeBaja && setBajaTarget(null)}
        title={t("relojes.dialog.bajaTitle", { nombre: bajaTarget?.nombre ?? "" })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={3} className="mt-2">
          <ITText className="text-[12px] text-slate-600">{t("relojes.dialog.bajaTexto")}</ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              color="secondary"
              disabled={dandoDeBaja}
              onClick={() => setBajaTarget(null)}
            >
              {t("relojes.actions.cancelar")}
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              disabled={dandoDeBaja}
              onClick={() => void confirmarBaja()}
            >
              {t("relojes.actions.confirmarBaja")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="top-right"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}

/** Si las checadas del reloj cuentan para entradas/salidas (alta y edición). */
function UsoDelReloj({
  fx,
  checked,
  onChange,
  name,
}: {
  fx: UseChecadorRelojes;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
}) {
  const { t } = fx;
  return (
    <ITFlex direction="column" gap={1}>
      <ITCheckbox name={name} checked={checked} onChange={onChange} label={t("relojes.uso.checkbox")} />
      <ITText className="text-[11px] text-slate-500">{t("relojes.uso.hint")}</ITText>
    </ITFlex>
  );
}
