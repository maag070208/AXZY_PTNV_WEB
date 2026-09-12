import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITLoader,
  ITPage,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import {
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
        title="Detalle de departamento"
        backAction={() => navigate(-1)}
        icon={<FaBuilding size={20} />}
        breadcrumbs={[
          { label: "Departamentos", onClick: () => navigate("/departamentos") },
          { label: "Detalle" },
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
      title="Detalle del departamento"
      description={dept.name}
      backAction={() => navigate(-1)}
      icon={<FaBuilding size={20} />}
      breadcrumbs={[
        { label: "Departamentos", onClick: () => navigate("/departamentos") },
        { label: dept.name },
      ]}
      actions={
        isAdmin ? (
          <ITButton
            variant="outlined"
            size="small"
            color="danger"
            onClick={() => detail.setDeptToDelete(true)}
            title={dept.active ? "Eliminar departamento" : "Eliminar definitivamente"}
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

      <DepartmentInfoCard
        dept={dept}
        isAdmin={isAdmin}
        newSubarea={detail.newSubarea}
        onNewSubarea={detail.setNewSubarea}
        onAddSubarea={detail.handleAddSubarea}
        onRemoveSubarea={detail.setSubareaToDelete}
      />

      <ITConfirmDialog
        isOpen={!!detail.subareaToDelete}
        onClose={() => detail.setSubareaToDelete(null)}
        onConfirm={detail.confirmRemoveSubarea}
        title={detail.subareaToDelete?.active ? "Eliminar subárea" : "Eliminar definitivamente"}
        message={
          detail.subareaToDelete?.active
            ? `¿Eliminar la subárea "${detail.subareaToDelete?.name}"? Se desactivará.`
            : `¿Eliminar definitivamente la subárea "${detail.subareaToDelete?.name}"? Esta acción no se puede deshacer.`
        }
        confirmLabel={detail.subareaToDelete?.active ? tt("common:actions.delete") : "Eliminar definitivamente"}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />

      <ITConfirmDialog
        isOpen={detail.deptToDelete}
        onClose={() => detail.setDeptToDelete(false)}
        onConfirm={detail.confirmDeleteDept}
        title={dept.active ? "Eliminar departamento" : "Eliminar definitivamente"}
        message={
          dept.active
            ? `¿Eliminar ${dept.name}? Se desactivará; si tiene usuarios asociados no se podrá eliminar.`
            : `¿Eliminar definitivamente ${dept.name}? Se borrarán sus áreas y se desligará de usuarios y tickets. Esta acción no se puede deshacer.`
        }
        confirmLabel={dept.active ? tt("common:actions.delete") : "Eliminar definitivamente"}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}