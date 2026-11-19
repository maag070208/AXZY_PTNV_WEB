import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { roomApi, type HotelRoom, type QueueItem, type TurnoverQueue } from "@entities/hotel-linen";
import { PanelCard } from "@shared/ui/panel-card";
import OrderCard from "./OrderCard";
import DifferenceDialog from "./DifferenceDialog";
import ExtraDialog from "./ExtraDialog";
import TurnoverDialog from "./TurnoverDialog";

interface Props {
  queue: TurnoverQueue;
  reload: () => Promise<void>;
}

/** Supervisora: cuadrícula de habitaciones de su zona ("Se desocupó") y estado de sus pedidos. */
export default function SupervisorView({ queue, reload }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [picked, setPicked] = useState<HotelRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffItem, setDiffItem] = useState<QueueItem | null>(null);
  const [extraItem, setExtraItem] = useState<QueueItem | null>(null);

  useEffect(() => {
    roomApi
      .list(false)
      .then((all) => setRooms(all.filter((r) => r.active).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))))
      .catch((e: Error) => setError(e.message));
  }, []);

  const openByRoom = new Map<string, QueueItem>();
  for (const item of queue.requested) if (item.room) openByRoom.set(item.room.id, item);

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <PanelCard title={t("supervisor.rooms")} description={t("supervisor.roomsHint")}>
        <ITFlex gap={3} wrap="wrap">
          {rooms.map((room) => {
            const open = openByRoom.get(room.id);
            return (
              <ITButton
                key={room.id}
                variant={open ? "filled" : "outlined"}
                color={open ? "warning" : "primary"}
                className="!h-24 !w-28 !flex-col"
                onClick={() => (open ? undefined : setPicked(room))}
              >
                <ITText className="text-[26px] font-bold">{room.number}</ITText>
                <ITText className="text-[11px]">{open ? t(`status.${open.status}`) : t("supervisor.vacated")}</ITText>
              </ITButton>
            );
          })}
          {rooms.length === 0 && <ITText muted>{t("supervisor.noRooms")}</ITText>}
        </ITFlex>
      </PanelCard>

      <ITText className="text-[18px] font-bold">{t("supervisor.orders")}</ITText>
      {queue.requested.length === 0 && <ITText muted>{t("supervisor.noOrders")}</ITText>}
      <ITFlex gap={3} wrap="wrap">
        {queue.requested.map((item) => (
          <ITFlex key={item.id} direction="column" className="min-w-[300px] flex-1">
            <OrderCard
              item={item}
              showStatus
              actions={
                item.status === "SUBMITTED" ? (
                  <ITButton variant="outlined" color="secondary" className="!h-14 !text-[16px]" label={t("supervisor.addExtra")} onClick={() => setExtraItem(item)} />
                ) : undefined
              }
            />
          </ITFlex>
        ))}
      </ITFlex>

      <ITText className="text-[18px] font-bold">{t("supervisor.delivered")}</ITText>
      {queue.delivered.length === 0 && <ITText muted>{t("supervisor.noDelivered")}</ITText>}
      <ITFlex gap={3} wrap="wrap">
        {queue.delivered.map((item) => (
          <ITFlex key={item.id} direction="column" className="min-w-[300px] flex-1">
            <OrderCard
              item={item}
              showStatus
              actions={<ITButton variant="outlined" color="warning" className="!h-14 !text-[16px]" label={t("supervisor.reportDifference")} onClick={() => setDiffItem(item)} />}
            />
          </ITFlex>
        ))}
      </ITFlex>

      <DifferenceDialog
        item={diffItem}
        onClose={() => setDiffItem(null)}
        onDone={() => {
          setDiffItem(null);
          void reload();
        }}
      />
      <ExtraDialog
        item={extraItem}
        onClose={() => setExtraItem(null)}
        onDone={() => {
          setExtraItem(null);
          void reload();
        }}
      />

      <TurnoverDialog
        room={picked}
        onClose={() => setPicked(null)}
        onDone={() => {
          setPicked(null);
          void reload();
        }}
      />
    </ITFlex>
  );
}
