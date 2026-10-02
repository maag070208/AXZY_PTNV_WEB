import { useState } from "react";
import { ITBadget, ITFlex, ITGrid, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaCheck, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { DeviceType } from "@entities/inventory";
import { usesUnitIdentity, type UnitIdentityRow } from "../model/unit-identity";

interface Props {
  /** Tipo del dispositivo: decide qué campos se piden (los demás no se muestran). */
  type?: DeviceType | null;
  units: UnitIdentityRow[];
  onChange: (id: number, field: keyof UnitIdentityRow, value: string) => void;
  /** Encabezado de cada renglón: "Unidad 1" (alta) o "Pieza 1" (entrada). */
  label: (index: number) => string;
  /** Cuántos renglones empezar abiertos (los demás colapsados). */
  openFirst?: number;
}

/**
 * Captura de la identificación de cada pieza (serie, MAC, IP, hostname),
 * opcional y por pieza: es el MISMO editor en el alta de un dispositivo y en la
 * entrada de piezas nuevas, para que la serie se capture igual por los dos
 * caminos y no haya dos formatos.
 *
 * Cada renglón es un acordeón: con 30 piezas la pantalla no se vuelve un muro de
 * campos, y el que ya tiene datos se marca con un check y muestra su serie.
 */
export default function UnitIdentityEditor({ type, units, onChange, label, openFirst = 0 }: Props) {
  const { t } = useTranslation("inventory");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  if (!type || !usesUnitIdentity(type) || units.length === 0) return null;

  const isOpen = (id: number, index: number): boolean =>
    allExpanded || (expanded[id] ?? index < openFirst);

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpanded({});
  };

  return (
    <ITFlex direction="column" gap={2}>
      <ITFlex justify="end">
        <button type="button" onClick={toggleAll} className="cursor-pointer">
          <ITText className="text-[10px] font-bold uppercase text-[#1e3a5f]">
            {allExpanded ? t("devices.collapseAll") : t("devices.expandAll")}
          </ITText>
        </button>
      </ITFlex>

      {units.map((unit, index) => {
        const open = isOpen(unit.id, index);
        const filled = !!(unit.serialNumber || unit.macAddress || unit.ip || unit.hostname);
        return (
          <ITFlex key={unit.id} direction="column" className="rounded-xl border border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={() => {
                setExpanded((prev) => ({ ...prev, [unit.id]: !open }));
                setAllExpanded(false);
              }}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
            >
              <ITFlex align="center" gap={2} className="min-w-0">
                {open ? (
                  <FaChevronDown className="shrink-0 text-slate-400" size={11} />
                ) : (
                  <FaChevronRight className="shrink-0 text-slate-400" size={11} />
                )}
                <ITText className="truncate text-[11px] font-bold uppercase tracking-tight text-slate-700">
                  {label(index)}
                </ITText>
                {filled && <FaCheck className="shrink-0 text-emerald-500" size={11} />}
              </ITFlex>
              <ITBadget color="gray" size="lg">
                {unit.serialNumber || "—"}
              </ITBadget>
            </button>

            {open && (
              <ITFlex direction="column" gap={2} className="border-t border-slate-100 px-3 pb-3 pt-2.5">
                {type.useSerialNumber && (
                  <ITInput
                    name={`serialNumber-${unit.id}`}
                    label={t("devices.serialNumber")}
                    value={unit.serialNumber}
                    onChange={(e) => onChange(unit.id, "serialNumber", e.target.value)}
                  />
                )}
                {(type.useMac || type.useIp) && (
                  <ITGrid container columns={2} spacing={2}>
                    {type.useMac && (
                      <ITGrid item xs={type.useIp ? 6 : 12}>
                        <ITInput
                          name={`mac-${unit.id}`}
                          label={t("devices.mac")}
                          value={unit.macAddress}
                          onChange={(e) => onChange(unit.id, "macAddress", e.target.value)}
                        />
                      </ITGrid>
                    )}
                    {type.useIp && (
                      <ITGrid item xs={type.useMac ? 6 : 12}>
                        <ITInput
                          name={`ip-${unit.id}`}
                          label={t("devices.ip")}
                          value={unit.ip}
                          onChange={(e) => onChange(unit.id, "ip", e.target.value)}
                        />
                      </ITGrid>
                    )}
                  </ITGrid>
                )}
                {type.useHostname && (
                  <ITInput
                    name={`hostname-${unit.id}`}
                    label={t("devices.hostname")}
                    value={unit.hostname}
                    onChange={(e) => onChange(unit.id, "hostname", e.target.value)}
                  />
                )}
              </ITFlex>
            )}
          </ITFlex>
        );
      })}
    </ITFlex>
  );
}
