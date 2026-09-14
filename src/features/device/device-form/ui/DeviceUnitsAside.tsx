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
import {
  FaBoxes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMacInput } from "@shared/utils/itDevice";
import type { UseDeviceForm } from "../model/useDeviceForm";

interface Props {
  fx: UseDeviceForm;
}

export default function DeviceUnitsAside({ fx }: Props) {
  const { t: tt } = useTranslation(["device", "common"]);
  const { isBatch, isLoteEdit, showField, showITSpecs } = fx;

  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) =>
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const isOpen = (idx: number) => !collapsed[idx];

  if (!isBatch && !isLoteEdit) return null;

  const chevronBtn = (idx: number) => (
    <ITButton
      variant="outlined"
      size="small"
      color="secondary"
      onClick={() => toggle(idx)}
      title={tt(isOpen(idx) ? "form.collapseUnit" : "form.expandUnit")}
      className="!min-w-7 !w-7 !h-7 !p-0 flex items-center justify-center"
    >
      {isOpen(idx) ? <FaChevronUp  /> : <FaChevronDown />}
    </ITButton>
  );

  const FieldStatus = ({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) => {
    const has = !!value?.trim();

    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          has
            ? "border-emerald-200 text-emerald-600 bg-emerald-50"
            : "border-rose-200 text-rose-500 bg-rose-50"
        }`}
      >
        {has ? <FaCheck size={7} /> : <FaTimes size={8} />}
        {label}
      </span>
    );
  };

  return (
    <div className="w-full min-w-0 bg-white rounded-xl shadow-lg shadow-slate-200/30 border border-slate-100 p-2.5 md:sticky md:top-24">
      {/* Header */}
      <ITFlex align="center" gap={1.5} className="mb-2">
        <FaBoxes size={12} className="text-slate-400 shrink-0" />

        <ITText className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate">
          {isBatch
            ? tt("form.unitsHeader", {
                count: fx.cantidad,
                specs: showITSpecs ? tt("form.unitsHeaderSpecs") : "",
              })
            : tt("form.loteUnits", {
                count: fx.loteRows.length,
              })}
        </ITText>
      </ITFlex>

      <div className="max-h-[calc(100vh-190px)] overflow-y-auto pr-0.5">
        {/* BATCH */}
        {isBatch && (
          <ITFlex direction="column" gap={1.5}>
            {fx.units.slice(0, fx.cantidad).map((u, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-100 bg-slate-50/60 p-2"
              >
                {/* Unit header */}
                <ITFlex
                  justify="between"
                  align="center"
                  className="mb-1"
                >
                  <ITText className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    {tt("form.unitOf", {
                      current: idx + 1,
                      total: fx.cantidad,
                    })}
                  </ITText>

                  <ITFlex align="center" gap={0.5}>
                    {fx.cantidad > 1 && (
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => fx.removeUnitRow(idx)}
                        title={tt("form.removeUnit")}
                        className="!min-w-7 !w-7 !h-7 !p-0"
                      >
                        <FaTrash />
                      </ITButton>
                    )}

                    {chevronBtn(idx)}
                  </ITFlex>
                </ITFlex>

                {/* Collapsed summary */}
                {!isOpen(idx) && (
                  <ITFlex gap={1} wrap="wrap">
                    <FieldStatus
                      label={tt("form.serialNo")}
                      value={u.numeroSerie}
                    />
                    <FieldStatus
                      label={tt("form.equipmentName")}
                      value={u.nombreEquipo}
                    />
                  </ITFlex>
                )}

                {/* Expanded */}
                {isOpen(idx) && (
                  <ITGrid container columns={12} spacing={1.5}>
                    {showField("numeroSerie") && (
                      <ITGrid
                        item
                        xs={12}
                        md={showITSpecs ? 12 : 6}
                      >
                        <ITInput
                          name={`serie-${idx}`}
                          label={tt("form.serialNo")}
                          value={u.numeroSerie}
                          onChange={(e) =>
                            fx.handleUnitField(
                              idx,
                              "numeroSerie",
                              e.target.value
                            )
                          }
                        />
                      </ITGrid>
                    )}

                    {showField("nombreEquipo") && (
                      <ITGrid
                        item
                        xs={12}
                        md={showITSpecs ? 12 : 6}
                      >
                        <ITInput
                          name={`eq-${idx}`}
                          label={tt("form.equipmentName")}
                          value={u.nombreEquipo}
                          onChange={(e) =>
                            fx.handleUnitField(
                              idx,
                              "nombreEquipo",
                              e.target.value
                            )
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
                                fx.handleUnitField(
                                  idx,
                                  "ip",
                                  e.target.value
                                )
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
                )}
              </div>
            ))}
          </ITFlex>
        )}

        {/* LOTE EDIT */}
        {isLoteEdit &&
          (fx.loteLoading ? (
            <ITFlex
              justify="center"
              align="center"
              className="py-5"
            >
              <ITLoader
                variant="spinner"
                size="md"
                color="primary"
              />
            </ITFlex>
          ) : (
            <ITFlex direction="column" gap={1.5}>
              {fx.loteRows.map((r, idx) => {
                const locked = r.estado === "ASIGNADO";

                return (
                  <div
                    key={r.id}
                    className={`rounded-lg border p-2 ${
                      locked
                        ? "border-amber-200 bg-amber-50/40"
                        : "border-slate-100 bg-slate-50/60"
                    }`}
                  >
                    {/* Header */}
                    <ITFlex
                      justify="between"
                      align="center"
                      className="mb-1"
                    >
                      <ITFlex align="center" gap={1}>
                        <ITText className="text-[10px] font-black text-slate-800">
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
                          className="uppercase text-[9px] font-bold tracking-wide"
                        >
                          {r.estado}
                        </ITBadget>
                      </ITFlex>

                      <ITFlex align="center" gap={0.5}>
                        {locked ? (
                          <ITFlex align="center" gap={0.5}>
                            <FaLock
                              size={8}
                              className="text-amber-600"
                            />

                            <ITText className="text-[8px] font-black uppercase tracking-wide text-amber-600">
                              {tt("form.assignedProtected")}
                            </ITText>
                          </ITFlex>
                        ) : (
                          fx.loteRows.length > 1 && (
                            <ITButton
                              variant="outlined"
                              size="small"
                              color="secondary"
                              onClick={() =>
                                fx.requestRemoveLoteUnit(r)
                              }
                              title={tt("form.removeUnit")}
                              className="!min-w-7 !w-7 !h-7 !p-0 flex items-center justify-center"
                            >
                              <FaTrash />
                            </ITButton>
                          )
                        )}

                        {chevronBtn(idx)}
                      </ITFlex>
                    </ITFlex>

                    {/* Collapsed */}
                    {!isOpen(idx) && (
                      <ITFlex gap={1} wrap="wrap">
                        <FieldStatus
                          label={tt("form.serialNo")}
                          value={r.numeroSerie}
                        />
                        <FieldStatus
                          label={tt("form.equipmentName")}
                          value={r.nombreEquipo}
                        />
                      </ITFlex>
                    )}

                    {/* Expanded */}
                    {isOpen(idx) && (
                      <ITGrid container columns={12} spacing={1.5}>
                        {showField("numeroSerie") && (
                          <ITGrid
                            item
                            xs={12}
                            md={showITSpecs ? 12 : 6}
                          >
                            <ITInput
                              name={`lote-serie-${idx}`}
                              label={tt("form.serialNo")}
                              value={r.numeroSerie}
                              onChange={(e) =>
                                fx.setLoteRows((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? {
                                          ...x,
                                          numeroSerie:
                                            e.target.value,
                                        }
                                      : x
                                  )
                                )
                              }
                              disabled={locked}
                            />
                          </ITGrid>
                        )}

                        {showField("nombreEquipo") && (
                          <ITGrid
                            item
                            xs={12}
                            md={showITSpecs ? 12 : 6}
                          >
                            <ITInput
                              name={`lote-eq-${idx}`}
                              label={tt("form.equipmentName")}
                              value={r.nombreEquipo}
                              onChange={(e) =>
                                fx.setLoteRows((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? {
                                          ...x,
                                          nombreEquipo:
                                            e.target.value,
                                        }
                                      : x
                                  )
                                )
                              }
                              disabled={locked}
                            />
                          </ITGrid>
                        )}

                        {(showField("ip") ||
                          showField("macAddress")) && (
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
                                        i === idx
                                          ? {
                                              ...x,
                                              ip: e.target.value,
                                            }
                                          : x
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
                                              macAddress:
                                                formatMacInput(
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
                                  i === idx
                                    ? {
                                        ...x,
                                        area: e.target.value,
                                      }
                                    : x
                                )
                              )
                            }
                            disabled={locked}
                          />
                        </ITGrid>
                      </ITGrid>
                    )}
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