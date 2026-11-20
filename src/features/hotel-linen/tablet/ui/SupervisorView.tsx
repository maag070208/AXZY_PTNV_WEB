import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITCard, ITChip, ITFlex, ITGrid, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { LuChevronRight, LuSearch } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { roomApi, type HotelRoom, type QueueItem, type TurnoverQueue } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import OrderCard from "./OrderCard";
import DifferenceDialog from "./DifferenceDialog";
import ExtraDialog from "./ExtraDialog";
import TurnoverDialog from "./TurnoverDialog";

interface Props {
  queue: TurnoverQueue;
  reload: () => Promise<void>;
}

type RoomFilter = "occupied" | "open" | "all";

/** Piso a partir del número de habitación (HN119 → 1, HN217 → 2, HN405 → 4). */
const floorOf = (number: string): number | null => {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 3) return null;
  const floor = Number(digits.slice(0, digits.length - 2));
  return Number.isFinite(floor) && floor > 0 ? floor : null;
};

const byNumber = (a: HotelRoom, b: HotelRoom): number =>
  a.number.localeCompare(b.number, undefined, { numeric: true });

/**
 * Supervisora: cuadrícula de habitaciones de su zona para marcar «se desocupó».
 * Por defecto solo muestra las ocupadas (que son las que se pueden marcar), con
 * búsqueda, filtros y pisos para que las 200+ habitaciones no se conviertan en
 * una lista ilegible.
 */
