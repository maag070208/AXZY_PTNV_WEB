import { useCallback, useState } from "react";
import { ITAlert, ITButton, ITChip, ITDataTable, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, type ShiftCloseRow } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { PanelCard } from "@shared/ui/panel-card";
import { fmt, fmtDateTime, money } from "../lib";

interface Props {
  reloadSignal: number;
}

/** Historial de cortes de turno; Contabilidad los revisa con su firma. */
export default function ShiftClosesBoard({ reloadSignal }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const canReview = useCan("hotel_linen.deposits_review");
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const review = useCallback(async (id: string) => {
    setError(null);
    try {
      await receptionApi.reviewClose(id);
      setReload((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const columns: Column<ShiftCloseRow>[] = [
    { key: "folio", label: t("closes.columns.folio"), type: "string", width: 100, filter: true, render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText> },
    { key: "to", label: t("closes.columns.date"), type: "date", width: 150, filter: "date-range", render: (r) => <ITText className="text-[12px]">{fmtDateTime(r.to)}</ITText> },
    { key: "point", label: t("closes.columns.point"), type: "string", width: 150, sortable: false, render: (r) => <ITText className="text-[12px]">{r.point.name}</ITText> },
    { key: "closedBy", label: t("closes.columns.closedBy"), type: "string", width: 150, sortable: false, render: (r) => <ITText className="text-[12px]">{r.closedBy.name}</ITText> },
    { key: "receivedBy", label: t("closes.columns.receivedBy"), type: "string", width: 150, sortable: false, render: (r) => <ITText className="text-[12px]">{r.receivedBy?.name ?? (r.endOfDay ? t("closes.endOfDay") : "—")}</ITText> },
    { key: "lent", label: t("closes.columns.lent"), type: "number", width: 90, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.lent)}</ITText> },
    { key: "unreturned", label: t("closes.columns.unreturned"), type: "number", width: 110, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.unreturned)}</ITText> },
    { key: "depositsCollected", label: t("closes.columns.collected"), type: "number", width: 110, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{money(r.depositsCollected)}</ITText> },
    { key: "depositsRetained", label: t("closes.columns.retained"), type: "number", width: 110, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{money(r.depositsRetained)}</ITText> },
    {
      key: "reviewed",
      label: t("closes.columns.review"),
      type: "catalog",
      width: 150,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: [{ id: "true", name: t("closes.reviewed") }, { id: "false", name: t("closes.pending") }] },
      render: (r) =>
        r.reviewedAt ? (
          <ITChip size="sm" color="success" label={r.reviewedBy?.name ?? t("closes.reviewed")} />
        ) : canReview ? (
          <ITButton size="sm" variant="outlined" color="primary" label={t("closes.review")} onClick={() => void review(r.id)} />
        ) : (
          <ITChip size="sm" color="warning" label={t("closes.pending")} />
        ),
    },
  ];

  return (
    <PanelCard title={t("closes.title")} description={t("closes.description")}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITDataTable
        showViewToggle={false}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={receptionApi.closesTable as never}
        reloadTrigger={`${reloadSignal}-${reload}`}
        size="lg"
        defaultItemsPerPage={10}
        itemsPerPageOptions={[10, 25, 50]}
        layout="fixed"
        density="compact"
        rowHeight={56}
      />
    </PanelCard>
  );
}
