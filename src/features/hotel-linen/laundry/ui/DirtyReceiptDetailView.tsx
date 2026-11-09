import { useEffect, useState } from "react";
import { ITAlert, ITChip, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { laundryApi, type DirtyReceiptDetail } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { fmt, fmtDate, fmtDateTime } from "../lib";

/** Detalle de una recepción de sucios: encabezado, renglones con faltante y firmas. */
export default function DirtyReceiptDetailView({ id }: { id: string }) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const [detail, setDetail] = useState<DirtyReceiptDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    laundryApi
      .dirtyReceipt(id)
      .then((d) => active && setDetail(d))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  if (!detail) {
    return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{t("common.loading")}</ITText>;
  }

  const headers = ["delivered", "receivedDirty", "stillInUse", "shortage", "good", "stained", "damaged"] as const;
  const cell = "text-[12px] tabular-nums text-right";
  const person = (p: { name: string } | null) => (
    <ITFlex align="center" gap={2}>
      {p && <ProfileAvatar name={p.name} size="sm" />}
      <ITText className="text-[12px] font-semibold">{p?.name ?? "—"}</ITText>
    </ITFlex>
  );

  return (
    <ITFlex direction="column" gap={4}>
      <PanelCard
        title={detail.folio}
        description={`${detail.origin.name} → ${t("dirty.laundry")}`}
        actions={detail.hasShortage ? <ITChip size="sm" color="danger" label={t("dirty.withShortage")} /> : undefined}
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("dirty.columns.date")}</ITText>
            <ITText className="text-[12px]">{fmtDate(detail.date)}{detail.shift ? ` · ${tt(`shift.${detail.shift}`)}` : ""}</ITText>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("dirty.columns.cart")}</ITText>
            <ITText className="text-[12px]">{detail.cartNumber ?? "—"}</ITText>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("dirty.columns.deliveredBy")}</ITText>
            {person(detail.deliveredBy)}
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("dirty.columns.receivedBy")}</ITText>
            {person(detail.receivedBy)}
          </ITGrid>
          {detail.notes && (
            <ITGrid item xs={12}>
              <ITText muted className="text-[11px]">{t("form.notes")}</ITText>
              <ITText className="text-[12px]">{detail.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("dirty.detail.lines")}>
        <ITFlex direction="column" gap={2}>
          <ITGrid container columns={18} spacing={2}>
            <ITGrid item xs={4}><ITText muted className="text-[11px]">{t("detail.item")}</ITText></ITGrid>
            {headers.map((h) => (
              <ITGrid key={h} item xs={2}><ITText muted className="text-right text-[11px]">{t(`dirty.detail.${h}`)}</ITText></ITGrid>
            ))}
          </ITGrid>
          {detail.lines.map((l) => (
            <ITGrid key={l.id} container columns={18} spacing={2} className="items-center">
              <ITGrid item xs={4}>
                <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
              </ITGrid>
              {headers.map((h) => (
                <ITGrid key={h} item xs={2}>
                  <ITText className={`${cell} ${h === "shortage" && l.shortage > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>
                    {fmt(h === "delivered" ? l.deliveredToFloor : l[h])}
                  </ITText>
                </ITGrid>
              ))}
            </ITGrid>
          ))}
        </ITFlex>
      </PanelCard>

      <PanelCard title={t("detail.signatures")}>
        <ITFlex direction="column" gap={2}>
          {detail.signatures.map((s) => (
            <ITFlex key={`${s.role}-${s.signedAt}`} align="center" gap={2}>
              <ProfileAvatar name={s.user.name} size="sm" />
              <ITText className="text-[12px] font-semibold">{s.user.name}</ITText>
              <ITChip size="sm" label={tt(`role.${s.role}`, { defaultValue: s.role })} />
              <ITText muted className="text-[11px]">{fmtDateTime(s.signedAt)}</ITText>
            </ITFlex>
          ))}
        </ITFlex>
      </PanelCard>
    </ITFlex>
  );
}