export default function SupervisorView({ queue, reload }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  const tt = dyn(t);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("occupied");
  const [floor, setFloor] = useState<number | null>(null);
  const [picked, setPicked] = useState<HotelRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffItem, setDiffItem] = useState<QueueItem | null>(null);
  const [extraItem, setExtraItem] = useState<QueueItem | null>(null);

  useEffect(() => {
    roomApi
      .list(false)
      .then((all) => setRooms(all.filter((r) => r.active).sort(byNumber)))
      .catch((e: Error) => setError(e.message));
  }, []);

  const openByRoom = useMemo(() => {
    const map = new Map<string, QueueItem>();
    for (const item of queue.requested) if (item.room) map.set(item.room.id, item);
    return map;
  }, [queue.requested]);

  const floors = useMemo(() => {
    const set = new Set<number>();
    for (const room of rooms) {
      const floor = floorOf(room.number);
      if (floor !== null) set.add(floor);
    }
    return [...set].sort((a, b) => a - b);
  }, [rooms]);

  const counts = useMemo(
    () => ({
      occupied: rooms.filter((r) => r.status === "OCCUPIED").length,
      open: rooms.filter((r) => openByRoom.has(r.id)).length,
      total: rooms.length,
    }),
    [rooms, openByRoom]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rooms.filter((room) => {
      if (floor !== null && floorOf(room.number) !== floor) return false;
      if (needle && !room.number.toLowerCase().includes(needle)) return false;
      if (filter === "occupied") return room.status === "OCCUPIED";
      if (filter === "open") return openByRoom.has(room.id);
      return true;
    });
  }, [rooms, openByRoom, query, filter, floor]);

  const clearFilters = (): void => {
    setQuery("");
    setFilter("occupied");
    setFloor(null);
  };

  const roomCard = (room: HotelRoom) => {
    const open = openByRoom.get(room.id);
    const canPick = !open && room.status === "OCCUPIED";
    const statusLabel = open ? tt(`status.${open.status}`) : tt(`supervisor.roomStatus.${room.status}`);
    return (
      <ITCard
        key={room.id}
        tone={open ? "info" : canPick ? "warning" : undefined}
        onClick={canPick ? () => setPicked(room) : undefined}
        className="h-full min-h-[106px]"
        contentClassName="!p-3"
      >
        <ITFlex direction="column" justify="between" className="h-full min-h-[82px] gap-2">
          <ITText className="!text-[22px] !font-black !leading-none">{room.number}</ITText>
          <ITFlex justify="between" align="end" gap={1} className="w-full">
            <ITFlex direction="column" gap={0.5} className="min-w-0">
              <ITText
                className={`!text-[11.5px] font-semibold ${
                  open ? "text-[color:var(--color-info)]" : canPick ? "text-amber-700" : ""
                }`}
                muted={!open && !canPick}
              >
                {statusLabel}
              </ITText>
              {open ? (
                <ITText className="!text-[10.5px]" muted>{t("supervisor.openOrder")}</ITText>
              ) : canPick ? (
                <ITText className="!text-[10.5px] font-semibold text-amber-700">{t("supervisor.markVacated")}</ITText>
              ) : null}
            </ITFlex>
            {canPick && <LuChevronRight size={15} className="shrink-0 text-amber-700" />}
          </ITFlex>
        </ITFlex>
      </ITCard>
    );
  };

  const ordersPanel = (
    <PanelCard title={t("supervisor.orders")} description={t("supervisor.ordersHint")}>
      {queue.requested.length === 0 ? (
        <ITText muted>{t("supervisor.noOrders")}</ITText>
      ) : (
        <ITFlex direction="column" gap={2}>
          {queue.requested.map((item) => (
            <OrderCard
              key={item.id}
              item={item}
              showStatus
              actions={
                item.status === "SUBMITTED" ? (
                  <ITButton
                    variant="outlined"
                    color="secondary"
                    className="!h-11 !text-[14px]"
                    label={t("supervisor.addExtra")}
                    onClick={() => setExtraItem(item)}
                  />
                ) : undefined
              }
            />
          ))}
        </ITFlex>
      )}
    </PanelCard>
  );

  const deliveredPanel = (
    <PanelCard title={t("supervisor.delivered")} description={t("supervisor.deliveredHint")}>
      {queue.delivered.length === 0 ? (
        <ITText muted>{t("supervisor.noDelivered")}</ITText>
      ) : (
        <ITFlex direction="column" gap={2}>
          {queue.delivered.map((item) => (
            <OrderCard
              key={item.id}
              item={item}
              showStatus
              actions={
                <ITButton
                  variant="outlined"
                  color="warning"
                  className="!h-11 !text-[14px]"
                  label={t("supervisor.reportDifference")}
                  onClick={() => setDiffItem(item)}
                />
              }
            />
          ))}
        </ITFlex>
      )}
    </PanelCard>
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}

      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} lg={8}>
          <PanelCard title={t("supervisor.rooms")} description={t("supervisor.roomsHint")}>
            <ITFlex direction="column" gap={3}>
              <ITFlex wrap="wrap" align="center" gap={2}>
                <ITInput
                  name="roomSearch"
                  size="sm"
                  placeholder={t("supervisor.search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  iconLeft={<LuSearch size={16} />}
                  containerClassName="w-full sm:!w-[250px]"
                />
                <ITChip
                  color="primary"
                  selected={filter === "occupied"}
                  onClick={() => setFilter("occupied")}
                  label={t("supervisor.filterOccupied", { count: counts.occupied })}
                />
                <ITChip
                  color="warning"
                  selected={filter === "open"}
                  onClick={() => setFilter("open")}
                  label={t("supervisor.filterOpen", { count: counts.open })}
                />
                <ITChip
                  color="gray"
                  selected={filter === "all"}
                  onClick={() => setFilter("all")}
                  label={t("supervisor.filterAll", { count: counts.total })}
                />
              </ITFlex>

              {floors.length > 1 && (
                <ITFlex wrap="wrap" align="center" gap={1.5}>
                  <ITText muted className="!text-[11px] !font-bold uppercase tracking-[0.06em]">
                    {t("supervisor.floorLabel")}
                  </ITText>
                  <ITChip
                    size="sm"
                    variant="soft"
                    color="gray"
                    selected={floor === null}
                    onClick={() => setFloor(null)}
                    label={t("supervisor.floorAll")}
                  />
                  {floors.map((f) => (
                    <ITChip
                      key={f}
                      size="sm"
                      variant="soft"
                      color="gray"
                      selected={floor === f}
                      onClick={() => setFloor(f)}
                      label={t("supervisor.floor", { floor: f })}
                    />
                  ))}
                </ITFlex>
              )}

              <ITFlex justify="between" align="center" wrap="wrap" gap={2}>
                <ITText muted className="!text-[12px]">
                  {t("supervisor.showing", { visible: visible.length, total: rooms.length })}
                </ITText>
                {(query || filter !== "occupied" || floor !== null) && (
                  <ITButton variant="text" color="secondary" size="sm" label={t("supervisor.clearFilters")} onClick={clearFilters} />
                )}
              </ITFlex>

              {rooms.length === 0 ? (
                <ITText muted>{t("supervisor.noRooms")}</ITText>
              ) : visible.length === 0 ? (
                <ITFlex direction="column" align="start" gap={2} className="py-6">
                  <ITText muted>{t("supervisor.emptyFiltered")}</ITText>
                  <ITButton variant="outlined" color="secondary" size="sm" label={t("supervisor.clearFilters")} onClick={clearFilters} />
                </ITFlex>
              ) : (
                <ITFlex direction="column" className="max-h-[58vh] overflow-y-auto pr-1">
                  <ITGrid container columns={12} spacing={2}>
                    {visible.map((room) => (
                      <ITGrid key={room.id} item xs={6} sm={4} md={3} lg={3} xl={3}>
                        {roomCard(room)}
                      </ITGrid>
                    ))}
                  </ITGrid>
                </ITFlex>
              )}
            </ITFlex>
          </PanelCard>
        </ITGrid>

        <ITGrid item xs={12} lg={4}>
          <ITFlex direction="column" gap={4}>
            {ordersPanel}
            {deliveredPanel}
          </ITFlex>
        </ITGrid>
      </ITGrid>

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
