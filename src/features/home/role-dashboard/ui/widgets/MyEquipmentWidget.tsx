import { useTranslation } from "react-i18next";
import { LuLaptop } from "react-icons/lu";
import { ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
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
      <ITStack spacing={3}>
        {data?.loans.map((loan) => (
          <ITStack
            key={loan.id}
            spacing={2}
            className="rounded-2xl bg-[color-mix(in_srgb,currentColor_5%,transparent)] p-4"
          >
            <ITFlex align="baseline" justify="between" gap={2}>
              <ITText className="!text-[13px] font-bold">{t("equipment.letter", { number: loan.number })}</ITText>
              <ITText muted className="!text-[11px]">
                {formatDate(loan.date)}
              </ITText>
            </ITFlex>
            {loan.items.map((item, i) => (
              <ITStack key={i} spacing={0.5}>
                <ITText className="!text-[13px] font-semibold">
                  {item.name}{" "}
                  <ITText as="span" muted className="font-normal">
                    · {item.brand} {item.model} ×{item.pending}
                  </ITText>
                </ITText>
                {item.units.map((u) => (
                  <ITText key={u.assetTag} muted className="!text-[11px]">
                    {u.assetTag}
                    {u.serialNumber ? ` · ${t("equipment.serial", { serial: u.serialNumber })}` : ""}
                  </ITText>
                ))}
              </ITStack>
            ))}
          </ITStack>
        ))}
      </ITStack>
    </WidgetCard>
  );
}
