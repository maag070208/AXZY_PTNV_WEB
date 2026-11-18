import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  ITAlert,
  ITBentoGrid,
  ITBentoPill,
  ITBentoTile,
  ITFlex,
  ITText,
  useITBentoCountUp,
} from "@axzydev/axzy_ui_system";
import { LuArrowLeftRight, LuClipboardCheck, LuHandCoins, LuLayers, LuListTodo, LuMapPin, LuShirt, LuTrendingDown } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, reportApi, type HotelStockSummaryRow, type LinenDashboard } from "@entities/hotel-linen";
import { InsightNote, MiniStat } from "@shared/ui/bento-bits";
import { seriesColor } from "@shared/ui/charts";

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n);

// Colores por significado (tokens del tema; el hex es solo respaldo).
const DANGER = "var(--color-danger, #e11d48)";
const WARNING = "var(--color-warning, #f59e0b)";
const SUCCESS = "var(--color-success, #16a34a)";
const INFO = "var(--color-primary-500, #3b82f6)";
const NEUTRAL = "var(--color-slate-400, #94a3b8)";

/** Umbral del tablero para "debajo del par", el mismo de la demo del hotel. */
const BELOW_PAR_PCT = 80;

interface Props {
  /** Navegación a la pantalla del contador (la provee la página). */
  onNavigate: (path: string) => void;
}

/** Número grande que sube de 0 al valor al montar. */
function Big({ value }: { value: number }) {
  const shown = useITBentoCountUp(value, 1200, 0);
  return <>{Math.round(shown).toLocaleString("es-MX")}</>;
}

/** Barra horizontal del mosaico (mismo estilo que el inicio de operación). */
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="it-bento-bar col-span-3">
      <i style={{ "--it-bento-w": `${Math.max(0, Math.min(100, pct))}%`, background: color } as CSSProperties} />
    </div>
  );
}

/**
 * Inicio de Blancos con el mosaico bento: tarjeta principal con las piezas del hotel y el
 * cumplimiento de par, traspasos, bajas y toallas; luego pendientes de operación, piezas por
 * ubicación y artículos debajo del par. Cada bloque solo sale si el rol tiene su permiso
 * (la API manda `null`) y cada número abre su pantalla.
 */
