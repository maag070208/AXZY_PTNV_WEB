import { ITAlert, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { useTurnoverQueue } from "../model/useTurnoverQueue";
import CarrierView from "./CarrierView";
import LaundryView from "./LaundryView";
import SupervisorView from "./SupervisorView";

/**
 * Tablet de pedido de blancos: una vista por rol según los permisos (pedir = supervisora,
 * surtir = lavandería, llevar = auxiliar de piso). Refresca la cola cada ~20 s.
 */
export default function TabletBoard() {
  const { t } = useTranslation("hotel-linen-tablet");
  const canRequest = useCan("hotel_linen.request");
  const canFulfill = useCan("hotel_linen.fulfill");
  const canCarry = useCan("hotel_linen.carry");
  const { queue, error, reload } = useTurnoverQueue();

  if (!canRequest && !canFulfill && !canCarry) return <ITAlert variant="warning">{t("noAccess")}</ITAlert>;

  return (
    <ITFlex direction="column" gap={5}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {!queue && !error && <ITText muted>{t("loading")}</ITText>}
      {queue && canCarry && !canRequest && !canFulfill && <CarrierView queue={queue} reload={reload} />}
      {queue && canRequest && <SupervisorView queue={queue} reload={reload} />}
      {queue && canFulfill && <LaundryView items={queue.toFulfill} reload={reload} />}
      {queue && canCarry && (canRequest || canFulfill) && <CarrierView queue={queue} reload={reload} />}
    </ITFlex>
  );
}
