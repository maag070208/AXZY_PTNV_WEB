import { ITFlex, ITGrid, ITSelect, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaUserCog } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { CATEGORY_KEYS, STATUS_BADGE } from "@entities/ticket";
import { dyn } from "@shared/i18n/dyn";
import TasksGraph from "./TasksGraph";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  renderAssignmentAttachments: (args: {
    ticketId: string;
    assignmentId: string;
    canUpload: boolean;
  }) => React.ReactNode;
}

export default function TicketManagerPanel({ fx, renderAssignmentAttachments }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const statusOptions = Object.keys(STATUS_BADGE).map((value) => ({
    value,
    label: dyn(tt)(`statusLabels.${value}`),
  }));
  const categoryOptions = CATEGORY_KEYS.map((value) => ({
    value,
    label: dyn(tt)(`categoryLabels.${value}`),
  }));

  return (
    <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
      <ITStack direction="column" spacing={4} className="w-full">
        <ITFlex align="center" gap={2}>
          <FaUserCog size={14} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("detail.manageTitle")}
          </ITText>
        </ITFlex>

        {fx.isAdmin && (
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} sm={4}>
              <ITSelect
                name="status"
                label={tt("detail.status")}
                options={statusOptions}
                value={ticket.status}
                onChange={(e) => fx.handleStatusChange(e.target.value)}
                disabled={fx.isClosed}
              />
            </ITGrid>
            <ITGrid item xs={12} sm={4}>
              <ITSelect
                name="category"
                label={tt("detail.category")}
                options={categoryOptions}
                value={ticket.category}
                onChange={(e) => fx.handleCategoryChange(e.target.value)}
                disabled={fx.isClosed}
              />
            </ITGrid>
            <ITGrid item xs={12} sm={4}>
              <ITSelect
                name="department"
                label={tt("detail.department")}
                options={[
                  { value: "", label: tt("detail.unassigned") },
                  ...fx.departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={ticket.departmentId ?? ""}
                onChange={(e) => fx.handleDepartmentChange(e.target.value)}
                disabled={fx.isClosed}
              />
            </ITGrid>
          </ITGrid>
        )}

        {(fx.isAdmin || fx.isGerente) && (
          <ITSelect
            name="responsable"
            label={tt("detail.responsible")}
            options={[
              { value: "", label: tt("detail.noResponsible") },
              ...fx.responsableOptions,
            ]}
            value={ticket.asignadoAId ?? ""}
            onChange={(e) => fx.handleResponsibleChange(e.target.value)}
            disabled={fx.isClosed}
          />
        )}

        <TasksGraph fx={fx} canManage renderAssignmentAttachments={renderAssignmentAttachments} />
      </ITStack>
    </ITFlex>
  );
}