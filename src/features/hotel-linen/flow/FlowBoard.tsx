import { Fragment, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITChip, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaBan, FaBoxes, FaFileCsv, FaHandHolding, FaSoap, FaTshirt, FaTrash, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { flowApi, FLOW_STAGES, type FlowBoard as FlowBoardData, type FlowStage } from "@entities/hotel-linen";
import { downloadReportCsv, type ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import type { ReactNode } from "react";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const th = "px-2 py-2 text-[11px] font-bold uppercase text-right";
const td = "px-2 py-1.5 text-[12px] tabular-nums text-right";

const STAGE_VISUAL: Record<FlowStage, { icon: ReactNode; tone: KpiTone }> = {
  AREAS: { icon: <FaTshirt size={14} />, tone: "sky" },
  DIRTY: { icon: <FaTrash size={14} />, tone: "rose" },
  LAUNDRY: { icon: <FaSoap size={14} />, tone: "violet" },
  CLEAN: { icon: <FaBoxes size={14} />, tone: "emerald" },
  LENT: { icon: <FaHandHolding size={14} />, tone: "amber" },
  QUARANTINE: { icon: <FaBan size={14} />, tone: "orange" },
  STORE: { icon: <FaWarehouse size={14} />, tone: "neutral" },
};

/** Flujo de blancos: dónde está cada pieza (7 etapas + en tránsito) y su detalle por artículo. */
export default function FlowBoard() {
  const { t } = useTranslation("hotel-linen-flow");
  const [board, setBoard] = useState<FlowBoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    flowApi.board("LINEN").then(setBoard).catch((e: Error) => setError(e.message));
  }, []);

  const doc = useMemo<ReportDoc | null>(() => {
    if (!board) return null;
    const row = (label: string, x: { stages: Record<FlowStage, number>; other: number; inTransit: number; total: number }) => ({
      item: label,
      ...Object.fromEntries(FLOW_STAGES.map((s) => [s, fmt(x.stages[s])])),
      other: fmt(x.other),
      inTransit: fmt(x.inTransit),
      total: fmt(x.total),
    });
    return {
      title: t("title"),
      subtitle: board.reconciled ? t("reconciled") : t("notReconciled"),
      columns: [
        { key: "item", label: t("item") },
        ...FLOW_STAGES.map((s) => ({ key: s, label: t(`stage.${s}`), align: "right" as const })),
        { key: "other", label: t("other"), align: "right" as const },
        { key: "inTransit", label: t("inTransit"), align: "right" as const },
        { key: "total", label: t("total"), align: "right" as const },
      ],
      rows: [...board.items.map((i) => row(`${i.code} · ${i.name}${i.size ? ` · ${i.size}` : ""}`, i)), row(t("totals"), board.totals)],
    };
  }, [board, t]);

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {board && (
        <>
          <ITFlex justify="between" align="center" wrap="wrap" gap={2}>
            <ITChip size="sm" color={board.reconciled ? "success" : "danger"} label={board.reconciled ? t("reconciled") : t("notReconciled")} />
            <ITButton variant="outlined" color="secondary" icon={<FaFileCsv size={12} />} label={t("exportCsv")} disabled={!doc} onClick={() => doc && downloadReportCsv(doc, "blancos-flujo")} />
          </ITFlex>
          {/* Etapas en secuencia con flechas; el tránsito va aparte. */}
          <div className="flex flex-wrap items-stretch gap-2">
            {FLOW_STAGES.map((s, i) => (
              <Fragment key={s}>
                <div className="min-w-[150px] flex-1">
                  <KpiTile
                    label={t(`stage.${s}`)}
                    value={fmt(board.totals.stages[s])}
                    icon={STAGE_VISUAL[s].icon}
                    tone={STAGE_VISUAL[s].tone}
                    hint={s === "LENT" && board.totals.inRooms > 0 ? t("inRooms", { count: board.totals.inRooms }) : t(`hint.${s}`)}
                  />
                </div>
                {i < FLOW_STAGES.length - 1 && <FaArrowRight size={12} className="hidden self-center opacity-40 xl:block" />}
              </Fragment>
            ))}
          </div>
          <ITText muted className="text-[12px]">
            {t("transitLine", { transit: fmt(board.totals.inTransit), other: fmt(board.totals.other), total: fmt(board.totals.total) })}
          </ITText>
          {board.items.length === 0 ? (
            <ITText muted className="py-3 text-[12px]">{t("none")}</ITText>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-2 py-2 text-[11px] font-bold uppercase text-left">{t("item")}</th>
                    {FLOW_STAGES.map((s) => <th key={s} className={th}>{t(`stage.${s}`)}</th>)}
                    <th className={th}>{t("inTransit")}</th>
                    <th className={th}>{t("total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {board.items.map((i) => (
                    <tr key={i.productId} className="border-b border-[var(--color-border)]">
                      <td className="px-2 py-1.5 text-[12px] text-left">{i.name}{i.size ? ` · ${i.size}` : ""}<span className="ml-2 font-mono text-[11px] opacity-60">{i.code}</span></td>
                      {FLOW_STAGES.map((s) => <td key={s} className={td}>{fmt(i.stages[s])}</td>)}
                      <td className={td}>{fmt(i.inTransit)}</td>
                      <td className={`${td} font-bold`}>{fmt(i.total)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="px-2 py-1.5 text-[12px] text-left">{t("totals")}</td>
                    {FLOW_STAGES.map((s) => <td key={s} className={td}>{fmt(board.totals.stages[s])}</td>)}
                    <td className={td}>{fmt(board.totals.inTransit)}</td>
                    <td className={td}>{fmt(board.totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ITFlex>
  );
}
