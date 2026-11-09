import { useCallback, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBroom, FaExclamationTriangle, FaReply, FaShower, FaSpinner, FaTshirt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { LAUNDRY_STAGES, LAUNDRY_TRANSITIONS, laundryApi, type LaundryBoard, type LaundryBoardProduct } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { fmt } from "../lib";
import LaundryLinesDialog, { type LinesMode } from "./LaundryLinesDialog";
import LaundryMoveDialog from "./LaundryMoveDialog";

const STAGE_TONE = { DIRTY: "orange", IN_PROCESS: "sky", CLEAN: "emerald", QUARANTINE: "rose" } as const;
const STAGE_ICON = {
  DIRTY: <FaTshirt size={14} />,
  IN_PROCESS: <FaSpinner size={14} />,
  CLEAN: <FaShower size={14} />,
  QUARANTINE: <FaExclamationTriangle size={14} />,
} as const;

interface Props {
  requestCosign: (title: string) => Promise<string | null>;
}

/** Tablero de lavandería: etapas (sucio, en proceso, limpio, cuarentena) por artículo, con ciclos promedio. */
export default function LaundryBoardView({ requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const canProcess = useCan("hotel_linen.process");
  const canTransfer = useCan("hotel_linen.transfer_send");
  const [board, setBoard] = useState<LaundryBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moveRow, setMoveRow] = useState<LaundryBoardProduct | null>(null);
  const [linesMode, setLinesMode] = useState<LinesMode | null>(null);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    try {
      const b = await laundryApi.board();
      setBoard(b);
      setError(null);
      return b.products;
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, []);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<LaundryBoardProduct>(load, {
        name: { value: (r) => `${r.product.code} ${r.product.name}`, sortValue: (r) => r.product.code },
        ...Object.fromEntries(LAUNDRY_STAGES.map((s) => [s, { sortValue: (r: LaundryBoardProduct) => r.stages[s] ?? 0 }])),
        averageCycles: { sortValue: (r) => r.averageCycles },
      }),
    [load]
  );

  const done = () => {
    setMoveRow(null);
    setLinesMode(null);
    setReload((n) => n + 1);
  };

  const columns: Column<LaundryBoardProduct>[] = [
    {
      key: "name",
      label: t("laundry.columns.item"),
      type: "string",
      width: 260,
      filter: true,
      render: (r) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{r.product.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{[r.product.code, r.product.size].filter(Boolean).join(" · ")}</ITText>
        </ITFlex>
      ),
    },
    ...LAUNDRY_STAGES.map((s) => ({
      key: s,
      label: tt(`laundry.stage.${s}`),
      type: "number" as const,
      width: 110,
      render: (r: LaundryBoardProduct) => <ITText className="text-[12px] tabular-nums">{r.stages[s] ? fmt(r.stages[s]) : "—"}</ITText>,
    })),
    {
      key: "total",
      label: t("laundry.columns.total"),
      type: "number",
      width: 90,
      sortable: false,
      render: (r) => <ITText className="text-[12px] font-bold tabular-nums">{fmt(r.total)}</ITText>,
    },
    {
      key: "averageCycles",
      label: t("laundry.columns.cycles"),
      type: "number",
      width: 110,
      render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.averageCycles)}</ITText>,
    },
    ...(canProcess
      ? [
          {
            key: "actions",
            label: "",
            type: "string" as const,
            width: 130,
            sortable: false,
            render: (r: LaundryBoardProduct) => {
              const movable = Object.keys(LAUNDRY_TRANSITIONS).some((s) => (r.stages[s] ?? 0) > 0);
              return (
                <ITButton variant="outlined" color="primary" size="sm" label={t("laundry.move.action")} disabled={!movable} onClick={() => setMoveRow(r)} />
              );
            },
          },
        ]
      : []),
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITGrid container columns={12} spacing={3}>
        {LAUNDRY_STAGES.map((s) => (
          <ITGrid key={s} item xs={6} md={3}>
            <KpiTile
              label={tt(`laundry.stage.${s}`)}
              value={fmt(board?.totals[s] ?? 0)}
              icon={STAGE_ICON[s]}
              tone={(board?.totals[s] ?? 0) > 0 ? STAGE_TONE[s] : "neutral"}
            />
          </ITGrid>
        ))}
      </ITGrid>

      <PanelCard
        title={t("laundry.title")}
        description={t("laundry.description")}
        actions={
          canTransfer ? (
            <ITFlex gap={2} wrap="wrap">
              <ITButton variant="outlined" color="primary" icon={<FaBroom size={12} />} label={t("laundry.firstWash.action")} onClick={() => setLinesMode("firstWash")} />
              <ITButton variant="outlined" color="danger" icon={<FaReply size={12} />} label={t("laundry.supplierReturn.action")} onClick={() => setLinesMode("supplierReturn")} />
            </ITFlex>
          ) : undefined
        }
      >
        <ITFlex direction="column" gap={3}>
          {error && (
            <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </ITAlert>
          )}
          <ITDataTable
            key={`laundry-${reload}`}
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
        </ITFlex>
      </PanelCard>

      <LaundryMoveDialog row={moveRow} onClose={() => setMoveRow(null)} onDone={done} />
      <LaundryLinesDialog mode={linesMode} board={board} requestCosign={requestCosign} onClose={() => setLinesMode(null)} onDone={done} />
    </ITFlex>
  );
}
