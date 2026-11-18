import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITDataTable, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBalanceScale, FaClipboardList, FaMinusCircle, FaPlusCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { roomReviewApi, type RoomReview } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { ToneChip } from "@shared/ui/tone-chip";
import { fmtDateTime } from "../lib";
import DiffChip from "./DiffChip";

interface Props {
  id: string;
}

/** Detalle de una revisión: encabezado, totales y renglones esperado/contado/diferencia. */
export default function RoomReviewDetailView({ id }: Props) {
  const { t } = useTranslation("hotel-linen-room-review");
  const tt = dyn(t);
  const [review, setReview] = useState<RoomReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    roomReviewApi
      .get(id)
      .then((r) => active && setReview(r))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  type Line = RoomReview["lines"][number];
  const fetchLines = useMemo(() => makeClientTableFetch<Line>(async () => review?.lines ?? [], {}), [review]);
  const lineColumns: Column<Line>[] = [
    {
      key: "item",
      label: t("columns.item"),
      type: "string",
      filter: true,
      render: (l) => (
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITText className="text-[12px] font-semibold">{`${l.product.code} · ${l.product.name}${l.product.size ? ` · ${l.product.size}` : ""}`}</ITText>
          {l.unexpected && <ToneChip tone="info" label={t("unexpected")} />}
        </ITFlex>
      ),
    },
    { key: "expected", label: t("columns.expected"), type: "number", width: 110, render: (l) => <ITText className="text-[12px] tabular-nums">{l.expected}</ITText> },
    { key: "counted", label: t("columns.counted"), type: "number", width: 110, render: (l) => <ITText className="text-[12px] tabular-nums">{l.counted}</ITText> },
    { key: "diff", label: t("columns.diff"), type: "number", width: 110, render: (l) => <DiffChip diff={l.diff} /> },
  ];

  if (error) return <ITAlert variant="error">{error}</ITAlert>;
  if (!review) return <ITText muted>{t("loading")}</ITText>;

  return (
    <ITFlex direction="column" gap={4}>
      <PanelCard title={`${review.folio} · ${t("detail.room", { number: review.room.number })}`} description={review.room.zone.name}>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.responsible")}</ITText>
            <ITFlex align="center" gap={2}>
              <ProfileAvatar name={review.responsible.name} size="sm" />
              <ITText className="text-[12px] font-semibold">{review.responsible.name}</ITText>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} md={2}>
            <ITText muted className="text-[11px]">{t("detail.shift")}</ITText>
            <ToneChip tone="info" label={tt(`shift.${review.shift}`)} />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("detail.reviewedAt")}</ITText>
            <ITText className="text-[12px] font-semibold">{fmtDateTime(review.reviewedAt)}</ITText>
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITText muted className="text-[11px]">{t("detail.reviewedBy")}</ITText>
            <ITFlex align="center" gap={2}>
              <ProfileAvatar name={review.reviewedBy.name} size="sm" />
              <ITText className="text-[12px] font-semibold">{review.reviewedBy.name}</ITText>
            </ITFlex>
          </ITGrid>
        </ITGrid>
        {review.notes && (
          <ITText className="mt-3 text-[12px]">
            <ITText as="span" muted>{t("detail.notes")}: </ITText>
            {review.notes}
          </ITText>
        )}
      </PanelCard>

      <div className="grid !grid-cols-2 gap-4 md:!grid-cols-4">
        <KpiTile size="sm" label={t("detail.kpi.expected")} value={review.totals.expected} icon={<FaClipboardList size={14} />} tone="sky" />
        <KpiTile size="sm" label={t("detail.kpi.counted")} value={review.totals.counted} icon={<FaBalanceScale size={14} />} tone="violet" />
        <KpiTile size="sm" label={t("detail.kpi.missing")} value={review.totals.missing} icon={<FaMinusCircle size={14} />} tone={review.totals.missing > 0 ? "rose" : "neutral"} hint={review.totals.missing === 0 ? t("detail.allGood") : undefined} />
        <KpiTile size="sm" label={t("detail.kpi.surplus")} value={review.totals.surplus} icon={<FaPlusCircle size={14} />} tone={review.totals.surplus > 0 ? "amber" : "neutral"} hint={review.totals.surplus === 0 ? t("detail.allGood") : undefined} />
      </div>

      <PanelCard title={t("detail.lines")}>
        <ITDataTable
          showViewToggle={false}
          columns={lineColumns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchLines as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
      </PanelCard>
    </ITFlex>
  );
}
