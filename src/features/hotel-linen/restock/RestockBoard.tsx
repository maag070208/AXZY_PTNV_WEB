import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITFlex, ITGrid, ITSegmentedControl, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaClipboardList, FaExclamationTriangle, FaTruck, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, restockApi, RESTOCK_FACTORS, type HotelWarehouse, type RestockResult } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { useSuccessToast } from "@app/toast/useSuccessToast";

interface Props {
  /** Lleva al pedido de área creado. */
  onCreated: (requestId: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
type RestockLine = RestockResult["lines"][number];

/** Reposición por dotación: déficit = objetivo (dotación x factor) - (tiene + en camino) de una ropería de zona. */
export default function RestockBoard({ onCreated }: Props) {
  const { t } = useTranslation("hotel-linen-restock");
  const notify = useSuccessToast();
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [factor, setFactor] = useState(1);
  const [result, setResult] = useState<RestockResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hotelLinenApi
      .warehouses()
      .then((all) => {
        const zones = all.filter((w) => w.kind === "ZONE" && w.zoneId && w.active);
        setAreas(zones);
        if (zones.length === 1) setWarehouseId(zones[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!warehouseId) {
      setResult(null);
      return;
    }
    let active = true;
    setError(null);
    restockApi
      .compute(warehouseId, factor)
      .then((r) => active && setResult(r))
      .catch((e: Error) => active && (setResult(null), setError(e.message)));
    return () => {
      active = false;
    };
  }, [warehouseId, factor]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await restockApi.request(warehouseId, factor);
      notify(t("toast.created"));
      onCreated(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<RestockLine>(async () => result?.lines ?? [], {
        name: { value: (l) => `${l.code} ${l.name} ${l.size ?? ""}`, sortValue: (l) => l.code },
      }),
    [result]
  );

  const num = (n: number, bold = false) => <ITText className={`text-[12px] tabular-nums ${bold ? "font-bold" : ""}`}>{fmt(n)}</ITText>;

  const columns: Column<RestockLine>[] = [
    {
      key: "name",
      label: t("item"),
      type: "string",
      width: 260,
      filter: true,
      render: (l) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{l.size ? `${l.name} · ${l.size}` : l.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{l.code}</ITText>
        </ITFlex>
      ),
    },
    { key: "target", label: t("target"), type: "number", width: 110, render: (l) => num(l.target) },
    { key: "onHand", label: t("onHand"), type: "number", width: 110, render: (l) => num(l.onHand) },
    { key: "incoming", label: t("incoming"), type: "number", width: 110, render: (l) => num(l.incoming) },
    { key: "deficit", label: t("deficit"), type: "number", width: 110, render: (l) => num(l.deficit, true) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <PanelCard
        description={t("formula")}
        actions={
          <ITButton
            variant="filled"
            color="primary"
            icon={<FaClipboardList size={12} />}
            label={t("generate")}
            disabled={!result || result.totals.deficit === 0 || busy}
            onClick={() => void generate()}
          />
        }
      >
        <ITFlex align="end" gap={4} wrap="wrap">
          <ITFlex direction="column" className="min-w-[260px]">
            <ITSelect
              name="restockArea"
              label={t("area")}
              options={areas.map((a) => ({ value: a.id, label: `${a.code} · ${a.name}` }))}
              value={warehouseId}
              onChange={(e) => setWarehouseId(String(e.target.value))}
            />
          </ITFlex>
          <ITFlex direction="column" gap={1}>
            <ITText muted className="text-[11px]">{t("factor")}</ITText>
            <ITSegmentedControl
              size="sm"
              value={String(factor)}
              onChange={(v) => setFactor(Number(v))}
              options={RESTOCK_FACTORS.map((f) => ({ value: String(f), label: `x${f}` }))}
            />
          </ITFlex>
        </ITFlex>
      </PanelCard>

      {!warehouseId && (
        <ITFlex direction="column" align="center" gap={2} className="py-6">
          <FaWarehouse size={28} className="opacity-30" />
          <ITText muted className="text-[12px]">{t("pick")}</ITText>
        </ITFlex>
      )}
      {result && (
        <>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={6} md={3}><KpiTile label={t("target")} value={fmt(result.totals.target)} icon={<FaBoxOpen size={14} />} tone="sky" hint={t("rooms", { count: result.rooms })} /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("onHand")} value={fmt(result.totals.onHand)} icon={<FaWarehouse size={14} />} tone="emerald" /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("incoming")} value={fmt(result.totals.incoming)} icon={<FaTruck size={14} />} tone={result.totals.incoming > 0 ? "violet" : "neutral"} /></ITGrid>
            <ITGrid item xs={6} md={3}><KpiTile label={t("deficit")} value={fmt(result.totals.deficit)} icon={<FaExclamationTriangle size={14} />} tone={result.totals.deficit > 0 ? "amber" : "neutral"} hint={result.totals.deficit === 0 ? t("noDeficit") : undefined} /></ITGrid>
          </ITGrid>
          <PanelCard title={t("item")}>
            {result.lines.length === 0 ? (
              <ITFlex direction="column" align="center" gap={2} className="py-6">
                <FaBoxOpen size={28} className="opacity-30" />
                <ITText muted className="text-[12px]">{t("noPar")}</ITText>
              </ITFlex>
            ) : (
              <ITDataTable
                key={`${warehouseId}-${factor}`}
                showViewToggle={false}
                columns={columns as unknown as Column<Record<string, unknown>>[]}
                fetchData={fetchData as never}
                size="lg"
                defaultItemsPerPage={25}
                itemsPerPageOptions={[25, 50, 100]}
                layout="fixed"
                density="compact"
                rowHeight={56}
              />
            )}
          </PanelCard>
        </>
      )}
    </ITFlex>
  );
}
