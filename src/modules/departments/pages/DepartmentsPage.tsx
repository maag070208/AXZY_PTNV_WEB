import {
  ITAlert,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@core/store/store";
import {
  departmentsApi,
  type Department,
  type Subarea,
} from "@core/api/departments.api";

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [newDept, setNewDept] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const handleCreateDept = async () => {
    if (!newDept.trim()) return;
    try {
      await departmentsApi.create({ name: newDept });
      setNewDept("");
      setCreateOpen(false);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmDeleteDept = async () => {
    if (!deptToDelete) return;
    try {
      await departmentsApi.remove(deptToDelete.id);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message);
    }
    setDeptToDelete(null);
  };

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await departmentsApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: "DEPARTAMENTO",
      sortable: false,
      filter: true,
      render: (d: Department) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="font-black text-slate-800 uppercase text-[12px] tracking-tight">
            {d.name}
          </ITText>
          {!d.active && (
            <ITText className="text-[9px] font-bold uppercase tracking-widest text-rose-500 border border-rose-200 rounded-full px-2 py-0.5 w-fit">
              inactivo
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "subareas",
      label: "ÁREAS",
      render: (d: Department) =>
        d.subareas.length === 0 ? (
          <ITText className="text-[10px] font-bold text-slate-400 uppercase">
            Sin áreas
          </ITText>
        ) : (
          <ITFlex wrap="wrap" gap={1}>
            {d.subareas.map((s: Subarea) => (
              <ITBadget key={s.id} color="primary" size="small">
                {s.name.toUpperCase()}
              </ITBadget>
            ))}
          </ITFlex>
        ),
    },
    {
      type: "number",
      key: "count",
      label: "USUARIOS",
      render: (d: Department) => (
        <ITText className="text-[11px] font-black text-slate-600">
          {d._count?.users ?? 0}
        </ITText>
      ),
    },
    {
      type: "actions" as const,
      key: "actions",
      label: "",
      align: "right" as const,
      render: (d: Department) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="small"
            color="info"
            onClick={() => navigate(`/departamentos/${d.id}`)}
            title="Ver detalle"
          >
            <FaEye size={14} />
          </ITButton>
          {isAdmin && (
            <ITButton
              variant="outlined"
              size="small"
              color="danger"
              onClick={() => setDeptToDelete(d)}
              title="Eliminar departamento"
            >
              <FaTrash size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title="Departamentos"
      description="Estructura organizacional de Puerto Nuevo"
      backAction={() => navigate("/")}
      icon={<FaBuilding size={20} />}
      actions={
        isAdmin ? (
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => setCreateOpen(true)}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo departamento</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDataTable
        columns={columns as any}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />

      <ITDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo departamento"
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="newDept"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            placeholder="Ej. RECEPCIÓN"
            onKeyDown={(e) => e.key === "Enter" && handleCreateDept()}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => setCreateOpen(false)}>
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleCreateDept}
              disabled={!newDept.trim()}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">Crear</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={confirmDeleteDept}
        title="Eliminar departamento"
        message={`¿Eliminar ${deptToDelete?.name}? Si tiene usuarios asociados no se podrá eliminar.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}