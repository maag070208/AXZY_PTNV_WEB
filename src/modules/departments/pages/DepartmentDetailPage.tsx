import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaPlus, FaTimes, FaUsers } from "react-icons/fa";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { RootState } from "@core/store/store";
import {
  departmentsApi,
  type Department,
  type Subarea,
} from "@core/api/departments.api";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [dept, setDept] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSubarea, setNewSubarea] = useState("");
  const [subareaToDelete, setSubareaToDelete] = useState<Subarea | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setDept(await departmentsApi.get(id));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddSubarea = async () => {
    if (!id || !newSubarea.trim()) return;
    try {
      await departmentsApi.addSubarea(id, newSubarea);
      setNewSubarea("");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const confirmRemoveSubarea = async () => {
    if (!subareaToDelete) return;
    try {
      await departmentsApi.removeSubarea(subareaToDelete.id);
      setSubareaToDelete(null);
      await load();
    } catch (e: any) {
      setError(e.message);
      setSubareaToDelete(null);
    }
  };

  if (!dept) {
    return (
      <ITPage
        title="Detalle de departamento"
        backAction={() => navigate(-1)}
        icon={<FaBuilding size={20} />}
        breadcrumbs={[
          { label: "Departamentos", onClick: () => navigate("/departamentos") },
          { label: "Detalle" },
        ]}
      >
        {error ? (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        ) : (
          <ITFlex justify="center">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        )}
      </ITPage>
    );
  }

  return (
    <ITPage
      title="Detalle del departamento"
      description={dept.name}
      backAction={() => navigate(-1)}
      icon={<FaBuilding size={20} />}
      breadcrumbs={[
        { label: "Departamentos", onClick: () => navigate("/departamentos") },
        { label: dept.name },
      ]}
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={5}>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Departamento
              </ITText>
              <ITText className="font-bold uppercase tracking-tight text-slate-800">
                {dept.name}
              </ITText>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} md={3}>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Estado
              </ITText>
              <ITFlex align="center" gap={2}>
                <ITBadget color={dept.active ? "success" : "danger"} size="small">
                  {dept.active ? "Activo" : "Inactivo"}
                </ITBadget>
              </ITFlex>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} md={4}>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Usuarios
              </ITText>
              <ITFlex align="center" gap={2} className="text-slate-600">
                <FaUsers size={14} />
                <ITText className="font-bold">{dept._count?.users ?? 0} usuario(s)</ITText>
              </ITFlex>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12}>
            <ITFlex direction="column" gap={2}>
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Áreas
              </ITText>
              {dept.subareas.length === 0 ? (
                <ITText className="text-[12px] font-bold text-slate-400">
                  Este departamento aún no tiene subáreas.
                </ITText>
              ) : (
                <ITFlex wrap="wrap" gap={2}>
                  {dept.subareas.map((s) => (
                    <ITFlex
                      key={s.id}
                      align="center"
                      gap={2}
                      className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200"
                    >
                      <ITText className="text-[11px] font-black uppercase tracking-wide">
                        {s.name}
                      </ITText>
                      {isAdmin && (
                        <FaTimes
                          size={10}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          onClick={() => setSubareaToDelete(s)}
                          title="Eliminar subárea"
                        />
                      )}
                    </ITFlex>
                  ))}
                </ITFlex>
              )}
            </ITFlex>
          </ITGrid>

          {isAdmin && (
            <ITGrid item xs={12}>
              <ITFlex gap={2}>
                <ITInput
                  name="newSubarea"
                  value={newSubarea}
                  onChange={(e) => setNewSubarea(e.target.value)}
                  placeholder="Nueva subárea…"
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubarea()}
                  className="flex-1"
                />
                <ITButton
                  variant="filled"
                  color="primary"
                  onClick={handleAddSubarea}
                  disabled={!newSubarea.trim()}
                  title="Agregar subárea"
                >
                  <ITFlex align="center" gap={1}>
                    <FaPlus size={12} />
                    <ITText className="font-bold text-[11px]">Agregar</ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITGrid>
          )}
        </ITGrid>
      </ITCard>

      <ITConfirmDialog
        isOpen={!!subareaToDelete}
        onClose={() => setSubareaToDelete(null)}
        onConfirm={confirmRemoveSubarea}
        title="Eliminar subárea"
        message={`¿Eliminar la subárea "${subareaToDelete?.name}"?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}