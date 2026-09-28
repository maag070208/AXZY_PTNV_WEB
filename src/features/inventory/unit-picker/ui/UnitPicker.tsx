import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITAlert, ITButton, ITCheckbox, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import type { DeviceUnit } from "@entities/inventory";

interface Props {
  units: DeviceUnit[];
  selected: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  error?: string | null;
  /** Unidades que ya están en la carta que se edita (se marcan como tales). */
  currentIds?: readonly string[];
}

const matches = (u: DeviceUnit, term: string) =>
  [u.assetTag, u.serialNumber, u.hostname].some((v) => v?.toLowerCase().includes(term));

/**
 * Selección de las piezas exactas que se entregan en una carta responsiva.
 * Muestra activo fijo, número de serie y nombre de equipo de cada unidad.
 */
export default function UnitPicker({ units, selected, onChange, loading, error, currentIds = [] }: Props) {
  const { t } = useTranslation(["inventory"]);
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const current = useMemo(() => new Set(currentIds), [currentIds]);
  const term = search.trim().toLowerCase();
  const visible = useMemo(() => (term ? units.filter((u) => matches(u, term)) : units), [units, term]);

  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? [...selected, id] : selected.filter((x) => x !== id));
  const selectVisible = () => onChange([...new Set([...selected, ...visible.map((u) => u.id)])]);

  return (
    <ITFlex direction="column" gap={2}>
      <ITFlex align="center" justify="between" gap={2} wrap="wrap">
        <ITText className="text-sm font-semibold text-slate-700">{t("units.title")}</ITText>
        <ITText className="text-xs text-slate-500">
          {t("units.selected", { count: selected.length, total: units.length })}
        </ITText>
      </ITFlex>
      <ITText className="text-[11px] text-slate-500">{t("units.hint")}</ITText>

      {error && <ITAlert variant="error">{error}</ITAlert>}

      {units.length > 5 && (
        <ITInput name="unitSearch" label={t("units.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      )}

      {units.length > 1 && (
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={selectVisible} disabled={visible.length === 0}>
            <ITText className="text-[11px] font-bold">{t("units.selectAll")}</ITText>
          </ITButton>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => onChange([])} disabled={selected.length === 0}>
            <ITText className="text-[11px] font-bold">{t("units.clear")}</ITText>
          </ITButton>
        </ITFlex>
      )}

      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
        {loading ? (
          <ITText className="block p-4 text-xs text-slate-400">…</ITText>
        ) : units.length === 0 ? (
          <ITText className="block p-4 text-xs text-slate-500">{t("units.empty")}</ITText>
        ) : visible.length === 0 ? (
          <ITText className="block p-4 text-xs text-slate-500">{t("units.noMatch")}</ITText>
        ) : (
          visible.map((u) => (
            <div
              key={u.id}
              data-testid="unit-option"
              onClick={() => toggle(u.id, !selectedSet.has(u.id))}
              className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0 ${
                selectedSet.has(u.id) ? "bg-blue-50/60" : "hover:bg-slate-50"
              }`}
            >
              {/* El checkbox tiene su propio label: su clic no debe volver a llegar a la fila. */}
              <span onClick={(e) => e.stopPropagation()}>
                <ITCheckbox
                  name={`unit-${u.id}`}
                  checked={selectedSet.has(u.id)}
                  onChange={(checked) => toggle(u.id, checked)}
                  label={<span className="sr-only">{u.assetTag}</span>}
                />
              </span>
              <ITFlex direction="column" className="min-w-0">
                <ITFlex align="center" gap={2}>
                  <ITText className="text-[12px] font-bold text-slate-800">{u.assetTag}</ITText>
                  {current.has(u.id) && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{t("units.inThisLoan")}</span>
                  )}
                </ITFlex>
                <ITText className={`text-[11px] ${u.serialNumber ? "text-slate-600" : "italic text-slate-400"}`}>
                  {u.serialNumber ? t("units.serial", { value: u.serialNumber }) : t("units.noSerial")}
                  {u.hostname ? ` · ${t("units.hostname", { value: u.hostname })}` : ""}
                </ITText>
              </ITFlex>
            </div>
          ))
        )}
      </div>
    </ITFlex>
  );
}
