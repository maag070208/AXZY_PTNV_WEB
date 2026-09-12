import { useMemo, useState } from "react";

/**
 * Estado de los filtros de la lista de dispositivos (tipo, estado, texto) +
 * el objeto `externalFilters` que espera el contrato ITDataTable. Antes esta
 * lógica vivía mezclada dentro de DevicesListPage.
 */
export function useDeviceFilters() {
  const [filterType, setFilterType] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [search, setSearch] = useState("");

  const externalFilters = useMemo(() => {
    const out: Record<string, string | number | boolean> = {};
    if (filterType) out.typeId = filterType;
    if (filterEstado) out.estado = filterEstado;
    if (search) out.q = search;
    return out;
  }, [filterType, filterEstado, search]);

  const toggleEstado = (value: string) => {
    setFilterEstado((current) => (current === value ? "" : value));
  };

  return {
    filterType,
    setFilterType,
    filterEstado,
    setFilterEstado,
    toggleEstado,
    search,
    setSearch,
    externalFilters,
  };
}
