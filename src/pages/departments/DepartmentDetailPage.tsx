import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import {
  DepartmentDetailAside,
  DepartmentInfoCard,
  useDepartmentDetail,
} from "@features/department/department-detail";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["departments", "common"]);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const detail = useDepartmentDetail(id, () => navigate("/departamentos"));

  if (!detail.dept) {
    return (
      <ITPage
        title={tt("detail.loadingTitle")}
        backAction={() => navigate(-1)}
        icon={<FaBuilding size={20} />}
        breadcrumbs={[
          { label: tt("detail.breadcrumbDepartments"), onClick: () => navigate("/departamentos") },
          { label: tt("detail.breadcrumbDetail") },
        ]}
      >
        {detail.error ? (
          <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
            {detail.error}
          </ITAlert>
        ) : (
          <ITFlex justify="center">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        )}
      </ITPage>
    );
  }

  const dept = detail.dept;

  return (
    <ITPage
      title={tt("detail.title")}
      description={dept.name}
      backAction={() => navigate(-1)}
      icon={<FaBuilding size={20} />}
      breadcrumbs={[
        { label: tt("detail.breadcrumbDepartments"), onClick: () => navigate("/departamentos") },
        { label: dept.name },
      ]}
      actions={
        isAdmin ? (
          <ITButton
            variant="outlined"
            size="sm"
            color="danger"
            onClick={() => detail.setDeptToDelete(true)}
            title={dept.active ? tt("detail.deleteDept") : tt("detail.deleteForever")}
          >
            {dept.active ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
          </ITButton>
        ) : undefined
      }
    >
      {detail.error && (
        <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
          {detail.error}
        </ITAlert>
      )}

      <ITGrid container columns={12} spacing={5} className="items-start">
        <ITGrid item xs={12} md={8} className="flex flex-col gap-5 min-w-0">
          <DepartmentInfoCard
            dept={dept}
            isAdmin={isAdmin}
            newSubarea={detail.newSubarea}
            onNewSubarea={detail.setNewSubarea}
            onAddSubarea={detail.handleAddSubarea}
            onEditSubarea={detail.openEditSubarea}
            onReactivateSubarea={detail.handleReactivateSubarea}
            onRemoveSubarea={detail.setSubareaToDelete}
          />
        </ITGrid>

        <ITGrid item xs={12} md={4} className="w-full min-w-0">
          <DepartmentDetailAside dept={dept} />
        </ITGrid>
      </ITGrid>

      <ITDialog
        isOpen={!!detail.subareaToEdit}
        onClose={() => detail.setSubareaToEdit(null)}
        className="it-dialog-panel"
        title={tt("detail.editSubareaTitle")}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="editSubarea"
            value={detail.editSubareaName}
            onChange={(e) => detail.setEditSubareaName(e.target.value)}
            placeholder={tt("detail.editSubareaPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && detail.handleUpdateSubarea()}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => detail.setSubareaToEdit(null)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={detail.handleUpdateSubarea}
              disabled={!detail.editSubareaName.trim()}
            >
              <ITText className="font-bold text-[11px]">{tt("common:actions.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!detail.subareaToDelete}
        onClose={() => detail.setSubareaToDelete(null)}
        onConfirm={detail.confirmRemoveSubarea}
        title={detail.subareaToDelete?.active ? tt("detail.removeSubarea") : tt("detail.deleteForever")}
        message={
          detail.subareaToDelete?.active
            ? tt("detail.deleteSubareaActive", { name: detail.subareaToDelete?.name })
            : tt("detail.deleteSubareaForever", { name: detail.subareaToDelete?.name })
        }
        confirmLabel={detail.subareaToDelete?.active ? tt("common:actions.delete") : tt("detail.deleteForever")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={detail.deptToDelete}
        onClose={() => detail.setDeptToDelete(false)}
        onConfirm={detail.confirmDeleteDept}
        title={dept.active ? tt("detail.deleteDept") : tt("detail.deleteForever")}
        message={
          dept.active
            ? tt("detail.deleteActive", { name: dept.name })
            : tt("detail.deleteForeverMsg", { name: dept.name })
        }
        confirmLabel={dept.active ? tt("common:actions.delete") : tt("detail.deleteForever")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}