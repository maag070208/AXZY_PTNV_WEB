import {
  ITAlert,
  ITButton,
  ITCard,
  ITDataTable,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSelect,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaUserTie } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@core/store/store";
import { usersApi, type User } from "@core/api/auth.api";
import {
  departmentsApi,
  type Department,
} from "@core/api/departments.api";

export default function EmployeesListPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    numeroEmpleado: "",
    puesto: "",
    departmentId: "",
    subareaId: "",
  });

  useEffect(() => {
    departmentsApi.list(true).then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const selectedDept = departments.find((d) => d.id === form.departmentId);

  const handleCreate = async () => {
    try {
      await usersApi.create({
        username: form.username,
        password: form.password,
        name: form.name,
        role: "EMPLEADO",
        numeroEmpleado: form.numeroEmpleado || undefined,
        puesto: form.puesto || undefined,
        departmentId: form.departmentId || undefined,
        subareaId: form.subareaId || undefined,
      });
      setForm({
        username: "",
        password: "",
        name: "",
        numeroEmpleado: "",
        puesto: "",
        departmentId: "",
        subareaId: "",
      });
      setShowForm(false);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await usersApi.table({
        page: params.page,
        limit: params.limit,
        filters: {
          ...(params.filters as Record<string, string | number | boolean>),
          role: "EMPLEADO",
        },
        sort: params.sort,
      });
      setTotal(res.total);
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  const departmentOptions = departments
    .filter((d) => d.active)
    .map((d) => ({ id: d.id, name: d.name }));

  const subareaOptions = departments
    .filter((d) => d.active)
    .flatMap((d) =>
      d.subareas.map((s) => ({ id: s.id, name: `${d.name} · ${s.name}` }))
    );

  const columns: Column<User>[] = [
    {
      key: "numeroEmpleado",
      label: "No. Empleado",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-black text-slate-700">
          {u.numeroEmpleado ?? "—"}
        </ITText>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{u.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            @{u.username}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "puesto",
      label: "Puesto",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] font-bold text-slate-600">{u.puesto ?? "—"}</ITText>
      ),
    },
    {
      key: "department",
      label: "Departamento",
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: departmentOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-black text-slate-600 uppercase">
          {(u as any).department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subarea",
      label: "Subárea",
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: subareaOptions, loading: false, error: false },
      render: (u) => (
        <ITText className="text-[10px] font-bold text-slate-500 uppercase">
          {(u as any).subarea?.name ?? "—"}
        </ITText>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            label: "",
            type: "string" as const,
            sortable: false,
            render: (u: User) => (
              <FaEdit
                size={14}
                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                onClick={() => navigate(`/empleados/${u.id}/editar`)}
                title="Editar empleado"
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <ITPage
      title="Empleados"
      description={`${total} empleado(s) activo(s)`}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Empleados" },
      ]}
      actions={
        isAdmin ? (
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => navigate("/usuarios/nuevo")}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo empleado</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
      icon={<FaUserTie size={20} />}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {showForm && isAdmin && (
        <ITCard className="p-6 mb-6">
          <ITStack direction="column" spacing={4}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Nuevo empleado
            </ITText>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="emp_username"
                  label="Username *"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="emp_password"
                  type="password"
                  label="Contraseña *"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="emp_name"
                  label="Nombre *"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="emp_num"
                  label="No. Empleado"
                  value={form.numeroEmpleado}
                  onChange={(e) => setForm((f) => ({ ...f, numeroEmpleado: e.target.value }))}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name="emp_puesto"
                  label="Puesto"
                  value={form.puesto}
                  onChange={(e) => setForm((f) => ({ ...f, puesto: e.target.value }))}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITSelect
                  name="emp_dept"
                  label="Departamento"
                  options={departments
                    .filter((d) => d.active)
                    .map((d) => ({ value: d.id, label: d.name }))}
                  value={form.departmentId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      departmentId: e.target.value,
                      subareaId: "",
                    }))
                  }
                />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITSelect
                  name="emp_sub"
                  label="Subárea"
                  options={(selectedDept?.subareas ?? []).map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  value={form.subareaId}
                  onChange={(e) => setForm((f) => ({ ...f, subareaId: e.target.value }))}
                />
              </ITGrid>
            </ITGrid>
            <ITFlex justify="end" gap={2}>
              <ITButton variant="outlined" onClick={() => setShowForm(false)}>
                Cancelar
              </ITButton>
              <ITButton
                variant="filled"
                color="primary"
                onClick={handleCreate}
                disabled={!form.username || !form.password || !form.name}
              >
                Guardar
              </ITButton>
            </ITFlex>
          </ITStack>
        </ITCard>
      )}

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITPage>
  );
}