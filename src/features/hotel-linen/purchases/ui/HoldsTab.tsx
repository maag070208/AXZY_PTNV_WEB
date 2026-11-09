import { useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { PURCHASE_HOLD_STATUSES, purchaseApi, type PurchaseHoldRow } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { day, qty } from "../lib";
import { HoldStatusChip } from "./PurchaseChips";

interface Props {
  reloadKey: number;
  onChanged: () => void;
}

/** Mercancía apartada (HOLD) por diferencia con la factura: vence en 5 días hábiles; aceptar o devolver. */
export default function HoldsTab({ reloadKey, onChanged }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const tt = dyn(t);
  const canResolve = useCan("hotel_purchase.receive");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolve = async (id: string, action: "ACCEPT" | "RETURN") => {
    setBusyId(id);
    setError(null);
    try {
      await purchaseApi.resolveHold(id, action);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<PurchaseHoldRow>[] = [
    {
      key: "product",
      label: t("holds.columns.product"),
      type: "string",
      width: 220,
      sortable: false,
      filter: false,
      render: (r) => (
        <>
          <ITText className="text-[12px] font-bold">{r.product.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{[r.product.code, r.product.size].filter(Boolean).join(" · ")}</ITText>
        </>
      ),
    },
    { key: "quantity", label: t("holds.columns.quantity"), type: "number", width: 90, sortable: false, filter: false, render: (r) => <ITText className="text-[12px] tabular-nums">{qty(r.quantity)}</ITText> },
    { key: "reason", label: t("holds.columns.reason"), type: "string", width: 220, sortable: false, filter: false, render: (r) => <ITText className="text-[12px]">{r.reason}</ITText> },
    {
      key: "order",
      label: t("holds.columns.order"),
      type: "string",
      width: 170,
      sortable: false,
      filter: false,
      render: (r) => (
        <>
          <ITText className="font-mono text-[12px] font-bold">{r.order.folio}</ITText>
          <ITText muted className="text-[11px]">{`${t("receive.invoice")} ${r.invoiceNumber}`}</ITText>
        </>
      ),
    },
    {
      key: "dueAt",
      label: t("holds.columns.dueAt"),
      type: "date",
      width: 130,
      filter: false,
      render: (r) => (
        <ITText className={`text-[12px] tabular-nums ${r.overdue ? "font-bold text-[var(--color-error)]" : ""}`}>
          {r.status === "OPEN" ? `${day(r.dueAt)}${r.overdue ? ` · ${t("holds.overdue")}` : ""}` : day(r.resolvedAt)}
        </ITText>
      ),
    },
    {
      key: "status",
      label: t("holds.columns.status"),
      type: "catalog",
      width: 130,
      filter: "catalog",
      catalogOptions: { data: PURCHASE_HOLD_STATUSES.map((s) => ({ id: s, name: tt(`holds.status.${s}`) })) },
      render: (r) => <HoldStatusChip status={r.status} />,
    },
    ...(canResolve
      ? [
          {
            key: "actions",
            label: "",
            type: "string" as const,
            width: 210,
            sortable: false,
            filter: false as const,
            render: (r: PurchaseHoldRow) =>
              r.status === "OPEN" ? (
                <ITFlex gap={2}>
                  <ITButton size="sm" variant="filled" color="primary" label={t("holds.accept")} disabled={busyId === r.id} onClick={() => void resolve(r.id, "ACCEPT")} />
                  <ITButton size="sm" variant="outlined" color="warning" label={t("holds.return")} disabled={busyId === r.id} onClick={() => void resolve(r.id, "RETURN")} />
                </ITFlex>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <ITFlex direction="column" gap={3}>
      <ITText muted className="text-[12px]">{t("holds.hint")}</ITText>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITDataTable
        key={`holds-${reloadKey}`}
        showViewToggle={false}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={purchaseApi.holdsTable as never}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={56}
      />
    </ITFlex>
  );
}
