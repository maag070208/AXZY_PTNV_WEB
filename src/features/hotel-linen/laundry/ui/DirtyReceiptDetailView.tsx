import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITChip, ITDataTable, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBoxes, FaExclamationTriangle, FaTshirt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { laundryApi, type DirtyReceiptDetail } from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { fmt, fmtDate, fmtDateTime } from "../lib";

type ReceiptLine = DirtyReceiptDetail["lines"][number];
const HEADERS = ["delivered", "receivedDirty", "stillInUse", "shortage", "good", "stained", "damaged"] as const;

/** Renglones de la recepción en tabla, con el faltante resaltado. */
function LinesTable({ lines }: { lines: ReceiptLine[] }) {
  const { t } = useTranslation("hotel-linen-laundry");
  const fetchData = useMemo(
    () =>
      makeClientTableFetch<ReceiptLine>(async () => lines, {
        name: { value: (l) => `${l.product.code} ${l.product.name} ${l.product.size ?? ""}`, sortValue: (l) => l.product.code },
        delivered: { sortValue: (l) => l.deliveredToFloor },
      }),
    [lines]
  );
  const columns: Column<ReceiptLine>[] = [
    {
      key: "name",
      label: t("detail.item"),
      type: "string",
      width: 240,
      filter: true,
      render: (l) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
        </ITFlex>
      ),
    },
    ...HEADERS.map((h) => ({
      key: h,
      label: t(`dirty.detail.${h}`),
      type: "number" as const,
      width: 110,
      render: (l: ReceiptLine) => (
        <ITText className={`text-[12px] tabular-nums ${h === "shortage" && l.shortage > 0 ? "font-bold text-[var(--color-danger)]" : ""}`}>
          {fmt(h === "delivered" ? l.deliveredToFloor : l[h])}
        </ITText>
      ),
    })),
  ];
  return (
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
  );
}

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

  const sum = (k: "receivedDirty" | "stillInUse" | "shortage") => detail.lines.reduce((x, l) => x + l[k], 0);
  const person = (p: { name: string } | null) => (
    <ITFlex align="center" gap={2}>
      {p && <ProfileAvatar name={p.name} size="sm" />}
      <ITText className="text-[12px] font-semibold">{p?.name ?? "—"}</ITText>
    </ITFlex>
  );

  return (
    <ITFlex direction="column" gap={4}>
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={6} md={4}>
          <KpiTile label={t("dirty.detail.receivedDirty")} value={fmt(sum("receivedDirty"))} icon={<FaTshirt size={14} />} tone={sum("receivedDirty") > 0 ? "sky" : "neutral"} />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <KpiTile label={t("dirty.detail.stillInUse")} value={fmt(sum("stillInUse"))} icon={<FaBoxes size={14} />} tone={sum("stillInUse") > 0 ? "amber" : "neutral"} />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <KpiTile label={t("dirty.detail.shortage")} value={fmt(sum("shortage"))} icon={<FaExclamationTriangle size={14} />} tone={sum("shortage") > 0 ? "rose" : "neutral"} hint={sum("shortage") === 0 ? t("dirty.form.allGood") : undefined} />
        </ITGrid>
      </ITGrid>
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
        <LinesTable lines={detail.lines} />
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
