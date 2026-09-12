import {
  ITAlert,
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaSave, FaUserTie } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import {
  EmployeeFormFields,
  useEmployeeForm,
} from "@features/user/employee-form";

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const employeeForm = useEmployeeForm(id);
  const isEdit = employeeForm.isEdit;

  const handleSubmit = () => {
    employeeForm.handleSubmit().then((ok) => {
      if (ok) navigate("/empleados");
    });
  };

  if (employeeForm.loading) {
    return (
      <ITPage
        title={isEdit ? "Editar empleado" : "Nuevo empleado"}
        loading
        backAction={() => navigate(-1)}
        icon={<FaUserTie size={20} />}
        breadcrumbs={[
          { label: "Empleados", onClick: () => navigate("/empleados") },
          { label: isEdit ? "Editar" : "Nuevo" },
        ]}
      >
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const actions = (
    <ITFlex gap={2}>
      <ITButton variant="outlined" onClick={() => navigate("/empleados")}>
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSubmit}
        disabled={employeeForm.saving || !employeeForm.canSubmit}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">
            {employeeForm.saving ? "Guardando…" : "Guardar"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={isEdit ? "Editar empleado" : "Nuevo empleado"}
      backAction={() => navigate(-1)}
      icon={<FaUserTie size={20} />}
      breadcrumbs={[
        { label: "Empleados", onClick: () => navigate("/empleados") },
        { label: isEdit ? "Editar" : "Nuevo" },
      ]}
      actions={actions}
      maxWidth="7xl"
    >
      {employeeForm.error && (
        <ITAlert
          variant="error"
          dismissible
          onDismiss={() => employeeForm.setError(null)}
        >
          {employeeForm.error}
        </ITAlert>
      )}

      <EmployeeFormFields
        isEdit={isEdit}
        form={employeeForm.form}
        onFieldChange={employeeForm.handleField}
        onDepartmentChange={employeeForm.handleDepartmentChange}
        departments={employeeForm.departments}
        selectedDept={employeeForm.selectedDept}
      />
    </ITPage>
  );
}