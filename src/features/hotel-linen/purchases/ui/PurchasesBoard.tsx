import { useEffect, useState } from "react";
import { ITAlert, ITTabs } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { purchaseApi, type PurchaseLookups, type PurchaseOrderDetail } from "@entities/hotel-linen";
import { PanelCard } from "@shared/ui/panel-card";
import HoldsTab from "./HoldsTab";
import OrderDetailDialog from "./OrderDetailDialog";
import OrderFormDialog from "./OrderFormDialog";
import OrdersTab from "./OrdersTab";
import ReceiveDialog from "./ReceiveDialog";
import RequestsTab from "./RequestsTab";

const RECEIVABLE = ["APPROVED", "PARTIALLY_RECEIVED"] as const;

interface Props {
  /** Señal para abrir el formulario de OC nueva desde el botón de la página. */
  newSignal: number;
}

/** Compras de blancos: órdenes, recepción contra factura, apartados y solicitudes de reposición. */
export default function PurchasesBoard({ newSignal }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const [lookups, setLookups] = useState<PurchaseLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ order: PurchaseOrderDetail | null } | null>(null);
  const [receiving, setReceiving] = useState<PurchaseOrderDetail | null>(null);

  useEffect(() => {
    let active = true;
    purchaseApi
      .lookups()
      .then((l) => active && setLookups(l))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (newSignal > 0) setForm({ order: null });
  }, [newSignal]);

  const refresh = () => setReload((n) => n + 1);

  // La recepción se abre desde la fila: se trae el detalle de la OC y se abre el diálogo.
  const openReceive = async (id: string) => {
    try {
      setReceiving(await purchaseApi.order(id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!lookups) {
    return error ? <ITAlert variant="error">{error}</ITAlert> : null;
  }

  const items = [
    { id: "orders", label: t("tabs.orders"), content: <OrdersTab lookups={lookups} reloadKey={reload} onRow={setDetailId} /> },
    { id: "receive", label: t("tabs.receive"), content: <OrdersTab lookups={lookups} statuses={RECEIVABLE} reloadKey={reload} onRow={(id) => void openReceive(id)} /> },
    { id: "holds", label: t("tabs.holds"), content: <HoldsTab reloadKey={reload} onChanged={refresh} /> },
    { id: "requests", label: t("tabs.requests"), content: <RequestsTab lookups={lookups} reloadKey={reload} onChanged={refresh} onOpenOrder={setDetailId} /> },
  ];

  return (
    <PanelCard title={t("title")} description={t("description")}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITTabs variant="line" items={items} />
      <OrderDetailDialog
        orderId={detailId}
        reloadKey={reload}
        onClose={() => setDetailId(null)}
        onChanged={refresh}
        onEdit={(order) => {
          setDetailId(null);
          setForm({ order });
        }}
        onReceive={(order) => {
          setDetailId(null);
          setReceiving(order);
        }}
      />
      <OrderFormDialog
        open={form !== null}
        lookups={lookups}
        order={form?.order ?? null}
        onClose={() => setForm(null)}
        onDone={(id) => {
          setForm(null);
          refresh();
          setDetailId(id);
        }}
      />
      <ReceiveDialog
        order={receiving}
        onClose={() => setReceiving(null)}
        onDone={() => {
          setReceiving(null);
          refresh();
        }}
      />
    </PanelCard>
  );
}
