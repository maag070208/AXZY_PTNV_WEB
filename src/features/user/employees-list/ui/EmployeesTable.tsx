import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCheckbox,
  ITDataTable,
  ITFlex,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaUserTie } from "react-icons/fa";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Department } from "@entities/department";
import { personalApi, type PersonalProfile } from "@entities/hr";
import { roleLabel, useRolesCatalog } from "@entities/user";

const roleBadge = (role: string, label: string) => (
  <ITBadget
    color={
      role === "MANAGER"
        ? "danger"
        : role === "AREA_HEAD"
          ? "warning"
          : role === "EMPLOYEE"
            ? "success"
            : "gray"
    }
    size="lg"
  >
    {label}
  </ITBadget>
);

interface Props {
  departments: Department[];
  canEdit: boolean;
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (u: PersonalProfile) => void;
  onEdit: (u: PersonalProfile) => void;
  /** Tras una asignación en lote: la lista vuelve a pedir sus datos. */
  onChanged: () => void;
}

export default function EmployeesTable({
  departments,
  canEdit,
  fetchData,
  reloadKey,
  onView,
  onEdit,
  onChanged,
}: Props) {
  const { t: tt } = useTranslation(["users"]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDepartment, setBulkDepartment] = useState("");
  const [bulkSubarea, setBulkSubarea] = useState("");
  const [bulkChosen, setBulkChosen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  // Todos los departamentos y subáreas: también hay personal en los inactivos.
  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  const subareaOptions = departments.flatMap((d) =>
    d.subareas.map((s) => ({ id: s.id, name: `${d.name} · ${s.name}` }))
  );

  // Roles que admite el API para el personal (los marcados `staff` en /roles).
  const staffRoleOptions = useRolesCatalog()
    .filter((role) => role.active && role.staff)
    .map((role) => ({ id: role.key, name: role.name }));

  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkSubareaOptions =
    departments.find((d) => d.id === bulkDepartment)?.subareas.map((s) => ({ value: s.id, label: s.name })) ?? [];

  /** Aplica departamento y subárea a los seleccionados (la subárea se limpia si no se elige una). */
  const applyBulk = async () => {
    setBulkSaving(true);
    setBulkError(null);
    try {
      await personalApi.assignDepartments({
        userIds: [...selected],
        departmentId: bulkDepartment || null,
        subareaId: bulkSubarea || null,
      });
      setSelected(new Set());
      setBulkChosen(false);
      setBulkDepartment("");
      setBulkSubarea("");
      onChanged();
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkSaving(false);
    }
  };

  const columns: Column<PersonalProfile>[] = [
    {
      key: "employeeNumber",
      label: tt("table.employeeNoFull"),
      type: "string",
      width: 110,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {u.employeeNumber ?? "—"}
        </ITText>
      ),
    },
    {
      key: "name",
      label: tt("table.name"),
      type: "string",
      width: 280,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex
          direction="column"
          gap={0.5}
          className="cursor-pointer"
        >
          <ITText className="text-[12px] font-black text-slate-800">{u.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            @{u.username}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "role",
      label: tt("table.role"),
      type: "catalog",
      width: 140,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: staffRoleOptions, loading: false, error: false },
      render: (u) => roleBadge(u.role, roleLabel(u.role)),
    },
    {
      key: "active",
      label: tt("table.status"),
      type: "catalog" as const,
      sortable: false,
      width: 140,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "true", name: tt("table.statusActive") },
          { id: "false", name: tt("table.statusInactive") },
        ],
        loading: false,
        error: false,
      },
      render: (u) => (
        <ITBadget color={u.active ? "success" : "danger"} size="lg">
          {u.active ? tt("table.statusActive") : tt("table.statusInactive")}
        </ITBadget>
      ),
    },
    {
      key: "jobTitle",
      label: tt("table.position"),
      type: "string",
      width: 180,
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-bold text-slate-600">{u.jobTitle ?? "—"}</ITText>
      ),
    },
    {
      key: "departmentId",
      label: tt("table.departmentFull"),
      type: "catalog",
      width: 150,
      filter: "search",
      sortable: false,
      catalogOptions: { data: departmentOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-black text-slate-600 uppercase">
          {u.department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subareaId",
      label: tt("table.subarea"),
      type: "catalog",
      width: 130,
      filter: "search",
      sortable: false,
      catalogOptions: { data: subareaOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-bold text-slate-500 uppercase">
          {u.subarea?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string" as const,
      width: 120,
      sortable: false,
      render: (u: PersonalProfile) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            onClick={() => onView(u)}
            size="lg"
            color="secondary"
            title={tt("table.viewProfile")}
          >
            <FaUserTie size={14} />
          </ITButton>
          {canEdit && (
            <ITButton
              onClick={() => onEdit(u)}
              size="lg"
              color="gray"
              title={tt("table.editEmployee")}
            >
              <FaEdit size={14} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  const selectColumn: Column<PersonalProfile> = {
    key: "select",
    label: "",
    type: "string" as const,
    width: 44,
    sortable: false,
    filter: false,
    render: (u: PersonalProfile) => (
      <ITCheckbox
        name={`employee-${u.id}`}
        checked={selected.has(u.id)}
        onChange={() => toggleSelected(u.id)}
      />
    ),
  };
  const allColumns = canEdit ? [selectColumn, ...columns] : columns;

  return (
    <>
      {canEdit && selected.size > 0 && (
        <ITFlex align="center" gap={3} wrap="wrap" className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <ITText className="!text-[11px] font-bold text-slate-700">
            {tt("bulk.selected", { count: selected.size })}
          </ITText>
          <ITSelect
            name="bulkDepartment"
            label={tt("bulk.department")}
            options={[
              { value: "", label: tt("bulk.noDepartment") },
              ...departmentOptions.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={bulkDepartment}
            onChange={(e) => {
              setBulkDepartment(e.target.value);
              setBulkSubarea("");
              setBulkChosen(true);
            }}
          />
          <ITSelect
            name="bulkSubarea"
            label={tt("bulk.subarea")}
            disabled={!bulkDepartment}
            options={[{ value: "", label: tt("bulk.noSubarea") }, ...bulkSubareaOptions]}
            value={bulkSubarea}
            onChange={(e) => setBulkSubarea(e.target.value)}
          />
          <ITButton
            variant="filled"
            color="primary"
            size="sm"
            disabled={!bulkChosen || bulkSaving}
            onClick={() => void applyBulk()}
          >
            <ITText className="!text-[11px] font-bold">{tt("bulk.apply")}</ITText>
          </ITButton>
          <ITButton variant="text" color="gray" size="sm" onClick={() => setSelected(new Set())}>
            <ITText className="!text-[11px] font-bold">{tt("bulk.clear")}</ITText>
          </ITButton>
          {bulkError && <ITAlert variant="error">{bulkError}</ITAlert>}
        </ITFlex>
      )}
      <ITDataTable
        columns={allColumns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      layout="fixed"
      density="compact"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
      onRowClick={(row) => onView(row as unknown as PersonalProfile)}
      />
    </>
  );
}