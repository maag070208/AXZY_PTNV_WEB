import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ITAlert, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBoxOpen,
  FaBroom,
  FaCheckCircle,
  FaClipboardList,
  FaCoins,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaHandHolding,
  FaPlusCircle,
  FaTools,
  FaTruck,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { reportApi, type LinenDashboard } from "@entities/hotel-linen";
import { KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

interface Props {
  /** Navegación a la pantalla del contador (la provee la página). */
  onNavigate: (path: string) => void;
}

interface Tile {
  key: string;
  label: string;
  count: number;
  value?: string;
  icon: ReactNode;
  /** Tono cuando hay pendientes; en cero siempre es neutral. */
  tone: KpiTone;
  hint?: string;
  path: string;
}

/** Tablero de inicio de Blancos: contadores por rol, neutrales en cero, cada uno enlaza a su pantalla. */
export default function LinenDashboardView({ onNavigate }: Props) {
  const { t } = useTranslation("hotel-linen-report");
  const [data, setData] = useState<LinenDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    reportApi
      .dashboard()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const tiles: Tile[] = [];
  if (data) {
    if (data.transfers) {
      const { inTransit, receivable, withDifference } = data.transfers;
      tiles.push({ key: "inTransit", label: t("dash.inTransit"), count: inTransit ?? 0, icon: <FaTruck size={14} />, tone: "sky", hint: (receivable ?? 0) > 0 ? t("dash.receivable", { count: receivable ?? 0 }) : undefined, path: "/linen/transfers" });
      tiles.push({ key: "withDifference", label: t("dash.withDifference"), count: withDifference ?? 0, icon: <FaExchangeAlt size={14} />, tone: "rose", hint: t("dash.last7"), path: "/linen/transfers" });
    }
    if (data.writeoffs) {
      tiles.push({ key: "toReview", label: t("dash.writeoffsReview"), count: data.writeoffs.toReview ?? 0, icon: <FaClipboardList size={14} />, tone: "amber", path: "/linen/writeoffs" });
      tiles.push({ key: "toAuthorize", label: t("dash.writeoffsAuthorize"), count: data.writeoffs.toAuthorize ?? 0, icon: <FaClipboardList size={14} />, tone: "violet", path: "/linen/writeoffs" });
    }
    if (data.shortages) tiles.push({ key: "shortages", label: t("dash.shortages"), count: data.shortages.pieces, value: fmt(data.shortages.pieces), icon: <FaExclamationTriangle size={14} />, tone: "rose", hint: t("dash.areas", { count: data.shortages.areas }), path: "/linen/reconciliation" });
    tiles.push({ key: "quarantine", label: t("dash.quarantine"), count: data.quarantine ?? 0, value: fmt(data.quarantine ?? 0), icon: <FaExclamationTriangle size={14} />, tone: "amber", hint: t("dash.quarantineHint"), path: "/linen/writeoffs" });
    if (data.towels) tiles.push({ key: "towels", label: t("dash.towels"), count: data.towels.pending, value: fmt(data.towels.pending), icon: <FaHandHolding size={14} />, tone: "sky", hint: t("dash.openLoans", { count: data.towels.openLoans }), path: "/linen/loans" });
    if (data.extras !== null) tiles.push({ key: "extras", label: t("dash.extras"), count: data.extras, icon: <FaPlusCircle size={14} />, tone: "amber", path: "/linen/extras" });
    if (data.equipment) {
      tiles.push({ key: "loaned", label: t("dash.equipmentLoaned"), count: data.equipment.loaned, icon: <FaBroom size={14} />, tone: "sky", path: "/linen/equipment" });
      tiles.push({ key: "repair", label: t("dash.equipmentRepair"), count: data.equipment.inRepair, icon: <FaTools size={14} />, tone: "orange", path: "/linen/equipment" });
    }
    if (data.requests !== null) tiles.push({ key: "requests", label: t("dash.requests"), count: data.requests, icon: <FaBoxOpen size={14} />, tone: "amber", path: "/linen/requests" });
    if (data.belowMin !== null) tiles.push({ key: "belowMin", label: t("dash.belowMin"), count: data.belowMin, icon: <FaExclamationTriangle size={14} />, tone: "rose", path: "/linen/purchases" });
    if (data.purchase) {
      tiles.push({ key: "orders", label: t("dash.ordersToApprove"), count: data.purchase.ordersToApprove ?? 0, icon: <FaFileInvoiceDollar size={14} />, tone: "violet", path: "/linen/purchases" });
      tiles.push({ key: "holds", label: t("dash.holdsDue"), count: data.purchase.holdsDue ?? 0, icon: <FaCoins size={14} />, tone: "orange", path: "/linen/purchases" });
    }
  }

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {data && tiles.length === 0 && <ITText muted>{t("dash.noTiles")}</ITText>}
      <ITGrid container columns={12} spacing={3}>
        {tiles.map((tile) => (
          <ITGrid item xs={6} md={3} key={tile.key}>
            <KpiTile
              label={tile.label}
              value={tile.value ?? tile.count}
              icon={tile.count === 0 ? <FaCheckCircle size={14} /> : tile.icon}
              tone={tile.count > 0 ? tile.tone : "neutral"}
              hint={tile.count === 0 ? t("dash.allGood") : tile.hint}
              onClick={() => onNavigate(tile.path)}
            />
          </ITGrid>
        ))}
      </ITGrid>
      {data?.towels && data.towels.depositsByPoint.length > 0 && (
        <PanelCard title={t("dash.depositsTitle")} description={t("dash.depositsDescription")}>
          <ITFlex direction="column" gap={2}>
            {data.towels.depositsByPoint.map((p) => (
              <ITFlex key={p.warehouseId} justify="between" gap={3}>
                <ITText className="text-[13px] font-bold">{p.name}</ITText>
                <ITText className="text-[13px] tabular-nums">
                  {t("dash.pointLine", { pending: fmt(p.pending), loans: p.openLoans })} · <strong>{money(p.deposits)}</strong>
                </ITText>
              </ITFlex>
            ))}
          </ITFlex>
        </PanelCard>
      )}
    </ITFlex>
  );
}
