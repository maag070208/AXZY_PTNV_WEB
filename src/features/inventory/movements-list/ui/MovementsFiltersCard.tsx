import {
  ITCard,
  ITDatePicker,
  ITFlex,
  ITSearchSelect,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { localDateString } from "@entities/inventory-movement";
import type { UseInventoryMovements } from "../model/useInventoryMovements";

export default function MovementsFiltersCard({ fx }: { fx: UseInventoryMovements }) {
  return (
    <ITCard className="p-4 mb-6">
      <ITStack direction="column" spacing={3}>
        <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {fx.t("movements.filters")}
        </ITText>
        <ITFlex gap={3} wrap="wrap">
          <ITFlex direction="column" gap={1} className="min-w-[220px] flex-1">
            <ITText className="text-[9px] text-slate-400 uppercase">
              {fx.t("movements.department")}
            </ITText>
            <ITSearchSelect
              name="department"
              placeholder={fx.t("movements.all")}
              options={fx.departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              value={fx.filterDepartment}
              onChange={(val) => fx.setFilterDepartment(val as string)}
            />
          </ITFlex>
          <ITFlex direction="column" gap={1} className="min-w-[220px] flex-1">
            <ITText className="text-[9px] text-slate-400 uppercase">
              {fx.t("movements.dateRange")}
            </ITText>
            <ITDatePicker
              name="dateRange"
              range={true}
              value={fx.dateRange}
              onChange={(e) => {
                const range = e.target.value as [Date | null, Date | null];
                fx.setDateRange(range);
                fx.setFilterStart(range[0] ? localDateString(range[0]) : "");
                fx.setFilterEnd(range[1] ? localDateString(range[1]) : "");
              }}
              placeholder={fx.t("movements.datePlaceholder")}
            />
          </ITFlex>
        </ITFlex>
      </ITStack>
    </ITCard>
  );
}