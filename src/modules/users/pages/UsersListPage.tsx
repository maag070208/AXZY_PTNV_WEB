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
import { FaUserShield, FaPlus } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi, type User } from "@core/api/auth.api";
import {
  departmentsApi,
  type Department,
} from "@core/api/departments.api";

export default function UsersListPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "USER" as "ADMIN" | "USER" | "EMPLEADO",
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
        role: form.role,
        numeroEmpleado: form.numeroEmpleado || undefined,
        puesto: form.puesto || undefined,
        departmentId: form.departmentId || undefined,
        subareaId: form.subareaId || undefined,
      });
      setForm({
        username: "",
        password: "",
        name: "",
        role: "USER",
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
        filters: params.filters as Record<string, string | number | boolean>,
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

  const roleBadge = (role: string) => (
    <ITText
      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
        role === "ADMIN"
          ? "bg-rose-50 text-rose-700"
          : role === "USER"
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {role}
    </ITText>
  );

  const columns: Column<User>[] = [
    {
      key: "username",
      label: "Username",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[12px] font-black text-slate-700">@{u.username}</ITText>
      ),
    },
    {
      key: "name",
      label: "Nombre",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => <ITText className="text-[12px] text-slate-800">{u.name}</ITText>,
    },
    {
      key: "role",
      label: "Rol",
      type: "catalog",
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: [
          { id: "ADMIN", name: "ADMIN" },
          { id: "USER", name: "USER" },
          { id: "EMPLEADO", name: "EMPLEADO" },
        ],
        loading: false,
        error: false,
      },
      render: (u) => roleBadge(u.role),
    },
    {
      key: "numeroEmpleado",
      label: "No. Emp",
      type: "string",
      filter: true,
      sortable: false,
      render: (u) => (
        <ITText className="text-[11px] text-slate-600">{u.numeroEmpleado ?? "—"}</ITText>
      ),
    },
    {
      key: "department",
      label: "Depto",
      type: "catalog",
      filter: "catalog",
      catalogOptions: {
        data: departments.filter((d) => d.active).map((d) => ({ id: d.id, name: d.name })),
        loading: false,
        error: false,
      },
      render: (u) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {(u as any).department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "subarea",
      label: "Subárea",
      type: "catalog",
      filter: "catalog",
      catalogOptions: {
        data: departments
          .filter((d) => d.active)
          .flatMap((d) =>
            d.subareas.map((s) => ({ id: s.id, name: `${d.name} · ${s.name}` }))
          ),
        loading: false,
        error: false,
      },
      render: (u) => (
        <ITText className="text-[10px] uppercase text-slate-500">
          {(u as any).subarea?.name ?? "—"}
        </ITText>
      ),
    },
  ];

  return (
    <ITPage
      title="Usuarios"
      description={`${total} usuario(s)`}
      backAction={() => navigate("/")}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => setShowForm((s) => !s)}
        >
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">Nuevo usuario</ITText>
          </ITFlex>
        </ITButton>
      }
      icon={<FaUserShield size={20} />}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {showForm && (
        <ITCard className="p-6 mb-6">
          <ITStack direction="column" spacing={4}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Nuevo usuario
            </ITText>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="u_username"
                  label="Username *"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="u_password"
                  type="password"
                  label="Contraseña *"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="u_name"
                  label="Nombre *"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITSelect
                  name="u_role"
                  label="Rol *"
                  options={[
                    { value: "ADMIN", label: "ADMIN" },
                    { value: "USER", label: "USER" },
                    { value: "EMPLEADO", label: "EMPLEADO" },
                  ]}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="u_num"
                  label="No. Empleado"
                  value={form.numeroEmpleado}
                  onChange={(e) => setForm((f) => ({ ...f, numeroEmpleado: e.target.value }))}
                />
              </ITGrid>
              <ITGrid item xs={12} md={4}>
                <ITInput
                  name="u_puesto"
                  label="Puesto"
                  value={form.puesto}
                  onChange={(e) => setForm((f) => ({ ...f, puesto: e.target.value }))}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITSelect
                  name="u_dept"
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
              <ITGrid item xs={12} md={6}>
                <ITSelect
                  name="u_sub"
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