import {
  ITAlert,
  ITBadget,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import {
  FaBoxOpen,
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaTrashAlt,
  FaTruck,
  FaUndoAlt,
} from "react-icons/fa";
import type { ReactNode } from "react";
import type { UseNewInventoryMovement } from "../model/useNewInventoryMovement";

const MOVEMENT_PRESETS: Record<
  string,
  { icon: ReactNode; ring: string; text: string; dot: string }
> = {
  ENTRADA: {
    icon: <FaSignInAlt size={12} />,
    ring: "ring-emerald-300",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  SALIDA: {
    icon: <FaSignOutAlt size={12} />,
    ring: "ring-orange-300",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  TRASLADO: {
    icon: <FaTruck size={12} />,
    ring: "ring-indigo-300",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  PRESTAMO: {
    icon: <FaClipboardCheck size={12} />,
    ring: "ring-blue-300",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  DEVOLUCION: {
    icon: <FaUndoAlt size={12} />,
    ring: "ring-amber-300",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  BAJA: {
    icon: <FaTrashAlt size={12} />,
    ring: "ring-red-300",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

const CONDITION_PRESETS: Record<
  string,
  { ring: string; text: string; dot: string }
> = {
  BUENO: { ring: "ring-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  ACEPTABLE: {
    ring: "ring-amber-300",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  MALO: {
    ring: "ring-orange-300",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  ROTO: { ring: "ring-red-300", text: "text-red-700", dot: "bg-red-500" },
};

export default function MovementFormBody({ fx }: { fx: UseNewInventoryMovement }) {
  const { t, form, setForm, selectedDevice } = fx;

  const tipoPreset = form.tipo ? MOVEMENT_PRESETS[form.tipo] : undefined;
  const condOption = fx.CONDICION_OPTIONS.find((c) => c.value === form.condicion);

  return (
    <ITGrid container columns={12} spacing={6}>
      <ITGrid item xs={12} lg={8}>
        <ITFlex direction="column" gap={6}>
          <ITFlex
            as="section"
            direction="column"
            gap={6}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <ITFlex direction="column" gap={1}>
              <ITText as="h2" className="text-xl font-bold text-slate-900">
                {t("new.formTitle")}
              </ITText>
              <ITText as="p" className="max-w-lg text-sm leading-6 text-slate-500">
                {t("new.formSub")}
              </ITText>
            </ITFlex>

            <ITSearchSelect
              name="device"
              label={t("new.device")}
              placeholder={t("new.devicePlaceholder")}
              options={fx.devices.map((d) => ({
                value: d.id,
                label: `${d.controlActivos} - ${d.descripcion} (${d.marca} ${d.modelo})`,
              }))}
              value={form.deviceId}
              onChange={(val) => {
                const dev = fx.devices.find((d) => d.id === val);
                setForm((f) => ({
                  ...f,
                  deviceId: val as string,
                  departmentId: dev?.departmentId ?? "",
                }));
              }}
            />

            <ITFlex as="fieldset" direction="column" gap={2}>
              <ITText as="legend" className="text-sm font-semibold text-slate-700">
                {t("new.movementType")}
              </ITText>
              <ITFlex gap={2} wrap="wrap">
                {fx.TIPO_OPTIONS.map((opt) => {
                  const preset = MOVEMENT_PRESETS[opt.value];
                  const isActive = form.tipo === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          tipo: opt.value,
                          condicion: "",
                        }))
                      }
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? `border-transparent bg-slate-50 ring-2 ${preset.ring} ${preset.text}`
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {preset.icon}
                      <span>{t(`typeLabels.${opt.value}`)}</span>
                    </button>
                  );
                })}
              </ITFlex>
            </ITFlex>

            {fx.requiresLocation && (
              <ITSearchSelect
                name="department"
                label={t("new.destDepartment")}
                placeholder={t("new.destPlaceholder")}
                options={fx.departments.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                value={form.departmentId}
                onChange={(val) => setForm((f) => ({ ...f, departmentId: val as string }))}
              />
            )}

            {fx.requiresPrestamoFields && (
              <ITGrid container columns={12} spacing={5}>
                <ITGrid item xs={12} md={7}>
                  <ITInput
                    name="prestadoA"
                    label={t("new.assignedTo")}
                    value={form.prestadoA}
                    onChange={(e) => setForm((f) => ({ ...f, prestadoA: e.target.value }))}
                    placeholder={t("new.assignedToPlaceholder")}
                    required
                  />
                </ITGrid>
                <ITGrid item xs={12} md={5}>
                  <ITInput
                    name="fechaRetornoEsperado"
                    label={t("new.returnDate")}
                    value={form.fechaRetornoEsperado}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fechaRetornoEsperado: e.target.value }))
                    }
                    placeholder={t("new.returnDatePlaceholder")}
                  />
                </ITGrid>
              </ITGrid>
            )}

            {fx.requiresDevolucionFields && (
              <ITFlex as="fieldset" direction="column" gap={2}>
                <ITText as="legend" className="text-sm font-semibold text-slate-700">
                  {t("new.devolutionTitle")}
                </ITText>
                <ITFlex gap={2} wrap="wrap">
                  {fx.CONDICION_OPTIONS.map((opt) => {
                    const preset = CONDITION_PRESETS[opt.value];
                    const isActive = form.condicion === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            condicion: opt.value,
                          }))
                        }
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? `border-transparent bg-slate-50 ring-2 ${preset.ring} ${preset.text}`
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${preset.dot}`} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </ITFlex>
              </ITFlex>
            )}

            {fx.requiresDevolucionFields && (
              <ITAlert variant="info">{t("new.devolutionTicket")}</ITAlert>
            )}

            {form.tipo === "SALIDA" && selectedDevice?.department && (
              <ITFlex
                align="center"
                gap={2}
                className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3"
              >
                <FaSignOutAlt size={13} className="text-orange-500" />
                <ITText className="text-xs text-orange-700">
                  {t("new.retirarDe")}{" "}
                  <strong>{selectedDevice.department.name}</strong>
                </ITText>
              </ITFlex>
            )}

            {form.tipo === "BAJA" && (
              <ITFlex direction="column" gap={3}>
                <ITAlert variant="error" dismissible={false}>
                  {t("new.bajaNota")}
                </ITAlert>
                <ITInput
                  name="motivoBaja"
                  label={t("new.motivoBaja")}
                  value={form.motivoBaja}
                  onChange={(e) => setForm((f) => ({ ...f, motivoBaja: e.target.value }))}
                  placeholder={t("new.motivoBajaPlaceholder")}
                />
              </ITFlex>
            )}
          </ITFlex>
        </ITFlex>
      </ITGrid>

      <ITGrid item xs={12} lg={4}>
        <ITFlex direction="column" gap={4} className="lg:sticky lg:top-6">
          <ITFlex
            as="section"
            direction="column"
            gap={4}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <ITFlex align="center" gap={2}>
              <FaBoxOpen className="text-slate-400" size={14} />
              <ITText className="text-sm font-semibold text-slate-800">
                {t("new.equipmentTitle")}
              </ITText>
            </ITFlex>

            {selectedDevice ? (
              <ITFlex direction="column" gap={3}>
                <ITFlex align="center" gap={2}>
                  <ITText className="text-sm font-semibold text-slate-900">
                    {selectedDevice.controlActivos}
                  </ITText>
                  <ITBadget
                    color={
                      selectedDevice.estado === "DISPONIBLE"
                        ? "success"
                        : selectedDevice.estado === "ASIGNADO"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                  >
                    {selectedDevice.estado}
                  </ITBadget>
                </ITFlex>
                <ITText className="text-xs text-slate-500">
                  {selectedDevice.marca} {selectedDevice.modelo}
                </ITText>
                <ITText className="text-xs leading-5 text-slate-500">
                  {selectedDevice.descripcion}
                </ITText>
                <ITFlex
                  align="center"
                  gap={2}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <FaMapMarkerAlt className="shrink-0 text-slate-400" size={11} />
                  <ITText className="text-xs font-medium text-slate-600">
                    {selectedDevice.department
                      ? selectedDevice.department.name
                      : t("index.unassignedDevices")}
                  </ITText>
                </ITFlex>
              </ITFlex>
            ) : (
              <ITText className="text-xs leading-5 text-slate-400">
                {t("new.equipmentEmpty")}
              </ITText>
            )}
          </ITFlex>

          <ITFlex
            as="section"
            direction="column"
            gap={4}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <ITText className="text-sm font-semibold text-slate-800">
              {t("new.notas")}
            </ITText>
            <ITFlex direction="column" gap={1}>
              <ITTextarea
                name="notas"
                value={form.notas}
                onChange={(v) => setForm((f) => ({ ...f, notas: v }))}
                placeholder={t("new.notasPlaceholder")}
                rows={5}
              />
              <ITText className="text-right text-xs text-slate-400">
                {form.notas.length} / 500
              </ITText>
            </ITFlex>
          </ITFlex>

          {(form.tipo || form.condicion) && (
            <ITFlex
              align="center"
              justify="between"
              gap={2}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <ITFlex align="center" gap={2}>
                {tipoPreset && <span className={`h-2 w-2 rounded-full ${tipoPreset.dot}`} />}
                <ITText className="text-xs text-slate-500">
                  {form.tipo ? t(`typeLabels.${form.tipo}`) : t("movements.all")}
                </ITText>
              </ITFlex>
              {condOption && (
                <ITBadget
                  color={condOption.color as "success" | "warning" | "danger"}
                  size="sm"
                >
                  {condOption.label}
                </ITBadget>
              )}
            </ITFlex>
          )}
        </ITFlex>
      </ITGrid>
    </ITGrid>
  );
}