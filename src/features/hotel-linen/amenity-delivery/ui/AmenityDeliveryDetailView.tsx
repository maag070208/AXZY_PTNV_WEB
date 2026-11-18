import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITChip, ITDataTable, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { amenityDeliveryApi, type AmenityDeliveryDetail } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import AmenityDeliveryStatusChip from "./AmenityDeliveryStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

interface Props {
  id: string;
  /** Abre el traspaso (donde la destinataria recibe y firma). */
  onOpenTransfer: (id: string) => void;
}

/** Detalle de una entrega: destinataria, renglones enviados/recibidos y acceso a la recepción. */
export default function AmenityDeliveryDetailView({ id, onOpenTransfer }: Props) {
  const { t } = useTranslation("hotel-linen-amenity-delivery");
  const [detail, setDetail] = useState<AmenityDeliveryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    amenityDeliveryApi
      .get(id)
      .then((d) => active && setDetail(d))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  const lines = detail?.lines;
  type Line = AmenityDeliveryDetail["lines"][number];
  const linesFetch = useMemo(() => makeClientTableFetch<Line>(() => Promise.resolve(lines ?? [])), [lines]);
  const lineColumns: Column<Line>[] = useMemo(
    () => [
      {
        key: "product.name",
        label: t("new.item"),
        type: "string",
        width: 260,
        filter: true,
        render: (l) => (
          <ITFlex direction="column">
            <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
            <ITText muted className="font-mono text-[11px]">{l.product.code}</ITText>
          </ITFlex>
        ),
      },
      { key: "quantity", label: t("detail.sent"), type: "number", width: 110, render: (l) => <ITText className="text-[12px] tabular-nums">{fmt(l.quantity)}</ITText> },
      {
        key: "receivedQuantity",
        label: t("detail.received"),
        type: "number",
        width: 150,
        render: (l) =>
          l.difference ? (
            <ITChip size="sm" color="warning" label={`${fmt(l.receivedQuantity ?? 0)} (−${fmt(l.difference)})`} />
          ) : (
            <ITText className="text-[12px] tabular-nums">{l.receivedQuantity === null ? "—" : fmt(l.receivedQuantity)}</ITText>
          ),
      },
    ],
    [t]
  );

  if (!detail) return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{t("loading")}</ITText>;

  return (
    <ITFlex direction="column" gap={4}>
      <PanelCard
        title={detail.folio}
        description={`${detail.from?.name ?? "—"} → ${detail.to?.name ?? "—"}`}
        actions={
          <ITFlex align="center" gap={2}>
            <AmenityDeliveryStatusChip status={detail.status} />
            <ITButton variant="outlined" color="primary" label={t("detail.openTransfer")} onClick={() => onOpenTransfer(detail.id)} />
          </ITFlex>
        }
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.recipient")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.recipient && <ProfileAvatar name={detail.recipient.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.recipient?.name ?? "—"}</ITText>
            </ITFlex>
            <ITText muted className="text-[11px]">{t("detail.recipientHint")}</ITText>
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.sentBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.sentBy && <ProfileAvatar name={detail.sentBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.sentBy?.name ?? "—"}</ITText>
            </ITFlex>
            <ITText muted className="text-[11px]">{new Date(detail.date).toLocaleString("es-MX")}</ITText>
          </ITGrid>
          {detail.notes && (
            <ITGrid item xs={12} md={4}>
              <ITText muted className="text-[11px]">{t("detail.notes")}</ITText>
              <ITText className="text-[12px]">{detail.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("detail.lines")}>
        <ITDataTable
          showViewToggle={false}
          columns={lineColumns as unknown as Column<Record<string, unknown>>[]}
          fetchData={linesFetch as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
      </PanelCard>
    </ITFlex>
  );
}
