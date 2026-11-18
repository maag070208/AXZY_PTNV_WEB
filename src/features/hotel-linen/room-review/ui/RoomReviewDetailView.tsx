import { useEffect, useState } from "react";
import { ITAlert, ITBadget, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { roomReviewApi, type RoomReview } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
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
            <ITText className="text-[12px] font-semibold">{tt(`shift.${review.shift}`)}</ITText>
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
        <ITFlex gap={2} wrap="wrap" className="mt-3">
          <ITBadget color="info" size="lg">{t("detail.totalExpected", { n: review.totals.expected })}</ITBadget>
          <ITBadget color="info" size="lg">{t("detail.totalCounted", { n: review.totals.counted })}</ITBadget>
          <ITBadget color={review.totals.missing > 0 ? "danger" : "success"} size="lg">{t("detail.totalMissing", { n: review.totals.missing })}</ITBadget>
          <ITBadget color={review.totals.surplus > 0 ? "warning" : "success"} size="lg">{t("detail.totalSurplus", { n: review.totals.surplus })}</ITBadget>
        </ITFlex>
        {review.notes && (
          <ITText className="mt-3 text-[12px]">
            <ITText as="span" muted>{t("detail.notes")}: </ITText>
            {review.notes}
          </ITText>
        )}
      </PanelCard>

      <PanelCard title={t("detail.lines")}>
        <ITFlex direction="column" gap={2}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={6}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.item")}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.expected")}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.counted")}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.diff")}</ITText></ITGrid>
          </ITGrid>
          {review.lines.map((l) => (
            <ITGrid key={l.product.id} container columns={12} spacing={3} className="items-center">
              <ITGrid item xs={6}>
                <ITFlex align="center" gap={2} wrap="wrap">
                  <ITText className="text-[12px] font-semibold">{`${l.product.code} · ${l.product.name}${l.product.size ? ` · ${l.product.size}` : ""}`}</ITText>
                  {l.unexpected && <ITBadget color="info" size="sm">{t("unexpected")}</ITBadget>}
                </ITFlex>
              </ITGrid>
              <ITGrid item xs={2}><ITText className="text-[12px] tabular-nums">{l.expected}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText className="text-[12px] tabular-nums">{l.counted}</ITText></ITGrid>
              <ITGrid item xs={2}><DiffChip diff={l.diff} /></ITGrid>
            </ITGrid>
          ))}
        </ITFlex>
      </PanelCard>
    </ITFlex>
  );
}
