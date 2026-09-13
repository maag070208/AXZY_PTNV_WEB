import {
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaLayerGroup, FaMagic, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatMacInput } from "@shared/utils/itDevice";
import { formatLocation } from "@entities/location";
import type { UseDeviceForm } from "../model/useDeviceForm";

interface Props {
  fx: UseDeviceForm;
}

export default function DeviceFormBody({ fx }: Props) {
  const { t: tt } = useTranslation(["device", "common"]);
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
                  {tt("form.addUnits")}
                </ITText>
                <ITText className="text-[10px] font-bold leading-5 text-slate-600">
                  {tt("form.addUnitsHint")}
                </ITText>
              </ITFlex>
            </ITFlex>
            <ITFlex align="end" gap={2}>
              <div className="w-24">
                <ITInput
                  name="addQty"
                  label={tt("form.quantity")}
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
                    {fx.addingUnits ? tt("form.adding") : tt("form.add", { count: fx.addQty })}
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
                  {tt("form.deviceData")}
                </ITText>
                <ITText className="text-[10px] text-slate-400">
                  {tt("form.deviceDataHint")}
                </ITText>
              </ITFlex>
            </ITFlex>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12} md={isEdit ? 6 : 4}>
                <ITSelect
                  name="typeId"
                  label={tt("form.type")}
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
                    label={tt("form.quantity")}
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
                  label={tt("form.description")}
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
                  label={tt("form.brand")}
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
                  label={tt("form.model")}
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
                  label={tt("form.area")}
                  value={fx.form.area}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, area: e.target.value }))
                  }
                  disabled={disabledAll}
                />
              </ITGrid>

              {!isBatch && (
                <ITGrid item xs={12} md={6}>
                  <ITSelect
                    name="locationId"
                    label={tt("form.location")}
                    options={fx.locations.map((l) => ({
                      value: l.id,
                      label: formatLocation(l),
                    }))}
                    value={fx.form.locationId}
                    onChange={(e) =>
                      fx.setForm((f) => ({ ...f, locationId: e.target.value }))
                    }
                    placeholder={tt("form.locationPlaceholder")}
                    disabled={disabledAll}
                  />
                </ITGrid>
              )}

              {isEdit && (
                <>
                  {showField("numeroSerie") && (
                    <ITGrid item xs={12} md={6}>
                      <ITInput
                        name="serie"
                        label={tt("form.serialNo")}
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
                        label={tt("form.equipmentName")}
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
                        label={tt("form.serialNo")}
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
                        label={tt("form.equipmentName")}
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
                        label={tt("form.ipAddress")}
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
                        label={tt("form.macAddress")}
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
                        label={tt("form.ipAddress")}
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
                        label={tt("form.macAddress")}
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
                        label={tt("form.os")}
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
                        label={tt("form.ram")}
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
                        label={tt("form.storage")}
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
                    {tt("form.quickFill")}
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
                      label={tt("form.autoNameBase")}
                      value={fx.autoNombreBase}
                      onChange={(e) => fx.setAutoNombreBase(e.target.value)}
                      placeholder="TABLET-AB"
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={showITSpecs ? 2 : 3}>
                    <ITInput
                      name="autoNombreStart"
                      label={tt("form.autoNameStart")}
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
                        label={tt("form.autoIpBase")}
                        value={fx.autoIpBase}
                        onChange={(e) => fx.setAutoIpBase(e.target.value)}
                        placeholder="192.168.1.10"
                      />
                    </ITGrid>
                  )}
                </ITGrid>
                {(fx.autoNombreBase.trim() || fx.autoIpBase.trim()) && (
                  <ITText className="text-[10px] font-bold text-emerald-600 mt-2">
                    {tt("form.autoIndicator")}
                  </ITText>
                )}
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
                {tt("form.loteShared")}
              </ITText>
            </ITFlex>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12} md={6}>
                <ITSelect
                  name="typeId"
                  label={tt("form.type")}
                  options={fx.types.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.prefix})`,
                  }))}
                  value={fx.form.typeId}
                  onChange={(e) =>
                    fx.setForm((f) => ({ ...f, typeId: e.target.value }))
                  }
                  required
                  disabled={fx.loteHasAssigned}
                />
                <ITText className="text-[10px] text-slate-400 mt-1">
                  {fx.loteHasAssigned
                    ? tt("form.typeChangeBlockedByAssigned")
                    : tt("form.editDescription")}
                </ITText>
              </ITGrid>
              <ITGrid item xs={12}>
                <ITInput
                  name="desc"
                  label={tt("form.description")}
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
                  label={tt("form.brand")}
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
                  label={tt("form.model")}
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
                        label={tt("form.os")}
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
                        label={tt("form.ram")}
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
                        label={tt("form.storage")}
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
        </>
      )}
    </>
  );
}