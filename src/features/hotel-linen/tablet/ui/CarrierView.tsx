import { useState } from "react";
import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { turnoverApi, type QueueItem, type TurnoverQueue } from "@entities/hotel-linen";
import { useSuccessToast } from "@app/toast/useSuccessToast";
import OrderCard from "./OrderCard";

interface Props {
  queue: TurnoverQueue;
  reload: () => Promise<void>;
}

/** Auxiliar de piso: "Para recoger" -> "Recogí" -> "Entregado en hab. X". No rechaza pedidos. */
export default function CarrierView({ queue, reload }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  const notify = useSuccessToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const run = async (item: QueueItem, action: "pickup" | "deliver") => {
    setBusyId(item.id);
    setError(null);
    try {
      await (action === "pickup" ? turnoverApi.pickup(item.id) : turnoverApi.deliver(item.id));
      notify(t(action === "pickup" ? "toast.pickedUp" : "toast.delivered"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
      // Si otra persona lo tomó primero, la cola se refresca y el pedido desaparece.
      await reload();
    }
  };

  // Solo cuentan los seleccionados que siguen en la cola (otra auxiliar pudo tomarlos).
  const chosen = selected.filter((id) => queue.toPickUp.some((i) => i.id === id));

  const pickMany = async () => {
    setBusyId("many");
    setError(null);
    try {
      const { picked, conflicts } = await turnoverApi.pickupMany(chosen);
      if (picked.length > 0) notify(t("toast.pickedMany", { count: picked.length }));
      if (conflicts.length > 0) setError(t("toast.conflicts", { count: conflicts.length }));
      setSelected([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
      await reload();
    }
  };

  const toggle = (id: string) => setSelected((all) => (all.includes(id) ? all.filter((x) => x !== id) : [...all, id]));

  const section = (title: string, empty: string, items: QueueItem[], action: "pickup" | "deliver") => (
    <ITFlex direction="column" gap={3}>
      <ITText className="text-[18px] font-bold">{title}</ITText>
      {items.length === 0 && <ITText muted>{empty}</ITText>}
      <ITFlex gap={3} wrap="wrap">
        {items.map((item) => (
          <ITFlex key={item.id} direction="column" className="min-w-[300px] flex-1">
            <OrderCard
              item={item}
              actions={
                <ITFlex direction="column" gap={2}>
                  {action === "pickup" && (
                    <ITButton
                      variant={chosen.includes(item.id) ? "filled" : "outlined"}
                      color="secondary"
                      className="!h-12"
                      label={`${chosen.includes(item.id) ? "✓ " : ""}${item.room?.number ?? item.folio}`}
                      onClick={() => toggle(item.id)}
                    />
                  )}
                <ITButton
                  variant="filled"
                  color={action === "pickup" ? "primary" : "success"}
                  className="!h-16 !text-[18px]"
                  label={busyId === item.id ? t("sending") : action === "pickup" ? t("carrier.pickedUp") : t("carrier.delivered", { number: item.room?.number ?? "" })}
                  disabled={busyId === item.id}
                  onClick={() => void run(item, action)}
                />
                </ITFlex>
              }
            />
          </ITFlex>
        ))}
      </ITFlex>
    </ITFlex>
  );

  return (
    <ITFlex direction="column" gap={5}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {section(t("carrier.carrying"), t("carrier.noneCarrying"), queue.carrying, "deliver")}
      {section(t("carrier.toPickUp"), t("carrier.noneToPickUp"), queue.toPickUp, "pickup")}
      {chosen.length > 0 && (
        <ITButton
          variant="filled"
          color="primary"
          className="!h-16 !text-[18px]"
          label={busyId === "many" ? t("sending") : t("carrier.pickSelected", { count: chosen.length })}
          disabled={busyId !== null}
          onClick={() => void pickMany()}
        />
      )}
    </ITFlex>
  );
}
