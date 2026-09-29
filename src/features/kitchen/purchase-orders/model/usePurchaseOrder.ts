import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { kitchenApi, type PurchaseOrderDetail, type PurchaseOrderReceiveInput } from "@entities/kitchen";

/** Detalle de una orden de compra y sus acciones (aprobar, enviar, cancelar, recibir). */
export const usePurchaseOrder = (id?: string) => {
  const { t } = useTranslation("kitchen");
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!id) return;
    setLoading(true);
    kitchenApi
      .purchaseOrder(id)
      .then(setOrder)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const act = useCallback(
    async (fn: () => Promise<unknown>, message: string) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        setToast(message);
        reload();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  return {
    t,
    order,
    loading,
    busy,
    error,
    setError,
    toast,
    setToast,
    reload,
    approve: () => act(() => kitchenApi.approvePurchaseOrder(id!), t("purchaseOrders.approved")),
    send: () => act(() => kitchenApi.sendPurchaseOrder(id!), t("purchaseOrders.sent")),
    cancel: () => act(() => kitchenApi.cancelPurchaseOrder(id!, null), t("purchaseOrders.cancelled")),
    receive: (input: PurchaseOrderReceiveInput, key: string) =>
      act(() => kitchenApi.receivePurchaseOrder(id!, input, key), t("purchaseOrders.received")),
  };
};

export type UsePurchaseOrder = ReturnType<typeof usePurchaseOrder>;
