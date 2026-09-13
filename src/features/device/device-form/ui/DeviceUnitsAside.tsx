import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBoxes, FaLock, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatMacInput } from "@shared/utils/itDevice";
import type { UseDeviceForm } from "../model/useDeviceForm";

interface Props {
  fx: UseDeviceForm;
}

// Panel lateral (estilo "detalle de ticket") con la lista de unidades — se
// muestra junto al formulario cuando hay más de una unidad que capturar
// (alta por lote o edición de un lote existente), para que el formulario no
// quede enterrado debajo de una lista larga de tarjetas.
export default function DeviceUnitsAside({ fx }: Props) {
  const { t: tt } = useTranslation(["device", "common"]);
  const { isBatch, isLoteEdit, showField, showITSpecs } = fx;

  if (!isBatch && !isLoteEdit) return null;

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-5 md:sticky md:top-24">
      <ITFlex align="center" gap={2} className="mb-4">
        <FaBoxes size={14} className="text-slate-400 shrink-0" />
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 truncate">
          {isBatch
            ? tt("form.unitsHeader", {
                count: fx.cantidad,
                specs: showITSpecs ? tt("form.unitsHeaderSpecs") : "",
              })
            : tt("form.loteUnits", { count: fx.loteRows.length })}
        </ITText>
      </ITFlex>

      <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {isBatch && (
          <ITFlex direction="column" gap={3}>
            {fx.units.slice(0, fx.cantidad).map((u, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <ITFlex justify="between" align="center" className="mb-2">
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {tt("form.unitOf", { current: idx + 1, total: fx.cantidad })}
                  </ITText>
                  {fx.cantidad > 1 && (
                    <ITButton
                      variant="outlined"
                      size="small"
                      color="secondary"
                      onClick={() => fx.removeUnitRow(idx)}
                      title={tt("form.removeUnit")}
                    >
                      <FaTrash size={11} />
                    </ITButton>
                  )}
                </ITFlex>
                <ITGrid container columns={12} spacing={3}>
                  {showField("numeroSerie") && (
                    <ITGrid item xs={12} md={showITSpecs ? 12 : 6}>
                      <ITInput
                        name={`serie-${idx}`}
                        label={tt("form.serialNo")}
                        value={u.numeroSerie}
                        onChange={(e) =>
                          fx.handleUnitField(idx, "numeroSerie", e.target.value)
                        }
                      />
                    </ITGrid>
                  )}
                  {showField("nombreEquipo") && (
                    <ITGrid item xs={12} md={showITSpecs ? 12 : 6}>
                      <ITInput
                        name={`eq-${idx}`}
                        label={tt("form.equipmentName")}
                        value={u.nombreEquipo}
                        onChange={(e) =>
                          fx.handleUnitField(idx, "nombreEquipo", e.target.value)
                        }
                      />
                    </ITGrid>
                  )}
                  {(showField("ip") || showField("macAddress")) && (
                    <>
                      {showField("ip") && (
                        <ITGrid item xs={12} md={6}>
                          <ITInput
                            name={`ip-${idx}`}
                            label={tt("form.ip")}
                            value={u.ip}
                            onChange={(e) =>
                              fx.handleUnitField(idx, "ip", e.target.value)
                            }
                            placeholder="192.168.0.1"
                          />
                        </ITGrid>
                      )}
                      {showField("macAddress") && (
                        <ITGrid item xs={12} md={6}>
                          <ITInput
                            name={`mac-${idx}`}
                            label={tt("form.mac")}
                            value={u.macAddress}
                            onChange={(e) =>
                              fx.handleUnitField(
                                idx,
                                "macAddress",
                                formatMacInput(e.target.value)
                              )
                            }
                            placeholder="AA:BB:CC:DD:EE:FF"
                          />
                        </ITGrid>
                      )}
                    </>
                  )}
                </ITGrid>
              </div>
            ))}
          </ITFlex>
        )}

        {isLoteEdit &&
          (fx.loteLoading ? (
            <ITFlex justify="center" align="center" className="py-8">
              <ITLoader variant="spinner" size="md" color="primary" />
            </ITFlex>
          ) : (
            <ITFlex direction="column" gap={3}>
              {fx.loteRows.map((r, idx) => {
                const locked = r.estado === "ASIGNADO";
                return (
                  <div
                    key={r.id}
                    className={`rounded-2xl border p-4 ${
                      locked
                        ? "border-amber-200 bg-amber-50/40"
                        : "border-slate-100 bg-slate-50/60"
                    }`}
                  >
                    <ITFlex justify="between" align="center" className="mb-2 flex-wrap">
                      <ITFlex align="center" gap={2}>
                        <ITText className="text-[11px] font-black text-slate-800">
                          {r.controlActivos}
                        </ITText>
                        <ITBadget
                          color={
                            r.estado === "DISPONIBLE"
                              ? "success"
                              : r.estado === "ASIGNADO"
                              ? "warning"
                              : "gray"
                          }
                          size="small"
                        >
                          {r.estado}
                        </ITBadget>
                      </ITFlex>
                      {locked ? (
                        <ITFlex align="center" gap={1}>
                          <FaLock size={10} className="text-amber-600" />
                          <ITText className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                            {tt("form.assignedProtected")}
                          </ITText>
                        </ITFlex>
                      ) : (
                        fx.loteRows.length > 1 && (
                          <ITButton
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => fx.requestRemoveLoteUnit(r)}
                            title={tt("form.removeUnit")}
                          >
                            <FaTrash size={11} />
                          </ITButton>
                        )
                      )}
                    </ITFlex>
                    <ITGrid container columns={12} spacing={3}>
                      {showField("numeroSerie") && (
                        <ITGrid item xs={12} md={showITSpecs ? 12 : 6}>
                          <ITInput
                            name={`lote-serie-${idx}`}
                            label={tt("form.serialNo")}
                            value={r.numeroSerie}
                            onChange={(e) =>
                              fx.setLoteRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, numeroSerie: e.target.value }
                                    : x
                                )
                              )
                            }
                            disabled={locked}
                          />
                        </ITGrid>
                      )}
                      {showField("nombreEquipo") && (
                        <ITGrid item xs={12} md={showITSpecs ? 12 : 6}>
                          <ITInput
                            name={`lote-eq-${idx}`}
                            label={tt("form.equipmentName")}
                            value={r.nombreEquipo}
                            onChange={(e) =>
                              fx.setLoteRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, nombreEquipo: e.target.value }
                                    : x
                                )
                              )
                            }
                            disabled={locked}
                          />
                        </ITGrid>
                      )}
                      {(showField("ip") || showField("macAddress")) && (
                        <>
                          {showField("ip") && (
                            <ITGrid item xs={12} md={6}>
                              <ITInput
                                name={`lote-ip-${idx}`}
                                label={tt("form.ip")}
                                value={r.ip}
                                onChange={(e) =>
                                  fx.setLoteRows((prev) =>
                                    prev.map((x, i) =>
                                      i === idx ? { ...x, ip: e.target.value } : x
                                    )
                                  )
                                }
                                placeholder="192.168.0.1"
                                disabled={locked}
                              />
                            </ITGrid>
                          )}
                          {showField("macAddress") && (
                            <ITGrid item xs={12} md={6}>
                              <ITInput
                                name={`lote-mac-${idx}`}
                                label={tt("form.macAddress")}
                                value={r.macAddress}
                                onChange={(e) =>
                                  fx.setLoteRows((prev) =>
                                    prev.map((x, i) =>
                                      i === idx
                                        ? {
                                            ...x,
                                            macAddress: formatMacInput(
                                              e.target.value
                                            ),
                                          }
                                        : x
                                    )
                                  )
                                }
                                placeholder="AA:BB:CC:DD:EE:FF"
                                disabled={locked}
                              />
                            </ITGrid>
                          )}
                        </>
                      )}
                      <ITGrid item xs={12}>
                        <ITInput
                          name={`lote-area-${idx}`}
                          label={tt("form.area")}
                          value={r.area}
                          onChange={(e) =>
                            fx.setLoteRows((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, area: e.target.value } : x
                              )
                            )
                          }
                          disabled={locked}
                        />
                      </ITGrid>
                    </ITGrid>
                  </div>
                );
              })}
            </ITFlex>
          ))}
      </div>

      {isLoteEdit && (
        <ITConfirmDialog
          isOpen={!!fx.unitToRemove}
          onClose={fx.cancelRemoveLoteUnit}
          onConfirm={fx.confirmRemoveLoteUnit}
          title={tt("form.removeLoteUnitTitle")}
          message={
            fx.unitToRemove
              ? tt("form.removeLoteUnitMessage", {
                  code: fx.unitToRemove.controlActivos,
                })
              : ""
          }
          confirmLabel={
            fx.removingUnit
              ? tt("form.removingUnit")
              : tt("form.removeLoteUnitConfirm")
          }
          cancelLabel={tt("common:actions.cancel")}
          variant="danger"
        />
      )}
    </div>
  );
}
