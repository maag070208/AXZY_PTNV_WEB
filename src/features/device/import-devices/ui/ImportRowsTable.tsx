import { ITButton, ITCard, ITFlex, ITInput, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaTrash, FaUpload } from "react-icons/fa";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { DeviceFieldKey } from "@entities/device-type";
import {
  SHARED_FIELDS,
  UNIT_FIELDS,
  type UseDeviceImport,
} from "../model/useDeviceImport";

export default function ImportRowsTable({ fx }: { fx: UseDeviceImport }) {
  const { t: tt } = useTranslation(["device"]);
  return (
    <>
      <ITCard className="p-4 mb-4 border border-slate-100 rounded-2xl bg-slate-50/60">
        <ITFlex justify="between" align="end" gap={4} wrap="wrap">
          <ITText className="text-[11px] font-bold text-slate-500">
            {tt("import.rowsSummary", {
              count: fx.rows.length,
              valid: fx.validCount,
              units: fx.unitTotal,
            })}
          </ITText>
          <ITButton
            variant="filled"
            color="primary"
            onClick={fx.handleConfirm}
            disabled={
              fx.committing ||
              fx.validCount === 0 ||
              fx.deviceTypes.length === 0
            }
          >
            <ITFlex align="center" gap={1}>
              <FaUpload size={12} />
              <ITText className="text-[11px] font-bold">
                {fx.committing
                  ? tt("import.loading", {
                      done: fx.progress?.done ?? 0,
                      total: fx.progress?.total ?? 0,
                    })
                  : tt("import.confirming", { count: fx.validCount })}
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITCard>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              <th className="px-3 py-3 w-12">#</th>
              <th className="px-3 py-3 min-w-[180px]">{tt("import.thTipo")}</th>
              <th className="px-3 py-3">{tt("import.thModelo")}</th>
              <th className="px-3 py-3 min-w-[260px]">{tt("import.thDescripcion")}</th>
              <th className="px-3 py-3 w-24">{tt("import.thCantidad")}</th>
              <th className="px-3 py-3 w-44">{tt("import.thMarca")}</th>
              <th className="px-3 py-3 w-24">{tt("import.thEstado")}</th>
              <th className="px-3 py-3 w-14" />
            </tr>
          </thead>
          <tbody>
            {fx.rows.map((r, index) => {
              const valid = fx.isRowValid(r);
              return (
                <Fragment key={r.key}>
                  <tr
                    className={`border-t border-slate-100 ${valid ? "" : "bg-amber-50/50"}`}
                  >
                    <td className="px-3 py-2 text-[11px] font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2">
                      <ITSelect
                        name={`tipo-${r.key}`}
                        aria-label={tt("import.ariaTipo")}
                        options={fx.deviceTypes.map((t) => ({
                          value: t.id,
                          label: `${t.code} · ${t.name}`,
                        }))}
                        value={r.typeId}
                        onChange={(e) =>
                          fx.updateRow(r.key, { typeId: e.target.value })
                        }
                        disabled={fx.committing}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <ITInput
                        name={`modelo-${r.key}`}
                        aria-label={tt("import.ariaModelo")}
                        value={r.modelo}
                        onChange={(e) =>
                          fx.updateRow(r.key, { modelo: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <ITInput
                        name={`descripcion-${r.key}`}
                        aria-label={tt("import.ariaDescripcion")}
                        value={r.descripcion}
                        onChange={(e) =>
                          fx.updateRow(r.key, { descripcion: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <ITInput
                        name={`cant-${r.key}`}
                        aria-label={tt("import.ariaCantidad")}
                        type="number"
                        min={1}
                        max={500}
                        value={r.cantidad}
                        onChange={(e) =>
                          fx.updateRow(r.key, { cantidad: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <ITInput
                        name={`marca-${r.key}`}
                        aria-label={tt("import.ariaMarca")}
                        value={r.marca}
                        onChange={(e) =>
                          fx.updateRow(r.key, { marca: e.target.value })
                        }
                        placeholder="Logitech"
                      />
                    </td>
                    <td
                      className={`px-3 py-2 text-[10px] font-bold ${valid ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {valid ? tt("import.statusReady") : tt("import.statusIncomplete")}
                    </td>
                    <td className="px-2 py-2">
                      <ITButton
                        variant="outlined"
                        size="small"
                        color="danger"
                        onClick={() => fx.removeRow(r.key)}
                        title={tt("import.removeRowTitle")}
                      >
                        <FaTrash size={11} />
                      </ITButton>
                    </td>
                  </tr>
                  {(
                    [...UNIT_FIELDS, ...SHARED_FIELDS] as DeviceFieldKey[]
                  ).some((field) => fx.fieldEnabled(r, field)) && (
                    <tr className="border-t border-slate-100 bg-slate-50/70">
                      <td colSpan={8} className="px-5 py-3">
                        <ITText className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {tt("import.configurable", {
                            modelo: r.modelo || tt("import.sinModelo"),
                          })}
                        </ITText>
                        {SHARED_FIELDS.some((field) =>
                          fx.fieldEnabled(r, field)
                        ) && (
                          <ITFlex gap={3} wrap="wrap" className="mb-3">
                            {fx.fieldEnabled(r, "sistemaOp") && (
                              <div className="w-full md:w-56">
                                <ITInput
                                  name={`so-${r.key}`}
                                  label={tt("import.labelSistemaOp")}
                                  value={r.sistemaOp}
                                  onChange={(e) =>
                                    fx.updateRow(r.key, {
                                      sistemaOp: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}
                            {fx.fieldEnabled(r, "ram") && (
                              <div className="w-full md:w-40">
                                <ITInput
                                  name={`ram-${r.key}`}
                                  label={tt("import.labelRam")}
                                  value={r.ram}
                                  onChange={(e) =>
                                    fx.updateRow(r.key, {
                                      ram: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}
                            {fx.fieldEnabled(r, "almacenamiento") && (
                              <div className="w-full md:w-56">
                                <ITInput
                                  name={`storage-${r.key}`}
                                  label={tt("import.labelAlmacenamiento")}
                                  value={r.almacenamiento}
                                  onChange={(e) =>
                                    fx.updateRow(r.key, {
                                      almacenamiento: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}
                          </ITFlex>
                        )}
                        {UNIT_FIELDS.some((field) =>
                          fx.fieldEnabled(r, field)
                        ) && (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full min-w-[650px] border-collapse text-left">
                              <thead className="bg-slate-50">
                                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  <th className="px-3 py-2 w-12">#</th>
                                  {fx.fieldEnabled(r, "numeroSerie") && (
                                    <th className="px-3 py-2">
                                      {tt("import.thNumeroSerie")}
                                    </th>
                                  )}
                                  {fx.fieldEnabled(r, "ip") && (
                                    <th className="px-3 py-2">{tt("import.thIp")}</th>
                                  )}
                                  {fx.fieldEnabled(r, "macAddress") && (
                                    <th className="px-3 py-2">{tt("import.thMac")}</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {r.units.map((unit, unitIndex) => (
                                  <tr
                                    key={unitIndex}
                                    className="border-t border-slate-100"
                                  >
                                    <td className="px-3 py-2 text-[10px] font-bold text-slate-400">
                                      {unitIndex + 1}
                                    </td>
                                    {fx.fieldEnabled(r, "numeroSerie") && (
                                      <td className="px-2 py-2">
                                        <ITInput
                                          name={`serie-${r.key}-${unitIndex}`}
                                          aria-label={`${tt("import.thNumeroSerie")} ${unitIndex + 1}`}
                                          value={unit.numeroSerie}
                                          onChange={(e) =>
                                            fx.updateUnit(r.key, unitIndex, {
                                              numeroSerie: e.target.value,
                                            })
                                          }
                                        />
                                      </td>
                                    )}
                                    {fx.fieldEnabled(r, "ip") && (
                                      <td className="px-2 py-2">
                                        <ITInput
                                          name={`ip-${r.key}-${unitIndex}`}
                                          aria-label={`${tt("import.thIp")} ${unitIndex + 1}`}
                                          value={unit.ip}
                                          onChange={(e) =>
                                            fx.updateUnit(r.key, unitIndex, {
                                              ip: e.target.value,
                                            })
                                          }
                                          placeholder="192.168.1.10"
                                        />
                                      </td>
                                    )}
                                    {fx.fieldEnabled(r, "macAddress") && (
                                      <td className="px-2 py-2">
                                        <ITInput
                                          name={`mac-${r.key}-${unitIndex}`}
                                          aria-label={`${tt("import.thMac")} ${unitIndex + 1}`}
                                          value={unit.macAddress}
                                          onChange={(e) =>
                                            fx.updateUnit(r.key, unitIndex, {
                                              macAddress: e.target.value,
                                            })
                                          }
                                          placeholder="AA:BB:CC:DD:EE:FF"
                                        />
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}