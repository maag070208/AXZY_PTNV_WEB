import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  SubareasTable,
  useSubareasCrud,
} from "@features/subarea/subareas-crud";

export default function SubareasPanel({ openCreateSignal }: { openCreateSignal?: number }) {
  const { t: tt } = useTranslation(["subareas", "common"]);

  const crud = useSubareasCrud();

  const lastSignal = useRef(openCreateSignal);
  const openCreate = useRef<() => void>(() => {});
  openCreate.current = () => crud.setCreateOpen(true);
  useEffect(() => {
    if (openCreateSignal === lastSignal.current) return;
    lastSignal.current = openCreateSignal;
    openCreate.current();
  }, [openCreateSignal]);

  const departmentOptions = crud.departments.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <>
      {crud.error && (
        <ITAlert variant="error" dismissible onDismiss={() => crud.setError(null)}>
          {crud.error}
        </ITAlert>
      )}

      <SubareasTable
        fetchData={crud.fetchTableData}
        reloadKey={crud.reloadKey}
        onEdit={crud.openEdit}
        onReactivate={crud.handleReactivate}
        onDelete={crud.setSubareaToDelete}
      />

      <ITDialog
        isOpen={crud.createOpen}
        onClose={() => crud.setCreateOpen(false)}
        className="it-dialog-panel"
        title={tt("list.new")}
      >
        <ITFlex direction="column" gap={3}>
          <ITSelect
            name="newDepartmentId"
            label={tt("list.colDepartment")}
            options={departmentOptions}
            value={crud.newDepartmentId}
            onChange={(e) => crud.setNewDepartmentId(e.target.value)}
            placeholder={tt("list.departmentPlaceholder")}
          />
          <ITInput
            name="newName"
            label={tt("list.colName")}
            value={crud.newName}
            onChange={(e) => crud.setNewName(e.target.value)}
            placeholder={tt("list.newPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && crud.handleCreate()}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => crud.setCreateOpen(false)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={crud.handleCreate}
              disabled={!crud.newName.trim() || !crud.newDepartmentId}
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
        isOpen={!!crud.subareaToEdit}
        onClose={() => crud.setSubareaToEdit(null)}
        className="it-dialog-panel"
        title={tt("list.editTitle")}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="editName"
            value={crud.editName}
            onChange={(e) => crud.setEditName(e.target.value)}
            placeholder={tt("list.editPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && crud.handleUpdate()}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => crud.setSubareaToEdit(null)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={crud.handleUpdate}
              disabled={!crud.editName.trim()}
            >
              <ITText className="font-bold text-[11px]">{tt("common:actions.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!crud.subareaToDelete}
        onClose={() => crud.setSubareaToDelete(null)}
        onConfirm={crud.confirmDelete}
        title={crud.subareaToDelete?.active ? tt("list.delete") : tt("list.deleteForever")}
        message={
          crud.subareaToDelete?.active
            ? tt("list.deleteActive", { name: crud.subareaToDelete?.name })
            : tt("list.deleteForeverMsg", { name: crud.subareaToDelete?.name })
        }
        confirmLabel={crud.subareaToDelete?.active ? tt("common:actions.delete") : tt("list.deleteForever")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </>
  );
}