export default function LinenDashboardView({ onNavigate }: Props) {
  const { t } = useTranslation("hotel-linen-report");
  const [data, setData] = useState<LinenDashboard | null>(null);
  const [stock, setStock] = useState<HotelStockSummaryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    reportApi
      .dashboard()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
    // Las existencias completan el tablero; si fallan, el resto sigue.
    hotelLinenApi
      .stockSummary("LINEN")
      .then(setStock)
      .catch(() => setStock([]));
  }, []);
  useEffect(load, [load]);

  if (!data) return error ? <ITAlert variant="error">{error}</ITAlert> : null;

  // ── Existencias de blancos ────────────────────────────────────────────────
  const rows = stock ?? [];
  const totalPieces = rows.reduce((acc, r) => acc + r.total, 0);
  const inTransitPieces = rows.reduce((acc, r) => acc + r.inTransit, 0);
  const withPar = rows.filter((r) => r.par > 0);
  const atPar = withPar.filter((r) => (r.pct ?? 0) >= 100).length;
  const parRatio = withPar.length > 0 ? atPar / withPar.length : 0;
  const belowPar = withPar
    .filter((r) => (r.pct ?? 0) < BELOW_PAR_PCT)
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));

  const byLocationMap = new Map<string, number>();
  for (const r of rows) for (const w of r.byWarehouse) byLocationMap.set(w.name, (byLocationMap.get(w.name) ?? 0) + w.quantity);
  if (inTransitPieces > 0) byLocationMap.set(t("dash.inTransitShort"), inTransitPieces);
  const byLocation = [...byLocationMap.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const locationMax = Math.max(1, ...byLocation.map(([, qty]) => qty));

  // ── Pendientes ─────────────────────────────────────────────────────────────
  const inTransit = data.transfers?.inTransit ?? 0;
  const receivable = data.transfers?.receivable ?? 0;
  const withDifference = data.transfers?.withDifference ?? 0;
  const toReview = data.writeoffs?.toReview ?? 0;
  const toAuthorize = data.writeoffs?.toAuthorize ?? 0;
  const writeoffsTotal = toReview + toAuthorize;
  const towelsPending = data.towels?.pending ?? 0;
  const deposits = (data.towels?.depositsByPoint ?? []).reduce((acc, p) => acc + p.deposits, 0);

  const ops: Array<{ key: string; label: string; value: number; color: string; path: string }> = [];
  if (data.shortages) ops.push({ key: "shortages", label: t("dash.shortages"), value: data.shortages.pieces, color: DANGER, path: "/linen/reconciliation" });
  ops.push({ key: "quarantine", label: t("dash.quarantine"), value: data.quarantine ?? 0, color: WARNING, path: "/linen/writeoffs" });
  if (data.signoffs) ops.push({ key: "signoffs", label: t("dash.signoffs"), value: data.signoffs.pending, color: WARNING, path: "/linen/signoffs" });
  if (data.requests !== null) ops.push({ key: "requests", label: t("dash.requests"), value: data.requests, color: INFO, path: "/linen/requests" });
  if (data.extras !== null) ops.push({ key: "extras", label: t("dash.extras"), value: data.extras, color: WARNING, path: "/linen/extras" });
  if (data.equipment) {
    ops.push({ key: "loaned", label: t("dash.equipmentLoaned"), value: data.equipment.loaned, color: INFO, path: "/linen/equipment" });
    ops.push({ key: "repair", label: t("dash.equipmentRepair"), value: data.equipment.inRepair, color: DANGER, path: "/linen/equipment" });
  }
  if (data.belowMin !== null) ops.push({ key: "belowMin", label: t("dash.belowMin"), value: data.belowMin, color: DANGER, path: "/linen/purchases" });
  if (data.purchase) {
    ops.push({ key: "orders", label: t("dash.ordersToApprove"), value: data.purchase.ordersToApprove ?? 0, color: INFO, path: "/linen/purchases" });
    ops.push({ key: "holds", label: t("dash.holdsDue"), value: data.purchase.holdsDue ?? 0, color: WARNING, path: "/linen/purchases" });
  }

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {withDifference > 0 && (
        <ITAlert variant="warning">{t("dash.differenceBanner", { count: withDifference })}</ITAlert>
      )}

      <ITBentoGrid>
        {/* Piezas del hotel: tarjeta oscura con el cumplimiento de par */}
        <ITBentoTile
          tone="sea"
          cols={3}
          rows={2}
          wide
          icon={<LuShirt size={15} />}
          label={t("dash.piecesTitle")}
          value={<Big value={totalPieces} />}
          caption={t("dash.piecesCaption", { count: rows.length })}
          onClick={() => onNavigate("/linen/stock")}
        >
          <div className="relative z-[1] mt-auto flex flex-wrap gap-1.5">
            {withPar.length === 0 ? (
              <ITBentoPill dot="color-mix(in srgb,currentColor 40%,transparent)">{t("dash.noStock")}</ITBentoPill>
            ) : (
              <>
                <ITBentoPill dot="var(--color-warning)">{t("dash.atParPill", { pct: Math.round(parRatio * 100) })}</ITBentoPill>
                <ITBentoPill dot="color-mix(in srgb,currentColor 40%,transparent)">{t("dash.belowParPill", { count: belowPar.length })}</ITBentoPill>
              </>
            )}
              {inTransitPieces > 0 && (
                <ITBentoPill dot="color-mix(in srgb,currentColor 40%,transparent)">{t("dash.inTransitPill", { count: inTransitPieces })}</ITBentoPill>
              )}
          </div>
        </ITBentoTile>

        {/* Traspasos */}
        {data.transfers && (
          <ITBentoTile
            tone="lavender"
            cols={3}
            rows={2}
            icon={<LuArrowLeftRight size={15} />}
            label={t("dash.inTransit")}
            value={<Big value={inTransit} />}
            caption={receivable > 0 ? t("dash.receivable", { count: receivable }) : t("dash.noReceivable")}
            onClick={() => onNavigate("/linen/transfers")}
          >
            <div className="mt-auto flex flex-wrap gap-1.5">
              <ITBentoPill dot={withDifference > 0 ? DANGER : SUCCESS}>
                {t("dash.differencePill", { count: withDifference })}
              </ITBentoPill>
            </div>
          </ITBentoTile>
        )}

        {/* Bajas pendientes */}
        {data.writeoffs && (
          <ITBentoTile
            cols={3}
            rows={2}
            icon={<LuClipboardCheck size={15} />}
            label={t("dash.writeoffsTitle")}
            value={
              <ITText as="span" style={{ color: writeoffsTotal > 0 ? WARNING : SUCCESS }}>
                <Big value={writeoffsTotal} />
              </ITText>
            }
            caption={t("dash.writeoffsCaption", { review: toReview, authorize: toAuthorize })}
            onClick={() => onNavigate("/linen/writeoffs")}
          >
            {writeoffsTotal === 0 && (
              <ITText as="span" className="mt-auto inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[color:var(--color-success)]">
                {t("dash.allGood")}
              </ITText>
            )}
          </ITBentoTile>
        )}

        {/* Toallas prestadas y depósito en caja */}
        {data.towels && (
          <ITBentoTile
            tone="sun"
            cols={3}
            rows={2}
            icon={<LuHandCoins size={15} />}
            label={t("dash.towels")}
            value={<Big value={towelsPending} />}
            caption={t("dash.towelsCaption", { loans: data.towels.openLoans, money: money(deposits) })}
            onClick={() => onNavigate("/linen/loans")}
          >
            {data.towels.depositsByPoint.length > 0 && (
              <div className="mt-auto grid gap-1">
                {data.towels.depositsByPoint.map((p) => (
                  <div key={p.warehouseId} className="grid grid-cols-[1fr_auto] gap-2 text-[12px] font-medium">
                    <ITText as="span" className="truncate">{p.name}</ITText>
                    <ITText as="span" className="tabular-nums">{money(p.deposits)}</ITText>
                  </div>
                ))}
              </div>
            )}
          </ITBentoTile>
        )}

        {/* Pendientes de operación */}
        <ITBentoTile cols={12} rows={3} wide icon={<LuListTodo size={15} />} label={t("dash.opsTitle")}>
          {ops.length === 0 ? (
            <ITText className="m-0 mt-3 text-[12px] font-semibold opacity-60">{t("dash.noTiles")}</ITText>
          ) : (
            <div className="mt-2 grid !grid-cols-2 gap-2 md:!grid-cols-5">
              {ops.map((o) => (
                <MiniStat
                  key={o.key}
                  label={o.label}
                  value={fmt(o.value)}
                  color={o.value > 0 ? o.color : NEUTRAL}
                  onClick={() => onNavigate(o.path)}
                />
              ))}
            </div>
          )}
        </ITBentoTile>

        {/* Piezas por ubicación */}
        <ITBentoTile
          cols={6}
          rows={3}
          wide
          icon={<LuMapPin size={15} />}
          label={t("dash.byLocation")}
          onClick={() => onNavigate("/linen/stock")}
        >
          {byLocation.length === 0 ? (
            <ITFlex direction="column" align="center" justify="center" gap={2} className="flex-1 opacity-60">
              <LuMapPin size={22} />
              <ITText className="m-0 text-[12.5px] font-semibold">{t("dash.noStock")}</ITText>
            </ITFlex>
          ) : (
            <div className="it-bento-bars mt-3 flex-1 content-around">
              {byLocation.map(([name, qty], i) => (
                <div key={name} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium">
                  <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: seriesColor(i) }} />
                  <ITText as="span" className="truncate">{name}</ITText>
                  <ITText as="span" className="tabular-nums">{fmt(qty)}</ITText>
                  <Bar pct={(qty / locationMax) * 100} color={seriesColor(i)} />
                </div>
              ))}
            </div>
          )}
        </ITBentoTile>

        {/* Artículos debajo del par */}
        <ITBentoTile
          cols={6}
          rows={3}
          wide
          icon={<LuTrendingDown size={15} />}
          label={t("dash.belowParTitle", { pct: BELOW_PAR_PCT })}
          onClick={() => onNavigate("/linen/reports")}
        >
          {belowPar.length === 0 ? (
            <ITFlex direction="column" align="center" justify="center" gap={2} className="flex-1 text-center">
              <LuLayers size={22} className={withPar.length > 0 ? "text-[color:var(--color-success)]" : "opacity-60"} />
              <ITText className={`m-0 text-[12.5px] font-semibold ${withPar.length > 0 ? "text-[color:var(--color-success)]" : "opacity-60"}`}>
                {withPar.length > 0 ? t("dash.belowParEmpty") : t("dash.noPar")}
              </ITText>
            </ITFlex>
          ) : (
            <div className="it-bento-bars mt-3 flex-1 content-start">
              {belowPar.slice(0, 7).map((r) => {
                const pct = Math.round(r.pct ?? 0);
                const color = pct < 50 ? DANGER : WARNING;
                return (
                  <div key={r.productId} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium">
                    <ITText as="span" className="truncate">{r.name}</ITText>
                    <ITText as="span" className="tabular-nums opacity-60">
                      {fmt(r.total)} / {fmt(r.par)}
                    </ITText>
                    <ITText as="span" className="tabular-nums font-bold" style={{ color }}>
                      {pct}%
                    </ITText>
                    <Bar pct={pct} color={color} />
                  </div>
                );
              })}
            </div>
          )}
          {belowPar.length > 7 && (
            <InsightNote className="mt-auto">{t("dash.belowParMore", { count: belowPar.length - 7 })}</InsightNote>
          )}
        </ITBentoTile>
      </ITBentoGrid>
    </ITFlex>
  );
}
