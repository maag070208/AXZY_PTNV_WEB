import { useTranslation } from "react-i18next";
import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaLaptop } from "react-icons/fa";
import { dashboardApi } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { formatDate } from "@shared/utils/dates";
import { useWidgetData } from "../../model/useWidgetData";
import WidgetCard from "../WidgetCard";

/** Equipo que el usuario tiene a su cargo (sus cartas responsivas vigentes). */
export default function MyEquipmentWidget() {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const { data, loading, error, reload } = useWidgetData(dashboardApi.myEquipment);
  return (
    <WidgetCard title={t("equipment.title")} icon={<FaLaptop size={13} />} iconClass="bg-sky-700" loading={loading} error={error} onRetry={reload}>
      {data && data.loans.length === 0 && <ITText className="text-[11px] text-slate-400">{t("equipment.none")}</ITText>}
      {data?.loans.map((loan) => (
        <div key={loan.id} className="mb-3 rounded-xl border border-slate-200 p-3">
          <ITFlex justify="between">
            <ITText className="text-[11px] font-black text-slate-800">{t("equipment.letter", { number: loan.number })}</ITText>
            <ITText className="text-[10px] text-slate-400">{formatDate(loan.date)}</ITText>
          </ITFlex>
          {loan.items.map((item, i) => (
            <div key={i} className="mt-2">
              <div className="text-[11px] font-bold text-slate-700">
                {item.name} <span className="text-slate-400">· {item.brand} {item.model} ×{item.pending}</span>
              </div>
              {item.units.map((u) => (
                <div key={u.assetTag} className="text-[10px] text-slate-500">
                  {u.assetTag}
                  {u.serialNumber ? ` · ${t("equipment.serial", { serial: u.serialNumber })}` : ""}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </WidgetCard>
  );
}
