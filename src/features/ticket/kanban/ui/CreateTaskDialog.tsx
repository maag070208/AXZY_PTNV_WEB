import {
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaUserPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseKanban } from "../model/useKanban";

interface Props {
  fx: UseKanban;
}

export default function CreateTaskDialog({ fx }: Props) {
  const { t: tt } = useTranslation(["tickets", "common"]);

  return (
    <ITDialog
      isOpen={fx.showCreatePanel}
      className="w-full max-w-lg"
      onClose={() => {
        fx.setShowCreatePanel(false);
        fx.resetCreateForm();
      }}
    >
      <div className="pb-3 mb-3 border-b border-slate-100 pr-6">
        <ITFlex align="center" gap={2}>
          <FaUserPlus size={14} className="text-emerald-500" />
          <ITText className="text-lg font-black text-slate-800">
            {tt("kanban.newTask")}
          </ITText>
        </ITFlex>
        <ITText className="text-[11px] text-slate-400 mt-1">
          {tt("kanban.subtitle")}
        </ITText>
      </div>
      <ITGrid container columns={12} spacing={2}>
        <ITGrid item xs={12}>
          <ITSearchSelect
            name="createTicket"
            label={tt("kanban.ticketLabel")}
            placeholder={tt("kanban.searchTicket")}
            options={fx.ticketSelectOptions}
            value={fx.createTicketId}
            onChange={(value) => fx.setCreateTicketId(String(value))}
            onSearch={fx.handleSearchTickets}
            isLoading={fx.busyTickets}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITSearchSelect
            name="createEmployee"
            label={tt("kanban.employeeLabel")}
            placeholder={tt("kanban.searchEmployee")}
            options={fx.employeeOptions}
            value={fx.createUserId}
            onChange={(value) => fx.setCreateUserId(String(value))}
            onSearch={fx.handleSearchEmployees}
            isLoading={fx.busyEmployees}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITInput
            name="createTaskTitle"
            label={tt("kanban.taskTitle")}
            value={fx.createTitle}
            onChange={(event) => fx.setCreateTitle(event.target.value)}
            placeholder={tt("kanban.taskTitleExample")}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITTextarea
            name="createTaskDescription"
            label={tt("kanban.taskDescription")}
            value={fx.createDescription}
            onChange={fx.setCreateDescription}
            rows={2}
            placeholder={tt("kanban.taskDescPlaceholder")}
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITDatePicker
            name="createStart"
            label={tt("kanban.startDate")}
            value={fx.createStart ? new Date(fx.createStart) : undefined}
            onChange={(event: any) =>
              fx.setCreateStart(
                event.target.value ? event.target.value.toISOString() : ""
              )
            }
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITDatePicker
            name="createDue"
            label={tt("kanban.dueDate")}
            value={fx.createDue ? new Date(fx.createDue) : undefined}
            onChange={(event: any) =>
              fx.setCreateDue(
                event.target.value ? event.target.value.toISOString() : ""
              )
            }
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              size="lg"
              onClick={() => {
                fx.setShowCreatePanel(false);
                fx.resetCreateForm();
              }}
            >
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="lg"
              onClick={fx.handleCreateTask}
              disabled={
                fx.creatingTask ||
                !fx.createTicketId ||
                !fx.createUserId ||
                !fx.createTitle.trim()
              }
            >
              <ITFlex align="center" gap={1}>
                <FaUserPlus size={11} />
                <ITText className="font-bold text-[10px]">
                  {fx.creatingTask ? tt("kanban.assigning") : tt("kanban.assignTask")}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITDialog>
  );
}