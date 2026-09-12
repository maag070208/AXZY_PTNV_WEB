import {
  ITAlert,
  ITButton,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaUserTie } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@app/store";
import {
  EmployeesTable,
  useEmployeesList,
} from "@features/user/employees-list";

export default function EmployeesListPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const list = useEmployeesList();

  return (
    <ITPage
      title="Empleados"
      description={`${list.total} empleado(s) activo(s)`}
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
      {list.error && (
        <ITAlert variant="error" dismissible onDismiss={() => list.setError(null)}>
          {list.error}
        </ITAlert>
      )}

      <EmployeesTable
        departments={list.departments}
        isAdmin={isAdmin}
        fetchData={list.fetchTableData}
        reloadKey={list.reloadKey}
        onEdit={(u) => navigate(`/empleados/${u.id}/editar`)}
      />
    </ITPage>
  );
}