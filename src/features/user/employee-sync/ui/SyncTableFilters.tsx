import { FaSearch } from "react-icons/fa";
import { ITButton, ITCard, ITFlex, ITInput, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";

/** Un selector de la barra de filtros (todos largos: con búsqueda). */
export interface SyncFilterSelect {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

interface Props {
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  selects?: SyncFilterSelect[];
  /** Hay al menos un filtro activo: muestra "Limpiar". */
  hasFilters: boolean;
  onClear: () => void;
}

/**
 * Barra de filtros de las tablas del paso de revisión: búsqueda general y
 * selectores con búsqueda (departamento, estado, horario…). Filtra en cliente;
 * la tabla conserva sus encabezados ordenables.
 */
export default function SyncTableFilters({
  search,
  onSearch,
  searchPlaceholder,
  selects = [],
  hasFilters,
  onClear,
}: Props) {
  const { t } = useTranslation("employees");

  return (
    <ITCard className="bento-rise" contentClassName="!px-4 !py-3">
      <ITFlex align="end" wrap="wrap" gap={3}>
        <ITFlex className="min-w-[220px] flex-1">
          <ITInput
            name="sync-filter-search"
            label={t("sync.filters.search")}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            iconLeft={<FaSearch size={11} />}
            className="w-full min-w-0"
          />
        </ITFlex>
        {selects.map((select) => (
          <ITFlex key={select.key} className="min-w-[170px] flex-1">
            <ITSearchSelect
              name={`sync-filter-${select.key}`}
              label={select.label}
              options={select.options}
              value={select.value}
              onChange={(value) => select.onChange(String(value))}
              className="w-full min-w-0"
            />
          </ITFlex>
        ))}
        {hasFilters && (
          <ITFlex align="center" className="shrink-0">
            <ITButton variant="outlined" color="gray" size="sm" onClick={onClear}>
              <ITText className="!text-[11px] font-bold">{t("sync.filters.clear")}</ITText>
            </ITButton>
          </ITFlex>
        )}
      </ITFlex>
    </ITCard>
  );
}
