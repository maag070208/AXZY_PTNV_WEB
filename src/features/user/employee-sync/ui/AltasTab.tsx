import { useMemo, useState } from "react";
import {
  ITBadget,
  ITDataTable,
  ITFlex,
  ITInput,
  ITSearchSelect,
  ITText,
  type Column,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { makeClientTableFetch } from "@shared/api/clientTable";
import type { EmployeeSyncInvalidRow } from "@entities/user";
import type { UseEmployeeSync } from "../model/useEmployeeSync";
import { altaFields, altaStatusOf, type AltaStatus, type AltaTableRow } from "../model/fields";
import SyncRowErrors from "./SyncRowErrors";
import SyncTableFilters, { type SyncFilterSelect } from "./SyncTableFilters";

/**
 * Pestaña de altas: fila = número, persona, departamento, usuario, contraseña,
 * horario y estado. El nombre viene del Excel; el número llega propuesto y es
 * editable; el departamento y el horario se eligen con `ITSearchSelect` (con
 * búsqueda). El puesto viene del Excel y se edita después en Personal.
 */
export default function AltasTab({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");
  // Altas del Excel + las filas convertidas desde "Por resolver".
  const rows = fx.altas;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [scheduleId, setScheduleId] = useState("");

  /**
   * Errores del 422 para una alta. Se identifican por `rowKey` (el renglón se
   * repite entre hojas); si el error viniera sin `rowKey`, se cae a `row`.
   */
  const errorsOf = (rowKey: string, row: number, field?: string): EmployeeSyncInvalidRow[] =>
    fx.rowErrors.filter(
      (rowError) =>
        (rowError.rowKey === rowKey ||
          (rowError.rowKey === undefined && rowError.row === row)) &&
        (!field || rowError.field === field)
    );

  const departmentLabelOf = useMemo(() => {
    const labels = new Map(fx.departmentOptions.map((option) => [option.value, option.label]));
    return (id: string) => labels.get(id) ?? "";
  }, [fx.departmentOptions]);

  const scheduleLabelOf = useMemo(() => {
    const labels = new Map(fx.scheduleOptions.map((option) => [option.value, option.label]));
    return (id: string, fallback: string | null) => labels.get(id) ?? fallback ?? "";
  }, [fx.scheduleOptions]);

  const tableRows = useMemo<AltaTableRow[]>(
    () =>
      rows.map((alta) => {
        const draft = fx.drafts[alta.rowKey] ?? null;
        const departmentLabel = draft?.departmentId
          ? departmentLabelOf(draft.departmentId)
          : alta.departmentName;
        const scheduleLabel = scheduleLabelOf(draft?.scheduleId ?? "", alta.scheduleName);
        return {
          ...alta,
          draft,
          departmentLabel,
          scheduleLabel,
          status: altaStatusOf(draft, errorsOf(alta.rowKey, alta.row).length),
        };
      }),
    [rows, fx.drafts, fx.rowErrors, departmentLabelOf, scheduleLabelOf]
  );

  const fetchData = useMemo(
    () => makeClientTableFetch<AltaTableRow>(() => Promise.resolve(tableRows), altaFields),
    [tableRows]
  );

  /** La barra filtra por campos virtuales de `altaFields` (client-side). */
  const externalFilters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(departmentId ? { departmentFilter: departmentId } : {}),
      ...(status ? { status } : {}),
      ...(scheduleId ? { scheduleId } : {}),
    }),
    [debouncedSearch, departmentId, status, scheduleId]
  );

  const statusOptions = useMemo(
    () => [
      { id: "ready", name: t("sync.altas.ready") },
      { id: "missingCredentials", name: t("sync.altas.missingCredentials") },
      { id: "missingDepartment", name: t("sync.altas.missingDepartment") },
      { id: "error", name: t("sync.altas.statusError") },
    ],
    [t]
  );

  const filterSelects: SyncFilterSelect[] = [
    {
      key: "department",
      label: t("sync.filters.department"),
      value: departmentId,
      onChange: setDepartmentId,
      options: [
        { value: "", label: t("sync.filters.allDepartments") },
        ...fx.departmentOptions.filter((option) => option.value),
      ],
    },
    {
      key: "status",
      label: t("sync.filters.status"),
      value: status,
      onChange: setStatus,
      options: [
        { value: "", label: t("sync.filters.allStatuses") },
        ...statusOptions.map((option) => ({ value: option.id, label: option.name })),
      ],
    },
    {
      key: "schedule",
      label: t("sync.filters.schedule"),
      value: scheduleId,
      onChange: setScheduleId,
      options: [
        { value: "", label: t("sync.filters.allSchedules") },
        ...fx.scheduleOptions.filter((option) => option.value),
      ],
    },
  ];

  const statusBadge = (value: AltaStatus, errorCount: number) => {
    if (value === "error") {
      return (
        <ITBadget color="danger" size="sm">
          {t("sync.altas.rowErrors", { count: errorCount })}
        </ITBadget>
      );
    }
    if (value === "missingCredentials") {
      return (
        <ITBadget color="warning" size="sm">
          {t("sync.altas.missingCredentials")}
        </ITBadget>
      );
    }
    if (value === "missingDepartment") {
      return (
        <ITBadget color="warning" size="sm">
          {t("sync.altas.missingDepartment")}
        </ITBadget>
      );
    }
    return (
      <ITBadget color="success" size="sm">
        {t("sync.altas.ready")}
      </ITBadget>
    );
  };

  if (rows.length === 0) {
    return (
      <ITText muted className="!text-[12px]">
        {t("sync.altas.empty")}
      </ITText>
    );
  }

  const columns: Column<AltaTableRow>[] = [
    {
      type: "string",
      key: "employeeNumber",
      label: t("sync.altas.thEmployeeNumber"),
      width: 100,
      sortable: true,
      render: (alta) => (
        <ITFlex direction="column" gap={0.5}>
          <ITInput
            name={`alta-employeeNumber-${alta.rowKey}`}
            size="sm"
            value={fx.drafts[alta.rowKey]?.employeeNumber ?? ""}
            onChange={(event) => fx.setDraft(alta.rowKey, { employeeNumber: event.target.value })}
          />
          {alta.employeeNumberGenerated && (fx.drafts[alta.rowKey]?.employeeNumber ?? "").trim() && (
            <ITText muted className="!text-[10px] leading-tight">
              {t("sync.altas.generatedNumber")}
            </ITText>
          )}
          <SyncRowErrors errors={errorsOf(alta.rowKey, alta.row, "employeeNumber")} label={fx.fieldErrorLabel} />
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "name",
      label: t("sync.altas.thPerson"),
      width: 210,
      sortable: true,
      render: (alta) => {
        const draft = fx.drafts[alta.rowKey];
        const meta = [alta.payrollType, t("sync.altas.rowTag", { row: alta.row })]
          .filter(Boolean)
          .join(" · ");
        return (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="truncate !text-[11.5px] font-semibold text-slate-800">{alta.name}</ITText>
            <ITText muted className="truncate !text-[10px] leading-tight">
              {meta}
            </ITText>
            {draft?.jobTitle && (
              <ITText muted className="truncate !text-[10px] leading-tight">
                {draft.jobTitle}
              </ITText>
            )}
          </ITFlex>
        );
      },
    },
    {
      type: "string",
      key: "departmentName",
      label: t("sync.altas.thDepartment"),
      width: 190,
      sortable: true,
      render: (alta) => (
        <ITFlex direction="column" gap={0.5}>
          <ITSearchSelect
            name={`alta-department-${alta.rowKey}`}
            size="sm"
            options={fx.departmentOptions}
            value={fx.drafts[alta.rowKey]?.departmentId ?? ""}
            onChange={(value) => fx.setDraft(alta.rowKey, { departmentId: String(value) })}
            className="w-full min-w-0"
          />
          {!alta.departmentId && (
            <ITText muted className="!text-[10px] leading-tight">
              {t("sync.altas.departmentNotInCatalogShort")}
            </ITText>
          )}
          <SyncRowErrors errors={errorsOf(alta.rowKey, alta.row, "departmentId")} label={fx.fieldErrorLabel} />
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "username",
      label: t("sync.altas.thUsername"),
      width: 140,
      sortable: true,
      render: (alta) => (
        <ITFlex direction="column" gap={0.5}>
          <ITInput
            name={`alta-username-${alta.rowKey}`}
            size="sm"
            value={fx.drafts[alta.rowKey]?.username ?? ""}
            placeholder={t("sync.altas.usernamePlaceholder")}
            onChange={(event) => fx.setDraft(alta.rowKey, { username: event.target.value })}
          />
          <SyncRowErrors errors={errorsOf(alta.rowKey, alta.row, "username")} label={fx.fieldErrorLabel} />
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "password",
      label: t("sync.altas.thPassword"),
      width: 130,
      sortable: true,
      render: (alta) => (
        <ITFlex direction="column" gap={0.5}>
          <ITInput
            name={`alta-password-${alta.rowKey}`}
            size="sm"
            value={fx.drafts[alta.rowKey]?.password ?? ""}
            placeholder={t("sync.altas.passwordPlaceholder")}
            onChange={(event) => fx.setDraft(alta.rowKey, { password: event.target.value })}
          />
          <SyncRowErrors errors={errorsOf(alta.rowKey, alta.row, "password")} label={fx.fieldErrorLabel} />
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "scheduleId",
      label: t("sync.altas.thSchedule"),
      width: 180,
      sortable: true,
      render: (alta) => (
        <ITFlex direction="column" gap={0.5}>
          <ITSearchSelect
            name={`alta-schedule-${alta.rowKey}`}
            size="sm"
            options={fx.scheduleOptions}
            value={fx.drafts[alta.rowKey]?.scheduleId ?? ""}
            onChange={(value) => fx.setDraft(alta.rowKey, { scheduleId: String(value) })}
            className="w-full min-w-0"
          />
          {alta.scheduleWarning && (
            <ITText muted className="!text-[10px] leading-tight">
              {t("sync.altas.scheduleWarning")}
            </ITText>
          )}
          <SyncRowErrors errors={errorsOf(alta.rowKey, alta.row, "scheduleId")} label={fx.fieldErrorLabel} />
        </ITFlex>
      ),
    },
    {
      type: "catalog",
      key: "status",
      label: t("sync.altas.thStatus"),
      width: 160,
      sortable: true,
      render: (alta) => {
        const errors = errorsOf(alta.rowKey, alta.row);
        const value = altaStatusOf(fx.drafts[alta.rowKey] ?? null, errors.length);
        return (
          <ITFlex direction="column" gap={1}>
            {statusBadge(value, errors.length)}
            {errors.length > 0 && <SyncRowErrors errors={errors} label={fx.fieldErrorLabel} />}
          </ITFlex>
        );
      },
    },
  ];

  const hasFilters = Boolean(search || departmentId || status || scheduleId);

  return (
    <ITFlex direction="column" gap={3}>
      <SyncTableFilters
        search={search}
        onSearch={setSearch}
        searchPlaceholder={t("sync.filters.altasPlaceholder")}
        selects={filterSelects}
        hasFilters={hasFilters}
        onClear={() => {
          setSearch("");
          setDepartmentId("");
          setStatus("");
          setScheduleId("");
        }}
      />
      <ITDataTable
        key={`altas:${debouncedSearch}:${departmentId}:${status}:${scheduleId}`}
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
