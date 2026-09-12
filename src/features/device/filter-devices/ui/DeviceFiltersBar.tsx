import { ITGrid, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { DeviceType } from "@entities/device-type";

interface DeviceFiltersBarProps {
  types: DeviceType[];
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterEstado: string;
  onFilterEstadoChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function DeviceFiltersBar({
  types,
  filterType,
  onFilterTypeChange,
  filterEstado,
  onFilterEstadoChange,
  search,
  onSearchChange,
}: DeviceFiltersBarProps) {
  const { t } = useTranslation(["device", "common"]);

  return (
    <ITGrid container columns={12} spacing={3} className="mb-4">
      <ITGrid item xs={12} md={4}>
        <ITSelect
          name="filterType"
          options={types.map((type) => ({ value: type.id, label: type.name }))}
          value={filterType}
          onChange={(e) => onFilterTypeChange(e.target.value)}
          placeholder={t("common:filters.allTypes")}
        />
      </ITGrid>
      <ITGrid item xs={12} md={4}>
        <ITSelect
          name="filterEstado"
          options={[
            { value: "", label: t("common:filters.allStatuses") },
            { value: "DISPONIBLE", label: t("device:status.DISPONIBLE") },
            { value: "ASIGNADO", label: t("device:status.ASIGNADO") },
            { value: "BAJA", label: t("device:status.BAJA") },
          ]}
          value={filterEstado}
          onChange={(e) => onFilterEstadoChange(e.target.value)}
        />
      </ITGrid>
      <ITGrid item xs={12} md={4}>
        <ITInput
          name="search"
          placeholder={t("common:actions.search")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </ITGrid>
    </ITGrid>
  );
}
