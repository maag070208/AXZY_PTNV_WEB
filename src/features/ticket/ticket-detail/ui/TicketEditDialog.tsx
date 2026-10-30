import { ITButton, ITDialog, ITFlex, ITGrid, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { LuPencil } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { STATUS_BADGE } from "@entities/ticket";
import { dyn } from "@shared/i18n/dyn";
import { DialogHeader } from "@shared/ui/dialog-header";
import type { UseTicketDetail } from "../model/useTicketDetail";

interface Props {
  fx: UseTicketDetail;
  open: boolean;
  onClose: () => void;
}

/**
 * Edición del ticket (estado, categoría y departamento) en un diálogo. El
 * responsable se elige directo en la tarjeta del detalle (`TicketInfoCard`).
 * Cada campo se guarda al elegirlo (los avisos y el refresco los lleva
 * `useTicketDetail`).
 */
export default function TicketEditDialog({ fx, open, onClose }: Props) {
  const { t: tt } = useTranslation("tickets");
  const ticket = fx.ticket;
  if (!ticket) return null;

  const statusOptions = Object.keys(STATUS_BADGE).map((value) => ({
    value,
    label: dyn(tt)(`statusLabels.${value}`),
  }));

  return (
    <ITDialog isOpen={open} onClose={onClose}>
      <DialogHeader icon={<LuPencil size={20} />} title={tt("detail.editTitle")} subtitle={tt("detail.editHint")} />
      <ITFlex direction="column" gap={4}>

        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} sm={6}>
            <ITSelect
              name="status"
              label={tt("detail.status")}
              options={statusOptions}
              value={ticket.status}
              onChange={(e) => fx.handleStatusChange(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6}>
            <ITSelect
              name="category"
              label={tt("detail.category")}
              options={fx.categories.map((c) => ({ value: c.id, label: c.name }))}
              value={ticket.categoryId ?? ""}
              onChange={(e) => fx.handleCategoryChange(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} sm={6}>
            <ITSelect
              name="department"
              label={tt("detail.department")}
              options={[
                { value: "", label: tt("detail.unassigned") },
                ...fx.departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
              value={ticket.departmentId ?? ""}
              onChange={(e) => fx.handleDepartmentChange(e.target.value)}
            />
          </ITGrid>
        </ITGrid>

        <ITFlex justify="end">
          <ITButton variant="filled" color="primary" size="sm" onClick={onClose}>
            <ITText className="!text-[11px] font-bold">{tt("detail.done")}</ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
