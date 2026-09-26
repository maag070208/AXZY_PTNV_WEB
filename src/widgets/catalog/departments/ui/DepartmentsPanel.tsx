import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITInput,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  DepartmentsTable,
  useDepartmentsCrud,
} from "@features/department/departments-list";

export default function DepartmentsPanel({ openCreateSignal }: { openCreateSignal?: number }) {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["departments", "common"]);

  const crud = useDepartmentsCrud();

  const lastSignal = useRef(openCreateSignal);
  const openCreate = useRef<() => void>(() => {});
  openCreate.current = () => crud.setCreateOpen(true);
  useEffect(() => {
    if (openCreateSignal === lastSignal.current) return;
    lastSignal.current = openCreateSignal;
    openCreate.current();
  }, [openCreateSignal]);

  return (
    <>
      {crud.error && (
        <ITAlert variant="error" dismissible onDismiss={() => crud.setError(null)}>
          {crud.error}
        </ITAlert>
      )}

      <DepartmentsTable
        fetchData={crud.fetchTableData}
        reloadKey={crud.reloadKey}
        canManage
        onView={(d) => navigate(`/departments/${d.id}`)}
        onEdit={crud.openEditDept}
        onDelete={crud.setDeptToDelete}
      />

      <ITDialog
        isOpen={crud.createOpen}
        onClose={() => crud.setCreateOpen(false)}
        className="it-dialog-panel"
        title={tt("list.new")}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="newDept"
            value={crud.newDept}
            onChange={(e) => crud.setNewDept(e.target.value)}
            placeholder={tt("list.newPlaceholder")}
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
                <ITText className="font-bold text-[11px]">{tt("list.create")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={!!crud.deptToEdit}
        onClose={() => crud.setDeptToEdit(null)}
        className="it-dialog-panel"
        title={tt("list.editTitle")}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="editDept"
            value={crud.editName}
            onChange={(e) => crud.setEditName(e.target.value)}
            placeholder={tt("list.editPlaceholder")}
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
        title={crud.deptToDelete?.active ? tt("list.delete") : tt("list.deleteForever")}
        message={
          crud.deptToDelete?.active
            ? tt("list.deleteActive", { name: crud.deptToDelete?.name })
            : tt("list.deleteForeverMsg", { name: crud.deptToDelete?.name })
        }
        confirmLabel={crud.deptToDelete?.active ? tt("common:actions.delete") : tt("list.deleteForever")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </>
  );
}