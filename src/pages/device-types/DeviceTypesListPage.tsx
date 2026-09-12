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
import {
  useDeviceTypesList,
  deviceTypesColumns,
} from "@features/device-type/device-types-list";

export default function DeviceTypesListPage() {
  const { navigate, fetchTableData } = useDeviceTypesList();
  const columns = deviceTypesColumns(navigate);

  return (
    <ITPage
      title="Tipos de dispositivo"
      description="Cada tipo tiene su propio consecutivo (prefijo)"
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Dispositivos", onClick: () => navigate("/dispositivos") },
        { label: "Tipos" },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={() => navigate("/dispositivos/tipos/nuevo")}
        >
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">Nuevo tipo</ITText>
          </ITFlex>
        </ITButton>
      }
      icon={<FaTag size={20} />}
      maxWidth="7xl"
    >
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
    </ITPage>
  );
}