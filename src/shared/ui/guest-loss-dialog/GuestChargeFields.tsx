import { ITGrid, ITInputNumber, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n/dyn";

export type GuestChargeStatusValue = "NOT_CHARGED" | "PENDING" | "CHARGED" | "WAIVED";
const STATUSES: readonly GuestChargeStatusValue[] = ["NOT_CHARGED", "PENDING", "CHARGED", "WAIVED"];

export interface GuestChargeValue {
  chargeStatus: GuestChargeStatusValue;
  chargeAmount: number | null;
}

interface Props {
  value: GuestChargeValue;
  onChange: (value: GuestChargeValue) => void;
}

/** Cobro de una pérdida de huésped: opcional. Hoy no se cobra; queda guardado para la integración futura. */
export default function GuestChargeFields({ value, onChange }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const tt = dyn(t);
  return (
    <>
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} md={6}>
          <ITSelect
            name="guestChargeStatus"
            label={t("guestLoss.chargeStatus")}
            options={STATUSES.map((s) => ({ value: s, label: tt(`guestLoss.charge.${s}`) }))}
            value={value.chargeStatus}
            onChange={(e) => onChange({ ...value, chargeStatus: e.target.value as GuestChargeStatusValue })}
          />
        </ITGrid>
        <ITGrid item xs={12} md={6}>
          <ITInputNumber
            name="guestChargeAmount"
            label={t("guestLoss.chargeAmount")}
            decimals={2}
            min={0}
            value={value.chargeAmount}
            onChange={(v) => onChange({ ...value, chargeAmount: v ?? null })}
          />
        </ITGrid>
      </ITGrid>
      <ITText muted className="text-[11px]">{t("guestLoss.chargeHint")}</ITText>
    </>
  );
}
