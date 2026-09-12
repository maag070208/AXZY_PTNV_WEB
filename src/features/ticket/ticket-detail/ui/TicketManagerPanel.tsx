import { ITFlex, ITGrid, ITSelect, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaUserCog } from "react-icons/fa";
import { CATEGORY_LABELS, STATUS_LABELS } from "@entities/ticket";
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

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function TicketManagerPanel({ fx, renderAssignmentAttachments }: Props) {
  const ticket = fx.ticket;
  if (!ticket) return null;

  return (
    <ITFlex className="bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-6 lg:p-8">
      <ITStack direction="column" spacing={4} className="w-full">
        <ITFlex align="center" gap={2}>
          <FaUserCog size={14} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Administrar ticket
          </ITText>
        </ITFlex>

        {fx.isAdmin && (
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} sm={4}>
              <ITSelect
                name="status"
                label="Estado"
                options={STATUS_OPTIONS}
                value={ticket.status}
                onChange={(e) => fx.handleStatusChange(e.target.value)}
                disabled={fx.isClosed}
              />
            </ITGrid>
            <ITGrid item xs={12} sm={4}>
              <ITSelect
                name="category"
                label="Categoría"
                options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={ticket.category}
                onChange={(e) => fx.handleCategoryChange(e.target.value)}
                disabled={fx.isClosed}
              />
            </ITGrid>
            <ITGrid item xs={12} sm={4}>
              <ITSelect
                name="department"
                label="Departamento"
                options={[
                  { value: "", label: "Sin asignar" },
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
            label="Responsable"
            options={[
              { value: "", label: "Sin responsable" },
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