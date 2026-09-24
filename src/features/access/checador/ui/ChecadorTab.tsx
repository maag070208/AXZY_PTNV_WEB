import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaCloudDownloadAlt, FaFileCsv, FaUndo } from "react-icons/fa";
import type { Checada, MetodoChecada } from "@entities/checador";
import { formatFechaHora } from "@shared/utils/dates";
import type { UseChecador } from "../model/useChecador";
import ChecadorStatusCard from "./ChecadorStatusCard";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const METODOS: MetodoChecada[] = ["ROSTRO", "HUELLA", "TARJETA", "OTRO"];

const METODO_COLOR: Record<MetodoChecada, BadgeColor> = {
  ROSTRO: "info",
  HUELLA: "success",
  TARJETA: "gray",
  OTRO: "warning",
};

interface Props {
  fx: UseChecador;
  /** Solo para quien puede administrar los relojes (ADMIN). */
  onAdministrarRelojes?: () => void;
}

export default function ChecadorTab({ fx, onAdministrarRelojes }: Props) {
  const {
    t,
    dateRange,
    setDateRange,
    q,
    setQ,
    metodo,
    setMetodo,
    reloj,
    setReloj,
    applyRange,
    clearFilters,
    externalFilters,
    fetchTableData,
    reloadKey,
    status,
    importando,
    starting,
    handleImportRange,
    exporting,
    handleExportCsv,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const metodoOptions = useMemo(
    () => [
      { value: "", label: t("filters.allMetodos") },
      ...METODOS.map((m) => ({ value: m, label: t(`metodos.${m}`) })),
    ],
    [t]
  );

  const relojOptions = useMemo(
    () => [
      { value: "", label: t("filters.allRelojes") },
      ...(status?.dispositivos ?? []).map((d) => ({ value: d.dispositivoSerie, label: d.nombre })),
    ],
    [status?.dispositivos, t]
  );

  const columns = useMemo<Column<Checada>[]>(
    () => [
      {
        key: "occurredAt",
        label: t("columns.occurredAt"),
        type: "date",
        sortable: true,
        render: (c) => (
          <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
            {formatFechaHora(c.occurredAt)}
          </ITText>
        ),
      },
      {
        key: "nombre",
        label: t("columns.employee"),
        type: "string",
        sortable: true,
        render: (c) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800">{c.nombre || "—"}</ITText>
            <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              #{c.numeroEmpleado}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "metodo",
        label: t("columns.metodo"),
        type: "string",
        sortable: true,
        render: (c) => (
          <span title={c.metodo === "OTRO" ? t("otroHint", { minor: c.minor }) : undefined}>
            <ITBadget color={METODO_COLOR[c.metodo]} size="lg">
              {t(`metodos.${c.metodo}`)}
            </ITBadget>
          </span>
        ),
      },
      {
        key: "reloj",
        label: t("columns.reloj"),
        type: "string",
        render: (c) => (
          <span title={c.dispositivoSerie}>
            <ITText className="text-[11px] font-bold text-slate-600">{c.reloj ?? c.dispositivoSerie}</ITText>
          </span>
        ),
      },
      {
        key: "serialNo",
        label: t("columns.serialNo"),
        type: "number",
        render: (c) => (
          <ITText className="text-[10px] font-bold text-slate-400">{c.serialNo}</ITText>
        ),
      },
    ],
    [t]
  );

  const handleDateRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value)) setDateRange(value);
  };

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ChecadorStatusCard fx={fx} onAdministrarRelojes={onAdministrarRelojes} />

      {/* Filtros */}
      <ITCard title={t("filters.title")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t("presets.title")}
            </ITText>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("today")}>
              {t("presets.today")}
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("yesterday")}>
              {t("presets.yesterday")}
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("last7")}>
              {t("presets.last7")}
            </ITButton>
            <ITFlex align="center" gap={2} className="ml-auto">
              <span title={t("import.hint")}>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="sm"
                  onClick={handleImportRange}
                  disabled={importando || starting || !dateRange[0] || !status?.configurado}
                >
                  <ITFlex align="center" gap={1}>
                    <FaCloudDownloadAlt size={13} />
                    <ITText className="font-bold text-[11px]">
                      {importando ? t("import.running") : t("import.button")}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </span>
              <ITButton variant="outlined" color="gray" size="sm" onClick={() => void handleExportCsv()} disabled={exporting}>
                <ITFlex align="center" gap={1}>
                  <FaFileCsv className="text-emerald-600" size={13} />
                  <ITText className="font-bold text-[11px]">
                    {exporting ? t("actions.exporting") : t("actions.exportCsv")}
                  </ITText>
                </ITFlex>
              </ITButton>
              <ITButton variant="text" color="gray" size="sm" onClick={clearFilters}>
                <ITFlex align="center" gap={1}>
                  <FaUndo size={11} />
                  <ITText className="font-bold text-[11px]">{t("filters.clear")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={3}>
              <ITDatePicker
                name="checadorDateRange"
                label={t("filters.dateRange")}
                range
                value={dateRange}
                onChange={handleDateRange}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITInput
                name="checadorEmployee"
                label={t("filters.employee")}
                placeholder={t("filters.employeePlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITSearchSelect
                name="checadorReloj"
                label={t("filters.reloj")}
                options={relojOptions}
                value={reloj}
                onChange={(value) => setReloj(String(value))}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITSearchSelect
                name="checadorMetodo"
                label={t("filters.metodo")}
                options={metodoOptions}
                value={metodo}
                onChange={(value) => setMetodo(String(value) as MetodoChecada | "")}
                className="w-full min-w-0"
              />
            </ITGrid>
          </ITGrid>
        </ITFlex>
      </ITCard>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={25}
        itemsPerPageOptions={[10, 25, 50, 100]}
        debounceMs={350}
        size="lg"
      />

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="top-right"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
