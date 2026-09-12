import {
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import {
  FaBoxes,
  FaBoxOpen,
  FaLayerGroup,
  FaLock,
  FaMagic,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { formatMacInput } from "@shared/utils/itDevice";
import type { UseDeviceForm } from "../model/useDeviceForm";

interface Props {
  fx: UseDeviceForm;
}

export default function DeviceFormBody({ fx }: Props) {
  const { isEdit, isBatch, isLoteEdit, disabledAll, showField, showITSpecs } = fx;

  return (
    <>
      {isEdit && (
        <ITCard className="p-5 sm:p-6 border border-blue-100 bg-blue-50/45 rounded-[24px] mb-6 shadow-lg shadow-blue-100/40">
          <ITFlex align="center" gap={4} wrap="wrap" justify="between">
            <ITFlex align="center" gap={3} className="min-w-0 flex-1">
              <ITFlex
                align="center"
                justify="center"
                className="h-11 w-11 shrink-0 rounded-2xl bg-blue-100 text-blue-600"
              >
                <FaPlus size={16} />
              </ITFlex>
              <ITFlex direction="column" gap={0.5} className="min-w-0">
                <ITText className="text-[12px] font-black uppercase tracking-widest text-blue-800">
                  Agregar más unidades
                </ITText>
                <ITText className="text-[10px] font-bold leading-5 text-slate-600">
                  Crea copias idénticas sin serie. Cada unidad recibirá su propio
                  folio de activo y podrá tener su carta responsiva.
                </ITText>
              </ITFlex>
            </ITFlex>
            <ITFlex align="end" gap={2}>
              <div className="w-24">
                <ITInput
                  name="addQty"
                  label="Cantidad"
                  type="number"
                  min={1}
                  value={String(fx.addQty)}
                  onChange={(e) =>
                    fx.setAddQty(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
              <ITButton
                variant="filled"
                color="primary"
                onClick={fx.handleAddUnits}
                disabled={fx.addingUnits}
              >
                <ITFlex align="center" gap={1}>
                  <FaPlus size={11} />
                  <ITText className="text-[11px] font-bold">
                    {fx.addingUnits ? "Agregando…" : `Agregar ${fx.addQty}`}
                  </ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITCard>
      )}

      {!isLoteEdit && (
        <>
          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
            <ITFlex align="center" gap={3} className="mb-5">
              <ITFlex
                align="center"
                justify="center"
                className="h-9 w-9 rounded-xl bg-slate-100 text-slate-500"
              >
                <FaBoxOpen size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0.25}>
                <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
                  Datos del dispositivo
                </ITText>
                <ITText className="text-[10px] text-slate-400">
                  Tipo, identificación y características principales
                </ITText>
              </ITFlex>
            </ITFlex>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12} md={isEdit ? 6 : 4}>
                <ITSelect
                  name="typeId"
                  label="Tipo"
                  options={fx.types.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.prefix})`,
                  }))}
                  value={fx.form.typeId}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, typeId: e.target.value }))
                  }
                  required
                  disabled={disabledAll}
                />
              </ITGrid>
              {!isEdit && (
                <ITGrid item xs={12} md={2}>
                  <ITInput
                    name="cantidad"
                    label="Cantidad"
                    type="number"
                    min={1}
                    max={500}
                    value={String(fx.cantidad)}
                    onChange={(e) => {
                      const n = Math.max(
                        1,
                        Math.min(500, Number(e.target.value) || 1)
                      );
                      fx.setCantidad(n);
                    }}
                  />
                </ITGrid>
              )}
              <ITGrid item xs={12}>
                <ITInput
                  name="desc"
                  label="Descripción"
                  value={fx.form.descripcion}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, descripcion: e.target.value }))
                  }
                  required
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="marca"
                  label="Marca"
                  value={fx.form.marca}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, marca: e.target.value }))
                  }
                  required
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="modelo"
                  label="Modelo"
                  value={fx.form.modelo}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, modelo: e.target.value }))
                  }
                  required
                  disabled={disabledAll}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="area"
                  label="Área"
                  value={fx.form.area}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, area: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </ITGrid>

              {isEdit && (
                <>
                  {showField("numeroSerie") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="serie"
                        label="No. Serie"
                        value={fx.editUnit.numeroSerie}
                        onChange={(e) =>
                          fx.setEditUnit((u) => ({
                            ...u,
                            numeroSerie: e.target.value,
                          }))
                        }
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                  {showField("nombreEquipo") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="eq"
                        label="Nombre del equipo"
                        value={fx.editUnit.nombreEquipo}
                        onChange={(e) =>
                          fx.setEditUnit((u) => ({
                            ...u,
                            nombreEquipo: e.target.value,
                          }))
                        }
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                </>
              )}

              {!isEdit && !isBatch && (
                <>
                  {showField("numeroSerie") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="serie"
                        label="No. Serie"
                        value={fx.units[0]?.numeroSerie ?? ""}
                        onChange={(e) =>
                          fx.handleUnitField(0, "numeroSerie", e.target.value)
                        }
                      />
                    </ITGrid>
                  )}
                  {showField("nombreEquipo") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="eq"
                        label="Nombre del equipo"
                        value={fx.units[0]?.nombreEquipo ?? ""}
                        onChange={(e) =>
                          fx.handleUnitField(0, "nombreEquipo", e.target.value)
                        }
                      />
                    </ITGrid>
                  )}
                </>
              )}

              {(showField("ip") || showField("macAddress")) && isEdit && (
                <>
                  {showField("ip") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="ip"
                        label="Dirección IP"
                        value={fx.editUnit.ip}
                        onChange={(e) =>
                          fx.setEditUnit((u) => ({ ...u, ip: e.target.value }))
                        }
                        placeholder="192.168.0.1"
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                  {showField("macAddress") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="mac"
                        label="MAC Address"
                        value={fx.editUnit.macAddress}
                        onChange={(e) =>
                          fx.setEditUnit((u) => ({
                            ...u,
                            macAddress: formatMacInput(e.target.value),
                          }))
                        }
                        placeholder="AA:BB:CC:DD:EE:FF"
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                </>
              )}

              {(showField("ip") || showField("macAddress")) && !isEdit && !isBatch && (
                <>
                  {showField("ip") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="ip"
                        label="Dirección IP"
                        value={fx.units[0]?.ip ?? ""}
                        onChange={(e) => fx.handleUnitField(0, "ip", e.target.value)}
                        placeholder="192.168.0.1"
                      />
                    </ITGrid>
                  )}
                  {showField("macAddress") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="mac"
                        label="MAC Address"
                        value={fx.units[0]?.macAddress ?? ""}
                        onChange={(e) =>
                          fx.handleUnitField(0, "macAddress", formatMacInput(e.target.value))
                        }
                        placeholder="AA:BB:CC:DD:EE:FF"
                      />
                    </ITGrid>
                  )}
                </>
              )}

              {showITSpecs && (
                <>
                  {showField("sistemaOp") && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="sistemaOp"
                        label="Sistema Operativo"
                        value={fx.form.sistemaOp}
                        onChange={(e) =>
                          fx.setForm((f) => ({ ...f, sistemaOp: e.target.value }))
                        }
                        placeholder="Android 13 / Windows 11"
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                  {showField("ram") && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="ram"
                        label="RAM"
                        value={fx.form.ram}
                        onChange={(e) =>
                          fx.setForm((f) => ({ ...f, ram: e.target.value }))
                        }
                        placeholder="4 GB"
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                  {showField("almacenamiento") && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="almacenamiento"
                        label="Almacenamiento"
                        value={fx.form.almacenamiento}
                        onChange={(e) =>
                          fx.setForm((f) => ({ ...f, almacenamiento: e.target.value }))
                        }
                        placeholder="64 GB"
                        disabled={disabledAll}
                      />
                    </ITGrid>
                  )}
                </>
              )}
            </ITGrid>
          </ITCard>

          {isBatch && (
            <>
              <ITCard className="p-5 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
                <ITFlex align="center" gap={2} className="mb-3">
                  <FaMagic size={13} className="text-slate-400" />
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Llenado rápido (opcional)
                  </ITText>
                </ITFlex>
                <ITGrid
                  container
                  columns={12}
                  spacing={3}
                  className="items-end"
                >
                  <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                    <ITInput
                      name="autoNombreBase"
                      label="Nombre de equipo (base)"
                      value={fx.autoNombreBase}
                      onChange={(e) => fx.setAutoNombreBase(e.target.value)}
                      placeholder="TABLET-AB"
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={showITSpecs ? 2 : 3}>
                    <ITInput
                      name="autoNombreStart"
                      label="Inicia en"
                      type="number"
                      min={1}
                      value={fx.autoNombreStart}
                      onChange={(e) => fx.setAutoNombreStart(e.target.value)}
                    />
                  </ITGrid>
                  {showITSpecs && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="autoIpBase"
                        label="IP inicial (autoincrementa)"
                        value={fx.autoIpBase}
                        onChange={(e) => fx.setAutoIpBase(e.target.value)}
                        placeholder="192.168.1.10"
                      />
                    </ITGrid>
                  )}
                </ITGrid>
                {(fx.autoNombreBase.trim() || fx.autoIpBase.trim()) && (
                  <ITText className="text-[10px] font-bold text-emerald-600 mt-2">
                    Se está autocompletando cada unidad conforme escribes — no hace
                    falta aplicar nada.
                  </ITText>
                )}
              </ITCard>

              <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
                <ITFlex align="center" gap={2} className="mb-4">
                  <FaBoxes size={14} className="text-slate-400" />
                  <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Unidades ({fx.cantidad}) — captura serie
                    {showITSpecs ? ", IP y MAC" : ""} de cada equipo
                  </ITText>
                </ITFlex>

                <ITFlex direction="column" gap={3}>
                  {fx.units.slice(0, fx.cantidad).map((u, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <ITFlex justify="between" align="center" className="mb-2">
                        <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Unidad {idx + 1} de {fx.cantidad}
                        </ITText>
                        {fx.cantidad > 1 && (
                          <ITButton
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => fx.removeUnitRow(idx)}
                            title="Quitar esta unidad"
                          >
                            <FaTrash size={11} />
                          </ITButton>
                        )}
                      </ITFlex>
                      <ITGrid container columns={12} spacing={3}>
                        {showField("numeroSerie") && (
                          <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                            <ITInput
                              name={`serie-${idx}`}
                              label="No. Serie"
                              value={u.numeroSerie}
                              onChange={(e) =>
                                fx.handleUnitField(idx, "numeroSerie", e.target.value)
                              }
                            />
                          </ITGrid>
                        )}
                        {showField("nombreEquipo") && (
                          <ITGrid item xs={12} md={showITSpecs ? 4 : 6}>
                            <ITInput
                              name={`eq-${idx}`}
                              label="Nombre del equipo"
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
                              <ITGrid item xs={12} md={2}>
                                <ITInput
                                  name={`ip-${idx}`}
                                  label="IP"
                                  value={u.ip}
                                  onChange={(e) =>
                                    fx.handleUnitField(idx, "ip", e.target.value)
                                  }
                                  placeholder="192.168.0.1"
                                />
                              </ITGrid>
                            )}
                            {showField("macAddress") && (
                              <ITGrid item xs={12} md={2}>
                                <ITInput
                                  name={`mac-${idx}`}
                                  label="MAC"
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
              </ITCard>
            </>
          )}
        </>
      )}

      {isLoteEdit && (
        <>
          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px] mb-6">
            <ITFlex align="center" gap={2} className="mb-4">
              <FaLayerGroup size={13} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Datos compartidos del lote
              </ITText>
            </ITFlex>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12}>
                <ITInput
                  name="desc"
                  label="Descripción"
                  value={fx.form.descripcion}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, descripcion: e.target.value }))
                  }
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="marca"
                  label="Marca"
                  value={fx.form.marca}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, marca: e.target.value }))
                  }
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="modelo"
                  label="Modelo"
                  value={fx.form.modelo}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, modelo: e.target.value }))
                  }
                  required
                />
              </ITGrid>
              {showITSpecs && (
                <>
                  {showField("sistemaOp") && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="sistemaOp"
                        label="Sistema Operativo"
                        value={fx.form.sistemaOp}
                        onChange={(e) =>
                          fx.setForm((f) => ({ ...f, sistemaOp: e.target.value }))
                        }
                        placeholder="Android 14 / Windows 11"
                      />
                    </ITGrid>
                  )}
                  {showField("ram") && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="ram"
                        label="RAM"
                        value={fx.form.ram}
                        onChange={(e) =>
                          fx.setForm((f) => ({ ...f, ram: e.target.value }))
                        }
                        placeholder="4 GB"
                      />
                    </ITGrid>
                  )}
                  {showField("almacenamiento") && (
                    <ITGrid item xs={12} md={4}>
                      <ITInput
                        name="almacenamiento"
                        label="Almacenamiento"
                        value={fx.form.almacenamiento}
                        onChange={(e) =>
                          fx.setForm((f) => ({
                            ...f,
                            almacenamiento: e.target.value,
                          }))
                        }
                        placeholder="64 GB"
                      />
                    </ITGrid>
                  )}
                </>
              )}
            </ITGrid>
          </ITCard>

          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
            <ITFlex align="center" gap={2} className="mb-4">
              <FaBoxes size={14} className="text-slate-400" />
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Unidades ({fx.loteRows.length})
              </ITText>
            </ITFlex>

            {fx.loteLoading ? (
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
                        {locked && (
                          <ITFlex align="center" gap={1}>
                            <FaLock size={10} className="text-amber-600" />
                            <ITText className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                              Asignado — protegido
                            </ITText>
                          </ITFlex>
                        )}
                      </ITFlex>
                      <ITGrid container columns={12} spacing={3}>
                        {showField("numeroSerie") && (
                          <ITGrid item xs={12} md={showITSpecs ? 3 : 4}>
                            <ITInput
                              name={`lote-serie-${idx}`}
                              label="No. Serie"
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
                          <ITGrid item xs={12} md={showITSpecs ? 3 : 4}>
                            <ITInput
                              name={`lote-eq-${idx}`}
                              label="Nombre del equipo"
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
                              <ITGrid item xs={12} md={3}>
                                <ITInput
                                  name={`lote-ip-${idx}`}
                                  label="IP"
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
                              <ITGrid item xs={12} md={3}>
                                <ITInput
                                  name={`lote-mac-${idx}`}
                                  label="MAC Address"
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
                        <ITGrid item xs={12} md={showITSpecs ? 12 : 4}>
                          <ITInput
                            name={`lote-area-${idx}`}
                            label="Área"
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
            )}
          </ITCard>
        </>
      )}
    </>
  );
}