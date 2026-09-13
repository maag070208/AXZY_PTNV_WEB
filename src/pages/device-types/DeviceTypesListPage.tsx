import {
  ITButton,
  ITDataTable,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaTag } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  useDeviceTypesList,
  deviceTypesColumns,
  DeviceTypeStatsGrid,
} from "@features/device-type/device-types-list";

export default function DeviceTypesListPage() {
  const { t: tt } = useTranslation(["device-types"]);
  const { navigate, stats, fetchTableData } = useDeviceTypesList();
  const columns = deviceTypesColumns(navigate);

  return (
    <ITPage
      title={tt("list.title")}
      description={tt("list.description")}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("list.breadcrumbDevices"), onClick: () => navigate("/dispositivos") },
        { label: tt("list.breadcrumbList") },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => navigate("/dispositivos/tipos/nuevo")}
        >
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{tt("list.newType")}</ITText>
          </ITFlex>
        </ITButton>
      }
      icon={<FaTag size={20} />}
      maxWidth="7xl"
    >
      <ITFlex direction="column" gap={4}>
        <DeviceTypeStatsGrid stats={stats} />
        <ITDataTable
          columns={columns as any}
          fetchData={
            fetchTableData as unknown as (
              p: ITDataTableFetchParams
            ) => Promise<ITDataTableResponse<Record<string, unknown>>>
          }
          defaultView="table"
          defaultItemsPerPage={10}
          size="sm"
        />
      </ITFlex>
    </ITPage>
  );
}