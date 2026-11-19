import { useMemo, useState } from "react";
import {
  ITBadget,
  ITCheckbox,
  ITDataTable,
  ITFlex,
  ITText,
  type Column,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { makeClientTableFetch } from "@shared/api/clientTable";
import type { EmployeeSyncInvalidRow } from "@entities/user";
import type { UseEmployeeSync } from "../model/useEmployeeSync";
import { bajaFields, type BajaTableRow } from "../model/fields";
import SyncRowErrors from "./SyncRowErrors";
import SyncTableFilters, { type SyncFilterSelect } from "./SyncTableFilters";

/**
 * Pestaña de bajas: las personas del sistema que no aparecen en el Excel. La
 * casilla "Incluir" viene marcada; si se desmarca, esa baja no se aplica en el
 * sistema ni en los relojes. La categoría de la baja es fija para este flujo.
 */
export default function BajasTab({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");
  const preview = fx.preview;
  const rows = useMemo(() => preview?.bajas ?? [], [preview]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const errorsOf = (userId: string): EmployeeSyncInvalidRow[] =>
    fx.rowErrors.filter((rowError) => rowError.userId === userId);

  const tableRows = useMemo<BajaTableRow[]>(
    () =>
      rows.map((baja) => ({
        ...baja,
        included: !fx.excludedBajas.has(baja.userId),
        status: fx.rowErrors.some((rowError) => rowError.userId === baja.userId) ? "error" : "ok",
      })),
    [rows, fx.excludedBajas, fx.rowErrors]
  );

  const fetchData = useMemo(
    () => makeClientTableFetch<BajaTableRow>(() => Promise.resolve(tableRows), bajaFields),
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
        ...Array.from(new Set(rows.map((baja) => baja.departmentName).filter((name): name is string => !!name)))
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
        { value: "ok", label: t("sync.bajas.statusOk") },
        { value: "error", label: t("sync.altas.statusError") },
      ],
    },
  ];

  if (rows.length === 0) {
    return (
      <ITText muted className="!text-[12px]">
        {t("sync.bajas.empty")}
      </ITText>
    );
  }

  const columns: Column<BajaTableRow>[] = [
    {
      type: "boolean",
      key: "include",
      label: t("sync.bajas.thInclude"),
      width: 80,
      render: (baja) => (
        <ITCheckbox
          name={`baja-include-${baja.userId}`}
          checked={!fx.excludedBajas.has(baja.userId)}
          onChange={(value) => fx.toggleBaja(baja.userId, value)}
        />
      ),
    },
    {
      type: "string",
      key: "employeeNumber",
      label: t("sync.bajas.thEmployeeNumber"),
      width: 110,
      sortable: true,
      render: (baja) => (
        <ITText className="!text-[11px] font-semibold tabular-nums text-slate-700">
          {baja.employeeNumber ?? "—"}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "name",
      label: t("sync.bajas.thName"),
      width: 220,
      sortable: true,
      render: (baja) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="truncate !text-[11.5px] font-semibold text-slate-800">{baja.name}</ITText>
          <ITText muted className="truncate !text-[10px] leading-tight">
            {t("sync.bajas.category")}
          </ITText>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "departmentName",
      label: t("sync.bajas.thDepartment"),
      width: 170,
      sortable: true,
      render: (baja) => (
        <ITBadget color="gray" size="sm">
          {baja.departmentName ?? "—"}
        </ITBadget>
      ),
    },
    {
      type: "string",
      key: "jobTitle",
      label: t("sync.bajas.thJobTitle"),
      width: 170,
      sortable: true,
      render: (baja) => (
        <ITText muted className="truncate !text-[11px]">
          {baja.jobTitle ?? "—"}
        </ITText>
      ),
    },
    {
      type: "catalog",
      key: "linkedToClock",
      label: t("sync.bajas.thClock"),
      width: 150,
      sortable: true,
      render: (baja) => (
        <ITBadget color={baja.linkedToClock ? "success" : "gray"} size="sm">
          {baja.linkedToClock ? t("sync.bajas.linkedClock") : t("sync.bajas.notLinked")}
        </ITBadget>
      ),
    },
    {
      type: "catalog",
      key: "status",
      label: t("sync.altas.thStatus"),
      width: 150,
      sortable: true,
      render: (baja) => {
        const errors = errorsOf(baja.userId);
        return (
          <ITFlex direction="column" gap={1}>
            {errors.length > 0 ? (
              <ITBadget color="danger" size="sm">
                {t("sync.altas.rowErrors", { count: errors.length })}
              </ITBadget>
            ) : (
              <ITBadget color="success" size="sm">
                {t("sync.bajas.statusOk")}
              </ITBadget>
            )}
            <SyncRowErrors errors={errors} label={fx.fieldErrorLabel} />
          </ITFlex>
        );
      },
    },
  ];

  const hasFilters = Boolean(search || department || status);

  return (
    <ITFlex direction="column" gap={3}>
      <SyncTableFilters
        search={search}
        onSearch={setSearch}
        searchPlaceholder={t("sync.filters.bajasPlaceholder")}
        selects={filterSelects}
        hasFilters={hasFilters}
        onClear={() => {
          setSearch("");
          setDepartment("");
          setStatus("");
        }}
      />
      <ITDataTable
        key={`bajas:${debouncedSearch}:${department}:${status}`}
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
    </ITFlex>
  );
}
