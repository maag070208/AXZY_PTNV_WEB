import type { ReactNode } from "react";
import { ITChip, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import type { QueueItem, SupplyRequestStatus } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";

interface Props {
  item: QueueItem;
  /** Contenido propio (renglones editables, etc.); por defecto lista de renglones. */
  children?: ReactNode;
  actions?: ReactNode;
  showStatus?: boolean;
}

const COLOR: Partial<Record<SupplyRequestStatus, "gray" | "info" | "warning" | "success" | "primary">> = {
  SUBMITTED: "info",
  PARTIALLY_FULFILLED: "warning",
  READY_FOR_PICKUP: "warning",
  IN_TRANSIT: "primary",
  FULFILLED: "success",
  RECEIVED: "success",
};

const fmtAge = (minutes: number): string => (minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`);

/** Tarjeta de un pedido por habitación: habitación grande, antigüedad, renglones y acciones. */
export default function OrderCard({ item, children, actions, showStatus = false }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  return (
    <PanelCard
      title={item.room ? t("order.room", { number: item.room.number }) : item.folio}
      description={`${item.area.name} · ${t("order.age", { age: fmtAge(item.ageMinutes) })}`}
      actions={showStatus ? <ITChip size="sm" color={COLOR[item.status] ?? "gray"} label={dyn(t)(`status.${item.status}`)} /> : undefined}
    >
      <ITFlex direction="column" gap={3}>
        {children ??
          item.lines.map((l) => (
            <ITFlex key={l.id} justify="between" align="center">
              <ITText className="text-[16px]">{l.product.name}</ITText>
              <ITText className="text-[18px] font-bold tabular-nums">{l.deliveredQty > 0 ? l.deliveredQty : l.requestedQty}</ITText>
            </ITFlex>
          ))}
        {actions}
      </ITFlex>
    </PanelCard>
  );
}
