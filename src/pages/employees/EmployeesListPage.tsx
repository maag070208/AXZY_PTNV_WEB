import {
  ITAlert,
  ITButton,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  EmployeesTable,
  useEmployeesList,
} from "@features/user/employees-list";

export default function EmployeesListPage() {
  const { t: tt } = useTranslation(["employees", "common"]);
  const navigate = useNavigate();
  const canEditEmployees = useCan("hr.records");

  const list = useEmployeesList();

  return (
    <ITPage
      title={tt("title")}
      description={tt("description", { count: list.total })}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("common:nav.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb") },
      ]}
      actions={
        canEditEmployees ? (
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => navigate("/users/new")}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{tt("newEmployee")}</ITText>
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
        canEdit={canEditEmployees}
        fetchData={list.fetchTableData}
        reloadKey={list.reloadKey}
        onView={(u) => navigate(`/employees/${u.id}`)}
        onEdit={(u) => navigate(`/employees/${u.id}/edit`)}
      />
    </ITPage>
  );
}