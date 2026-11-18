import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITDataTable, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBan, FaBoxes, FaHandHolding, FaSoap, FaTshirt, FaTrash, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { flowApi, FLOW_STAGES, type FlowBoard as FlowBoardData, type FlowStage } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { PanelCard } from "@shared/ui/panel-card";
import { KpiTile, type KpiTone } from "@shared/ui/kpi-tile";
import type { ReactNode } from "react";

type FlowItem = FlowBoardData["items"][number];

interface Props {
  /** Avisa el documento exportable (la página pone «Exportar» en su encabezado). */
  onDoc?: (doc: ReportDoc | null) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

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
export default function FlowBoard({ onDoc }: Props) {
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

  useEffect(() => {
    onDoc?.(doc);
  }, [doc, onDoc]);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<FlowItem>(async () => board?.items ?? [], {
        name: { value: (i) => `${i.code} ${i.name} ${i.size ?? ""}`, sortValue: (i) => i.code },
        ...Object.fromEntries(FLOW_STAGES.map((s) => [s, { sortValue: (i: FlowItem) => i.stages[s] }])),
      }),
    [board]
  );

  const num = (n: number, bold = false) => <ITText className={`text-[12px] tabular-nums ${bold ? "font-bold" : ""}`}>{fmt(n)}</ITText>;

  const columns: Column<FlowItem>[] = [
    {
      key: "name",
      label: t("item"),
      type: "string",
      width: 240,
      filter: true,
      render: (i) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{i.size ? `${i.name} · ${i.size}` : i.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{i.code}</ITText>
        </ITFlex>
      ),
    },
    ...FLOW_STAGES.map((s) => ({
      key: s,
      label: t(`stage.${s}`),
      type: "number" as const,
      width: 105,
      render: (i: FlowItem) => num(i.stages[s]),
    })),
    { key: "inTransit", label: t("inTransit"), type: "number", width: 105, render: (i) => num(i.inTransit) },
    { key: "total", label: t("total"), type: "number", width: 95, render: (i) => num(i.total, true) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {board && (
        <>
          <ITFlex align="center" wrap="wrap" gap={3}>
            <ITChip size="sm" color={board.reconciled ? "success" : "danger"} label={board.reconciled ? t("reconciled") : t("notReconciled")} />
            <ITText muted className="text-[12px]">
              {t("transitLine", { transit: fmt(board.totals.inTransit), other: fmt(board.totals.other), total: fmt(board.totals.total) })}
            </ITText>
          </ITFlex>
          <ITGrid container columns={12} spacing={3}>
            {FLOW_STAGES.map((s) => (
              <ITGrid key={s} item xs={6} md={3} lg={2}>
                <KpiTile
                  size="sm"
                  label={t(`stage.${s}`)}
                  value={fmt(board.totals.stages[s])}
                  icon={STAGE_VISUAL[s].icon}
                  tone={board.totals.stages[s] === 0 ? "neutral" : STAGE_VISUAL[s].tone}
                  hint={s === "LENT" && board.totals.inRooms > 0 ? t("inRooms", { count: board.totals.inRooms }) : t(`hint.${s}`)}
                />
              </ITGrid>
            ))}
          </ITGrid>
          <PanelCard title={t("item")}>
            {board.items.length === 0 ? (
              <ITFlex direction="column" align="center" gap={2} className="py-6">
                <FaBoxes size={28} className="opacity-30" />
                <ITText muted className="text-[12px]">{t("none")}</ITText>
              </ITFlex>
            ) : (
              <ITDataTable
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
