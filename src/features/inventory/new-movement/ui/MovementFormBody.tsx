import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITSearchSelect,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaBoxOpen, FaMapMarkerAlt, FaTicketAlt } from "react-icons/fa";
import type { UseNewInventoryMovement } from "../model/useNewInventoryMovement";

export default function MovementFormBody({ fx }: { fx: UseNewInventoryMovement }) {
  const { t, form, setForm, selectedDevice } = fx;

  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] overflow-visible">
      <ITStack direction="column" spacing={5}>
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {t("new.movementData")}
        </ITText>

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
              locationId: dev?.locationId ?? "",
            }));
          }}
        />

        {selectedDevice && (
          <ITCard className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <ITStack direction="column" spacing={2}>
              <ITFlex align="center" gap={2}>
                <FaBoxOpen size={14} className="text-slate-400" />
                <ITText className="text-[11px] font-bold text-slate-700">
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
                  size="small"
                >
                  {selectedDevice.estado}
                </ITBadget>
              </ITFlex>
              <ITFlex align="center" gap={2}>
                <FaMapMarkerAlt size={12} className="text-slate-400" />
                <ITText className="text-[11px] text-slate-500">
                  {t("new.currentLocation", {
                    loc: fx.formatLocation(selectedDevice.location),
                  })}
                </ITText>
              </ITFlex>
            </ITStack>
          </ITCard>
        )}

        <ITSearchSelect
          name="tipo"
          label={t("new.movementType")}
          options={fx.TIPO_OPTIONS}
          value={form.tipo}
          onChange={(val) =>
            setForm((f) => ({
              ...f,
              tipo: val as typeof f.tipo,
              condicion: "",
              accionMalasCondiciones: "",
            }))
          }
        />

        {fx.requiresLocation && (
          <ITSearchSelect
            name="location"
            label={t("new.destLocation")}
            placeholder={t("new.destPlaceholder")}
            options={fx.locations.map((l) => ({
              value: l.id,
              label: fx.formatLocation(l),
            }))}
            value={form.locationId}
            onChange={(val) => setForm((f) => ({ ...f, locationId: val as string }))}
          />
        )}

        {fx.requiresPrestamoFields && (
          <ITStack
            direction="column"
            spacing={4}
            className="p-4 bg-blue-50 rounded-xl border border-blue-100"
          >
            <ITText className="text-[11px] font-black uppercase tracking-widest text-blue-600">
              {t("new.prestamoTitle")}
            </ITText>
            <ITInput
              name="prestadoA"
              label={t("new.assignedTo")}
              value={form.prestadoA}
              onChange={(e) => setForm((f) => ({ ...f, prestadoA: e.target.value }))}
              placeholder={t("new.assignedToPlaceholder")}
            />
            <ITInput
              name="fechaRetornoEsperado"
              label={t("new.returnDate")}
              value={form.fechaRetornoEsperado}
              onChange={(e) =>
                setForm((f) => ({ ...f, fechaRetornoEsperado: e.target.value }))
              }
              placeholder={t("new.returnDatePlaceholder")}
            />
          </ITStack>
        )}

        {fx.requiresDevolucionFields && (
          <ITStack
            direction="column"
            spacing={4}
            className="p-4 bg-green-50 rounded-xl border border-green-100"
          >
            <ITText className="text-[11px] font-black uppercase tracking-widest text-green-600">
              {t("new.devolutionTitle")}
            </ITText>
            <ITFlex gap={2} wrap="wrap">
              {fx.CONDICION_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      condicion: c.value,
                      accionMalasCondiciones: "",
                    }))
                  }
                  className={`px-4 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                    form.condicion === c.value
                      ? c.value === "BUENO"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : c.value === "ACEPTABLE"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-red-500 text-white border-red-500"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </ITFlex>
          </ITStack>
        )}

        {fx.isMalasCondiciones && (
          <ITStack
            direction="column"
            spacing={4}
            className="p-4 bg-red-50 rounded-xl border border-red-200"
          >
            <ITText className="text-[11px] font-black uppercase tracking-widest text-red-600">
              {t("new.malasTitle")}
            </ITText>
            <ITFlex gap={2} wrap="wrap">
              <ITButton
                variant={form.accionMalasCondiciones === "BAJA" ? "filled" : "outlined"}
                color="danger"
                onClick={() => setForm((f) => ({ ...f, accionMalasCondiciones: "BAJA" }))}
              >
                <ITFlex align="center" gap={1}>
                  <FaArrowRight size={12} />
                  <ITText className="font-bold text-[11px]">{t("new.darDeBaja")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton
                variant={form.accionMalasCondiciones === "TICKET" ? "filled" : "outlined"}
                color="warning"
                onClick={() =>
                  setForm((f) => ({ ...f, accionMalasCondiciones: "TICKET" }))
                }
              >
                <ITFlex align="center" gap={1}>
                  <FaTicketAlt size={12} />
                  <ITText className="font-bold text-[11px]">{t("new.crearTicket")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
            {form.accionMalasCondiciones === "TICKET" && (
              <ITAlert variant="warning">{t("new.ticketAlert")}</ITAlert>
            )}
            {form.accionMalasCondiciones === "BAJA" && (
              <ITAlert variant="error">{t("new.bajaAlert")}</ITAlert>
            )}
          </ITStack>
        )}

        {form.tipo === "SALIDA" && selectedDevice?.location && (
          <ITFlex
            align="center"
            gap={2}
            className="p-3 bg-red-50 rounded-xl border border-red-100"
          >
            <FaArrowRight size={14} className="text-red-500" />
            <ITText className="text-[11px] text-red-600">
              {t("new.retirarDe")}{" "}
              <strong>{fx.formatLocation(selectedDevice.location)}</strong>
            </ITText>
          </ITFlex>
        )}

        {form.tipo === "BAJA" && (
          <ITStack direction="column" spacing={3}>
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
          </ITStack>
        )}

        <ITInput
          name="notas"
          label={t("new.notas")}
          value={form.notas}
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          placeholder={t("new.notasPlaceholder")}
        />
      </ITStack>
    </ITCard>
  );
}