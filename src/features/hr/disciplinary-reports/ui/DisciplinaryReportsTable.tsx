import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaEye, FaTrash } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import type { DisciplinaryReport } from "@entities/hr";

type BadgeColor = "error" | "warning" | "info" | "success" | "danger" | "primary" | "secondary" | "purple" | "gray";

const REASON_COLOR: Record<string, BadgeColor> = {
  ABSENCE: "danger",
  TARDINESS: "warning",
  INTOXICATION: "danger",
  MISCONDUCT: "warning",
  NONCOMPLIANCE: "warning",
  OTHER: "secondary",
};

interface Props {
  fetchData: (
    params: ITDataTableFetchParams
  ) => Promise<ITDataTableResponse<Record<string, unknown>>>;
  reloadKey: number;
  onView: (disciplinaryReport: DisciplinaryReport) => void;
  onDelete: (disciplinaryReport: DisciplinaryReport) => void;
}

export default function DisciplinaryReportsTable({
  fetchData,
  reloadKey,
  onView,
  onDelete,
}: Props) {
  const { t: tt } = useTranslation("disciplinary-reports");

  const columns: Column<DisciplinaryReport>[] = [
    {
      key: "incidentDate",
      label: tt("table.date"),
      type: "string",
      width: 140,
      filter: true,
      sortable: false,
      render: (a) => (
        <ITText className="text-[11px] font-black text-slate-700">{a.incidentDate}</ITText>
      ),
    },
    {
      key: "reason",
      label: tt("table.reason"),
      type: "string",
      width: 140,
      filter: true,
      sortable: false,
      render: (a) => (
        <ITBadget color={REASON_COLOR[a.reason] ?? "secondary"} size="lg">
          {tt(`reasons.${a.reason}`)}
        </ITBadget>
      ),
    },
    {
      key: "user",
      label: tt("table.employee"),
      type: "string",
      width: 220,
      filter: true,
      sortable: false,
      render: (a) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{a.user.name}</ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {a.user.employeeNumber ? `#${a.user.employeeNumber}` : "—"}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "jobTitle",
      label: tt("table.jobTitle"),
      type: "string",
      width: 220,
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {a.user.jobTitle ?? "—"}
        </ITText>
      ),
    },
    {
      key: "description",
      label: tt("table.description"),
      type: "string",
      width: 300,
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[10px] text-slate-500 line-clamp-2 max-w-[260px]">
          {a.description}
        </ITText>
      ),
    },
    {
      key: "sanction",
      label: tt("table.sanction"),
      type: "string",
      width: 200,
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[10px] text-slate-500 line-clamp-2 max-w-[200px]">
          {a.sanction || "—"}
        </ITText>
      ),
    },
    {
      key: "createdBy",
      label: tt("table.createdBy"),
      type: "string",
      width: 200,
      filter: false,
      sortable: false,
      render: (a) => (
        <ITText className="text-[10px] font-bold text-slate-500">{a.createdBy.name}</ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "string" as const,
      width: 120,
      sortable: false,
      render: (a: DisciplinaryReport) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            onClick={() => onView(a)}
            size="lg"
            color="secondary"
            title={tt("actions.view")}
          >
            <FaEye size={14} />
          </ITButton>
          <ITButton
            onClick={() => onDelete(a)}
            size="lg"
            color="danger"
            title={tt("actions.delete")}
          >
            <FaTrash size={14} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITDataTable
      columns={columns as unknown as Column<Record<string, unknown>>[]}
      fetchData={
        fetchData as unknown as (
          p: ITDataTableFetchParams
        ) => Promise<ITDataTableResponse<Record<string, unknown>>>
      }
      reloadTrigger={reloadKey}
      defaultItemsPerPage={100}
      itemsPerPageOptions={[50, 100, 150]}
      size="lg"
      virtualized
      virtualizedMaxHeight={420}
      rowHeight={50}
      onRowClick={(row) => onView(row as unknown as DisciplinaryReport)}
    />
  );
}