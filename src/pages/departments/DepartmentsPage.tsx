import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import {
  DepartmentsTable,
  useDepartmentsCrud,
} from "@features/department/departments-list";

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["departments", "common"]);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const crud = useDepartmentsCrud();

  return (
    <ITPage
      title="Departamentos"
      description="Estructura organizacional de Puerto Nuevo"
      backAction={() => navigate(-1)}
      icon={<FaBuilding size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: "Departamentos" },
      ]}
      actions={
        isAdmin ? (
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => crud.setCreateOpen(true)}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo departamento</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      {crud.error && (
        <ITAlert variant="error" dismissible onDismiss={() => crud.setError(null)}>
          {crud.error}
        </ITAlert>
      )}

      <DepartmentsTable
        fetchData={crud.fetchTableData}
        reloadKey={crud.reloadKey}
        isAdmin={isAdmin}
        onView={(d) => navigate(`/departamentos/${d.id}`)}
        onEdit={crud.openEditDept}
        onDelete={crud.setDeptToDelete}
      />

      <ITDialog
        isOpen={crud.createOpen}
        onClose={() => crud.setCreateOpen(false)}
        className="it-dialog-panel"
        title="Nuevo departamento"
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="newDept"
            value={crud.newDept}
            onChange={(e) => crud.setNewDept(e.target.value)}
            placeholder="Ej. RECEPCIÓN"
            onKeyDown={(e) => e.key === "Enter" && crud.handleCreateDept()}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => crud.setCreateOpen(false)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={crud.handleCreateDept}
              disabled={!crud.newDept.trim()}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">Crear</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={!!crud.deptToEdit}
        onClose={() => crud.setDeptToEdit(null)}
        className="it-dialog-panel"
        title="Editar departamento"
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="editDept"
            value={crud.editName}
            onChange={(e) => crud.setEditName(e.target.value)}
            placeholder="Nombre del departamento"
            onKeyDown={(e) => e.key === "Enter" && crud.handleUpdateDept()}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => crud.setDeptToEdit(null)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={crud.handleUpdateDept}
              disabled={!crud.editName.trim()}
            >
              <ITText className="font-bold text-[11px]">{tt("common:actions.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!crud.deptToDelete}
        onClose={() => crud.setDeptToDelete(null)}
        onConfirm={crud.confirmDeleteDept}
        title={crud.deptToDelete?.active ? "Eliminar departamento" : "Eliminar definitivamente"}
        message={
          crud.deptToDelete?.active
            ? `¿Eliminar ${crud.deptToDelete?.name}? Se desactivará; si tiene usuarios asociados no se podrá eliminar.`
            : `¿Eliminar definitivamente ${crud.deptToDelete?.name}? Se borrarán sus áreas y se desligará de usuarios y tickets. Esta acción no se puede deshacer.`
        }
        confirmLabel={crud.deptToDelete?.active ? tt("common:actions.delete") : "Eliminar definitivamente"}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}