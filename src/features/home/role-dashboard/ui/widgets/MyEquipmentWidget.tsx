import { useTranslation } from "react-i18next";
import { LuLaptop } from "react-icons/lu";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard, { EmptyText } from "../WidgetCard";

/** Equipo que el usuario tiene a su cargo (sus cartas responsivas vigentes). */
export default function MyEquipmentWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.myEquipment);
  return (
    <WidgetCard title={t("equipment.title")} icon={<LuLaptop size={16} />} loading={loading} error={error} onRetry={reload}>
      {data && data.loans.length === 0 && <EmptyText>{t("equipment.none")}</EmptyText>}
      <div className="flex flex-col gap-3">
        {data?.loans.map((loan) => (
          <div key={loan.id} className="rounded-2xl bg-black/5 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-bold text-slate-800">{t("equipment.letter", { number: loan.number })}</span>
              <span className="text-[11px] text-slate-500">{formatDate(loan.date)}</span>
            </div>
            {loan.items.map((item, i) => (
              <div key={i} className="mt-3">
                <div className="text-[13px] font-semibold text-slate-700">
                  {item.name}{" "}
                  <span className="font-normal text-slate-500">
                    · {item.brand} {item.model} ×{item.pending}
                  </span>
                </div>
                {item.units.map((u) => (
                  <div key={u.assetTag} className="text-[11px] text-slate-500">
                    {u.assetTag}
                    {u.serialNumber ? ` · ${t("equipment.serial", { serial: u.serialNumber })}` : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
