import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITChip, ITDataTable, ITFlex, ITGrid, ITInput, ITInputNumber, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaCashRegister, FaHandHolding, FaMoneyBillWave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  DEPOSIT_METHODS,
  TOWEL_LOAN_STATUSES,
  hotelLinenApi,
  receptionApi,
  type DepositMethod,
  type HotelProduct,
  type HotelWarehouse,
  type PointSummary,
  type TowelLoan,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { fmt, fmtDateTime, money } from "../lib";
import ReturnLoanDialog from "./ReturnLoanDialog";
import ShiftCloseDialog from "./ShiftCloseDialog";

interface Props {
  /** La página provee la co-firma (las features no se importan entre sí). */
  requestCosign: (title: string) => Promise<string | null>;
  /** Avisa al historial de cortes que debe recargarse. */
  onClosed: () => void;
}

const STATUS_COLOR: Record<string, "primary" | "success" | "warning" | "danger"> = {
  OPEN: "primary",
  PARTIAL: "warning",
  RETURNED: "success",
  UNRETURNED: "danger",
};

/** Préstamo de toallas por punto: resumen de caja, alta de vale, abiertos con devolución y corte de turno. */
export default function LoansView({ requestCosign, onClosed }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const tt = dyn(t);
  const canLend = useCan("hotel_linen.loans");
  const canClose = useCan("hotel_linen.shift_close");

  const [points, setPoints] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [pointId, setPointId] = useState("");
  const [summary, setSummary] = useState<PointSummary | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState<TowelLoan | null>(null);
  const [closing, setClosing] = useState(false);

  // Alta de vale
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState<number | null>(null);
  const [guest, setGuest] = useState("");
  const [room, setRoom] = useState("");
  const [method, setMethod] = useState<DepositMethod>("CASH");

  useEffect(() => {
    let active = true;
    Promise.all([hotelLinenApi.warehouses(), hotelLinenApi.products()])
      .then(([w, p]) => {
        if (!active) return;
        const list = w.filter((x) => x.kind === "POINT");
        setPoints(list);
        setPointId((cur) => cur || list[0]?.id || "");
        const linen = p.filter((x) => x.kind === "LINEN" && x.active);
        setProducts(linen);
        setProductId((cur) => cur || linen[0]?.id || "");
      })
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pointId) return;
    let active = true;
    receptionApi
      .pointSummary(pointId)
      .then((s) => active && setSummary(s))
      .catch(() => active && setSummary(null));
    return () => {
      active = false;
    };
  }, [pointId, reload]);

  const refresh = () => setReload((n) => n + 1);
  const deposit = (qty ?? 0) * (summary?.depositUnit ?? 0);

  const submit = async () => {
    if (!pointId || !productId || !qty || !guest.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await receptionApi.createLoan({ warehouseId: pointId, productId, quantity: qty, guestName: guest.trim(), room: room.trim() || null, depositMethod: method });
      setQty(null);
      setGuest("");
      setRoom("");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const fetchData = useCallback(
    (params: Parameters<typeof receptionApi.loansTable>[0]) =>
      receptionApi.loansTable({ ...params, filters: { ...params.filters, warehouse: pointId } as never }),
    [pointId]
  );

  const columns: Column<TowelLoan>[] = useMemo(
    () => [
      { key: "folio", label: t("loans.columns.folio"), type: "string", width: 100, filter: true, render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText> },
      { key: "lentAt", label: t("loans.columns.lentAt"), type: "date", width: 150, filter: "date-range", render: (r) => <ITText className="text-[12px]">{fmtDateTime(r.lentAt)}</ITText> },
      { key: "guest", label: t("loans.columns.guest"), type: "string", width: 180, filter: true, render: (r) => <ITText className="text-[12px]">{r.guestName}{r.room ? ` · ${r.room}` : ""}</ITText> },
      { key: "product", label: t("loans.columns.product"), type: "string", width: 160, sortable: false, render: (r) => <ITText className="text-[12px]">{r.product.name}</ITText> },
      { key: "quantity", label: t("loans.columns.quantity"), type: "number", width: 110, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.returnedQty)} / {fmt(r.quantity)}</ITText> },
      { key: "depositMethod", label: t("loans.columns.method"), type: "string", width: 110, sortable: false, render: (r) => <ITText className="text-[12px]">{tt(`method.${r.depositMethod}`)}</ITText> },
      { key: "deposit", label: t("loans.columns.deposit"), type: "number", width: 110, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{money(r.depositCollected)}</ITText> },
      {
        key: "status",
        label: t("loans.columns.status"),
        type: "catalog",
        width: 130,
        filter: "catalog",
        sortable: false,
        catalogOptions: { data: TOWEL_LOAN_STATUSES.map((s) => ({ id: s, name: tt(`loanStatus.${s}`) })) },
        render: (r) => <ITChip size="sm" color={STATUS_COLOR[r.status]} label={tt(`loanStatus.${r.status}`)} />,
      },
      {
        key: "actions",
        label: "",
        type: "string",
        width: 110,
        sortable: false,
        render: (r) =>
          canLend && (r.status === "OPEN" || r.status === "PARTIAL") ? (
            <ITButton size="sm" variant="outlined" color="primary" label={t("loans.return")} onClick={() => setReturning(r)} />
          ) : null,
      },
    ],
    [t, tt, canLend]
  );

  const pointName = points.find((p) => p.id === pointId)?.name ?? "";

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <PanelCard
        title={t("loans.title")}
        description={t("loans.description")}
        actions={
          canClose && pointId ? (
            <ITButton variant="filled" color="primary" icon={<FaCashRegister size={12} />} label={t("loans.close")} onClick={() => setClosing(true)} />
          ) : undefined
        }
      >
        <ITFlex direction="column" gap={3}>
          <ITSelect
            name="loanPoint"
            label={t("loans.point")}
            options={points.map((p) => ({ value: p.id, label: p.name }))}
            value={pointId}
            onChange={(e) => setPointId(e.target.value)}
          />
          <ITGrid container spacing={2}>
            <ITGrid item xs={6} md={3}>
              <KpiTile label={t("loans.kpi.lent")} value={fmt(summary?.lentPending ?? 0)} icon={<FaHandHolding size={14} />} tone="sky" hint={t("loans.kpi.openLoans", { count: summary?.openLoans ?? 0 })} />
            </ITGrid>
            {DEPOSIT_METHODS.map((m) => (
              <ITGrid item xs={6} md={3} key={m}>
                <KpiTile label={t("loans.kpi.deposit", { method: tt(`method.${m}`) })} value={money(summary?.deposits[m] ?? 0)} icon={<FaMoneyBillWave size={14} />} tone={m === "CASH" ? "emerald" : m === "CARD" ? "violet" : "amber"} />
              </ITGrid>
            ))}
          </ITGrid>
        </ITFlex>
      </PanelCard>

      {canLend && (
        <PanelCard title={t("loans.new.title")}>
          <ITGrid container spacing={2}>
            <ITGrid item xs={12} md={3}>
              <ITInput name="loanGuest" label={t("loans.new.guest")} value={guest} onChange={(e) => setGuest(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="loanRoom" label={t("loans.new.room")} value={room} onChange={(e) => setRoom(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITSelect name="loanProduct" label={t("loans.new.product")} options={products.map((p) => ({ value: p.id, label: p.name }))} value={productId} onChange={(e) => setProductId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInputNumber name="loanQty" label={t("loans.new.quantity")} decimals={0} min={0} value={qty} onChange={(v) => setQty(v ?? null)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITSelect name="loanMethod" label={t("loans.new.method")} options={DEPOSIT_METHODS.map((m) => ({ value: m, label: tt(`method.${m}`) }))} value={method} onChange={(e) => setMethod(e.target.value as DepositMethod)} />
            </ITGrid>
          </ITGrid>
          <ITFlex align="center" justify="between" className="mt-3">
            <ITText muted>{t("loans.new.deposit", { amount: money(deposit), unit: money(summary?.depositUnit ?? 0) })}</ITText>
            <ITButton variant="filled" color="primary" label={t("loans.new.submit")} disabled={busy || !pointId || !productId || !qty || !guest.trim()} onClick={() => void submit()} />
          </ITFlex>
        </PanelCard>
      )}

      <PanelCard title={t("loans.table.title", { point: pointName })}>
        <ITDataTable
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchData as never}
          reloadTrigger={`${pointId}-${reload}`}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={56}
        />
      </PanelCard>

      <ReturnLoanDialog loan={returning} onClose={() => setReturning(null)} onDone={() => { setReturning(null); refresh(); }} />
      <ShiftCloseDialog
        isOpen={closing}
        pointId={pointId}
        pointName={pointName}
        requestCosign={requestCosign}
        onClose={() => setClosing(false)}
        onDone={() => { setClosing(false); refresh(); onClosed(); }}
      />
    </ITFlex>
  );
}
