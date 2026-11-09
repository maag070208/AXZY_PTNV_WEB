import { useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITDatePicker, ITDialog, ITFlex, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaMagic } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  PURCHASE_REQUEST_SOURCES,
  PURCHASE_REQUEST_STATUSES,
  purchaseApi,
  type PurchaseGenerateResult,
  type PurchaseLookups,
  type PurchaseRequestRow,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { dateStrToLocal, day, localToDateStr, qty, todayStr } from "../lib";
import { RequestStatusChip } from "./PurchaseChips";

/** Lunes de la semana de una fecha local ("YYYY-MM-DD"). */
const mondayOf = (value: string): string => {
  const d = dateStrToLocal(value) ?? new Date();
  const shift = (d.getDay() + 6) % 7;
  return localToDateStr(new Date(d.getFullYear(), d.getMonth(), d.getDate() - shift));
};

interface Props {
  lookups: PurchaseLookups;
  reloadKey: number;
  onChanged: () => void;
  onOpenOrder: (id: string) => void;
}

/** Solicitudes de reposición: generar (semanal de bajas / bajo mínimo), revisar y convertir en OC. */
export default function RequestsTab({ lookups, reloadKey, onChanged, onOpenOrder }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const tt = dyn(t);
  const canCreate = useCan("hotel_purchase.create");
  const [week, setWeek] = useState(mondayOf(todayStr()));
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchaseRequestRow | null>(null);
  const [supplierId, setSupplierId] = useState("");

  const afterGenerate = (result: PurchaseGenerateResult) => {
    setInfo(result.request ? t(result.created ? "requests.generated" : "requests.alreadyExists", { folio: result.request.folio }) : t("requests.nothing"));
    onChanged();
  };

  const generate = async (action: () => Promise<PurchaseGenerateResult>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      afterGenerate(await action());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const convert = async () => {
    if (!selected || !supplierId) return;
    setBusy(true);
    setError(null);
    try {
      const { orderId } = await purchaseApi.convertRequest(selected.id, supplierId);
      setSelected(null);
      onChanged();
      onOpenOrder(orderId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await purchaseApi.dismissRequest(selected.id);
      setSelected(null);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<PurchaseRequestRow>[] = [
    { key: "folio", label: t("requests.columns.folio"), type: "string", width: 110, render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText> },
    {
      key: "source",
      label: t("requests.columns.source"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      catalogOptions: { data: PURCHASE_REQUEST_SOURCES.map((s) => ({ id: s, name: tt(`requests.source.${s}`) })) },
      render: (r) => (
        <>
          <ITText className="text-[12px]">{tt(`requests.source.${r.source}`)}</ITText>
          {r.weekFrom && <ITText muted className="text-[11px]">{`${day(r.weekFrom)} – ${day(r.weekTo)}`}</ITText>}
        </>
      ),
    },
    {
      key: "status",
      label: t("requests.columns.status"),
      type: "catalog",
      width: 140,
      filter: "catalog",
      catalogOptions: { data: PURCHASE_REQUEST_STATUSES.map((s) => ({ id: s, name: tt(`requests.status.${s}`) })) },
      render: (r) => <RequestStatusChip status={r.status} />,
    },
    { key: "lines", label: t("requests.columns.lines"), type: "number", width: 90, sortable: false, filter: false, render: (r) => <ITText className="text-[12px] tabular-nums">{r.lines.length}</ITText> },
    { key: "createdAt", label: t("requests.columns.createdAt"), type: "date", width: 120, filter: false, render: (r) => <ITText className="text-[12px]">{day(r.createdAt)}</ITText> },
    { key: "order", label: t("requests.columns.order"), type: "string", width: 120, sortable: false, filter: false, render: (r) => <ITText className="font-mono text-[12px]">{r.purchaseOrder?.folio ?? "—"}</ITText> },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      {canCreate && (
        <ITFlex gap={3} className="items-end" wrap="wrap">
          <div className="w-[190px]">
            <ITDatePicker
              name="requestWeek"
              label={t("requests.weekFrom")}
              value={dateStrToLocal(week)}
              onChange={(e) => {
                const v = e.target.value;
                if (v instanceof Date) setWeek(mondayOf(localToDateStr(v)));
              }}
            />
          </div>
          <ITButton variant="outlined" color="primary" icon={<FaMagic size={12} />} label={t("requests.generateWeekly")} disabled={busy} onClick={() => void generate(() => purchaseApi.generateWeekly(week))} />
          <ITButton variant="outlined" color="primary" icon={<FaMagic size={12} />} label={t("requests.generateLowStock")} disabled={busy} onClick={() => void generate(() => purchaseApi.generateLowStock())} />
        </ITFlex>
      )}
      {info && (
        <ITAlert variant="info" dismissible onDismiss={() => setInfo(null)}>
          {info}
        </ITAlert>
      )}
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITDataTable
        key={`requests-${reloadKey}`}
        showViewToggle={false}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={purchaseApi.requestsTable as never}
        onRowClick={((row: PurchaseRequestRow) => {
          setSelected(row);
          setSupplierId("");
          setError(null);
        }) as never}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={56}
      />

      <ITDialog isOpen={selected !== null} onClose={() => setSelected(null)} title={selected ? t("requests.detailTitle", { folio: selected.folio }) : ""}>
        {selected && (
          <ITFlex direction="column" gap={3} className="min-w-[560px]">
            {error && <ITAlert variant="error">{error}</ITAlert>}
            <RequestStatusChip status={selected.status} />
            {selected.lines.map((l) => (
              <ITFlex key={l.id} justify="between" gap={3}>
                <div>
                  <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                  <ITText muted className="text-[11px]">{l.reason ?? [l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
                </div>
                <ITText className="text-[12px] font-bold tabular-nums">{qty(l.quantity)}</ITText>
              </ITFlex>
            ))}
            {selected.status === "OPEN" && canCreate && (
              <>
                <ITSelect
                  name="requestSupplier"
                  label={t("requests.supplier")}
                  options={[{ value: "", label: t("requests.pickSupplier") }, ...lookups.suppliers.map((s) => ({ value: s.id, label: s.name }))]}
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                />
                <ITFlex justify="end" gap={2}>
                  <ITButton variant="outlined" color="secondary" label={t("requests.dismiss")} disabled={busy} onClick={() => void dismiss()} />
                  <ITButton variant="filled" color="primary" label={t("requests.convert")} disabled={busy || !supplierId} onClick={() => void convert()} />
                </ITFlex>
              </>
            )}
            {selected.purchaseOrder && (
              <ITButton variant="outlined" color="primary" label={t("requests.openOrder", { folio: selected.purchaseOrder.folio })} onClick={() => { const id = selected.purchaseOrder!.id; setSelected(null); onOpenOrder(id); }} />
            )}
          </ITFlex>
        )}
      </ITDialog>
    </ITFlex>
  );
}
