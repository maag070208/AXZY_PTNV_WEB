import { useMemo, useState } from "react";
import {
  ITAlert,
  ITDataTable,
  ITFlex,
  ITSlideToggle,
  ITText,
  type Column,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { makeClientTableFetch } from "@shared/api/clientTable";
import type { EmployeeSyncInvalidRow } from "@entities/user";
import type { UseEmployeeSync } from "../model/useEmployeeSync";
import { cambioFields, type CambioTableRow } from "../model/fields";
import SyncRowErrors from "./SyncRowErrors";
import SyncTableFilters, { type SyncFilterSelect } from "./SyncTableFilters";

/**
 * Pestaña de coincidencias y cambios: personas del sistema que corresponden a
 * una fila del Excel pero con número, nombre o departamento distinto. Puede ser
 * un match por nombre cuando el número del Excel no existe; por eso se muestran
 * los dos números (el del Excel y el del sistema). Son informativos: solo se
 * aplican si se enciende el interruptor.
 */
export default function CambiosTab({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");
  const preview = fx.preview;
  const rows = useMemo(() => preview?.cambios ?? [], [preview]);
  const coinciden = preview?.counts.coinciden ?? 0;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const errorsOf = (userId: string): EmployeeSyncInvalidRow[] =>
    fx.rowErrors.filter((rowError) => rowError.userId === userId);

  const tableRows = useMemo<CambioTableRow[]>(
    () =>
      rows.map((cambio) => ({
        ...cambio,
        status: fx.rowErrors.some((rowError) => rowError.userId === cambio.userId) ? "error" : "ok",
      })),
    [rows, fx.rowErrors]
  );

  const fetchData = useMemo(
    () => makeClientTableFetch<CambioTableRow>(() => Promise.resolve(tableRows), cambioFields),
    [tableRows]
  );

  const externalFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(department ? { departmentFilter: department } : {}),
      ...(status ? { status } : {}),
    }),
    [debouncedSearch, department, status]
  );

  const filterSelects: SyncFilterSelect[] = [
    {
      key: "department",
      label: t("sync.filters.department"),
      value: department,
      onChange: setDepartment,
      options: [
        { value: "", label: t("sync.filters.allDepartments") },
        ...Array.from(new Set(rows.map((cambio) => cambio.excelDepartmentName).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ value: name, label: name })),
      ],
    },
    {
      key: "status",
      label: t("sync.filters.status"),
      value: status,
      onChange: setStatus,
      options: [
        { value: "", label: t("sync.filters.allStatuses") },
        { value: "ok", label: t("sync.cambios.statusOk") },
        { value: "error", label: t("sync.altas.statusError") },
      ],
    },
  ];

  const columns: Column<CambioTableRow>[] = [
    {
      type: "string",
      key: "employeeNumber",
      label: t("sync.cambios.thEmployeeNumberExcel"),
      width: 120,
      sortable: true,
      render: (cambio) => (
        <ITText className="!text-[11px] font-semibold tabular-nums text-slate-700">
          {cambio.employeeNumber ?? "—"}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "currentEmployeeNumber",
      label: t("sync.cambios.thEmployeeNumberSystem"),
      width: 140,
      sortable: true,
      render: (cambio) => {
        const differs = (cambio.employeeNumber ?? "") !== (cambio.currentEmployeeNumber ?? "");
        if (!cambio.currentEmployeeNumber) {
          return (
            <ITText muted className="!text-[11px]">
              —
            </ITText>
          );
        }
        return (
          <ITText
            className={`!text-[11px] tabular-nums ${
              differs ? "font-bold text-[color:var(--color-primary)]" : "font-semibold text-slate-700"
            }`}
          >
            {cambio.currentEmployeeNumber}
          </ITText>
        );
      },
    },
    {
      type: "string",
      key: "excelName",
      label: t("sync.cambios.thNameExcel"),
      width: 210,
      sortable: true,
      render: (cambio) => (
        <ITText className="truncate !text-[11.5px] font-semibold text-slate-800">{cambio.excelName}</ITText>
      ),
    },
    {
      type: "string",
      key: "currentName",
      label: t("sync.cambios.thNameSystem"),
      width: 210,
      sortable: true,
      render: (cambio) => (
        <ITText className="truncate !text-[11px] text-slate-600">{cambio.currentName}</ITText>
      ),
    },
    {
      type: "string",
      key: "excelDepartmentName",
      label: t("sync.cambios.thDepartmentExcel"),
      width: 170,
      sortable: true,
      render: (cambio) => (
        <ITText className="truncate !text-[11px] font-semibold text-slate-700">
          {cambio.excelDepartmentName}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "currentDepartmentName",
      label: t("sync.cambios.thDepartmentSystem"),
      width: 170,
      sortable: true,
      render: (cambio) => (
        <ITText muted className="truncate !text-[11px]">
          {cambio.currentDepartmentName ?? "—"}
        </ITText>
      ),
    },
    {
      type: "catalog",
      key: "status",
      label: t("sync.altas.thStatus"),
      width: 140,
      sortable: true,
      render: (cambio) => <SyncRowErrors errors={errorsOf(cambio.userId)} label={fx.fieldErrorLabel} />,
    },
  ];

  const hasFilters = Boolean(search || department || status);

  return (
    <ITFlex direction="column" gap={3}>
      <ITAlert variant="info">{t("sync.cambios.coinciden", { count: coinciden })}</ITAlert>

      <ITFlex
        align="center"
        justify="between"
        gap={3}
        wrap="wrap"
        className="rounded-2xl bg-slate-50/70 px-4 py-3"
      >
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          <ITText className="!text-[12px] font-semibold text-slate-800">
            {t("sync.cambios.apply")}
          </ITText>
          <ITText muted className="!text-[11px] leading-tight">
            {t("sync.cambios.applyHint")}
          </ITText>
        </ITFlex>
        <ITSlideToggle
          isOn={fx.includeChanges}
          onToggle={fx.setIncludeChanges}
          label={t("sync.cambios.apply")}
          activeColor="primary"
          size="sm"
          disabled={rows.length === 0}
        />
      </ITFlex>

      {rows.length === 0 ? (
        <ITText muted className="!text-[12px]">
          {t("sync.cambios.empty")}
        </ITText>
      ) : (
        <>
          <SyncTableFilters
            search={search}
            onSearch={setSearch}
            searchPlaceholder={t("sync.filters.cambiosPlaceholder")}
            selects={filterSelects}
            hasFilters={hasFilters}
            onClear={() => {
              setSearch("");
              setDepartment("");
              setStatus("");
            }}
          />
          <ITDataTable
            key={`cambios:${debouncedSearch}:${department}:${status}`}
            showViewToggle={false}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchData as never}
            externalFilters={externalFilters}
            reloadTrigger={`${fx.previewVersion}:${fx.rowErrors.length}`}
            debounceMs={200}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50, 100]}
            size="sm"
            density="compact"
            layout="fixed"
          />
        </>
      )}
    </ITFlex>
  );
}
