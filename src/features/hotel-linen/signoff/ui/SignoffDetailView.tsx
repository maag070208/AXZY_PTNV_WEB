import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITChip, ITDataTable, ITFlex, ITGrid, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBalanceScale, FaBoxes, FaCheck, FaExclamationTriangle, FaTruck } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { signoffApi, type SignoffResult, type TransferSignoffDetail } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import SignoffStatusChip from "./SignoffStatusChip";
import { useSuccessToast } from "@app/toast/useSuccessToast";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

type SignoffLine = TransferSignoffDetail["lines"][number];

/** Renglones del traspaso: enviado, contado y diferencia. */
function LinesTable({ lines }: { lines: SignoffLine[] }) {
  const { t } = useTranslation("hotel-linen-signoff");
  const fetchData = useMemo(
    () =>
      makeClientTableFetch<SignoffLine>(async () => lines, {
        name: { value: (l) => `${l.product.code} ${l.product.name} ${l.product.size ?? ""}`, sortValue: (l) => l.product.code },
      }),
    [lines]
  );
  const columns: Column<SignoffLine>[] = [
    {
      key: "name",
      label: t("detail.lines"),
      type: "string",
      width: 280,
      filter: true,
      render: (l) => (
        <ITFlex direction="column">
          <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
          <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size, l.lot?.code].filter(Boolean).join(" · ")}</ITText>
        </ITFlex>
      ),
    },
    { key: "quantity", label: t("detail.sent"), type: "number", width: 110, render: (l) => <ITText className="text-[12px] tabular-nums">{fmt(l.quantity)}</ITText> },
    {
      key: "receivedQuantity",
      label: t("detail.counted"),
      type: "number",
      width: 110,
      render: (l) => <ITText className="text-[12px] tabular-nums">{l.receivedQuantity === null ? "—" : fmt(l.receivedQuantity)}</ITText>,
    },
    {
      key: "difference",
      label: t("detail.difference"),
      type: "number",
      width: 110,
      render: (l) =>
        l.difference ? <ITChip size="sm" color="warning" label={fmt(l.difference)} /> : <ITText className="text-[12px]">{l.difference === null ? "—" : "0"}</ITText>,
    },
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

interface Props {
  id: string;
}

/** Detalle de la conformidad: contado por línea y botones Conforme / Con diferencia (nota obligatoria). */
export default function SignoffDetailView({ id }: Props) {
  const { t } = useTranslation("hotel-linen-signoff");
  const notify = useSuccessToast();
  const canSign = useCan("hotel_linen.transfer_signoff");
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const [detail, setDetail] = useState<TransferSignoffDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [asDifference, setAsDifference] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(() => {
    signoffApi
      .detail(id)
      .then((d) => {
        setDetail(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  if (!detail) return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{t("loading")}</ITText>;

  const pending = detail.signoffStatus === "PENDING";
  const isCounter = !!userId && detail.receivedBy?.id === userId;
  const noteMissing = asDifference && notes.trim() === "";

  const submit = async (result: SignoffResult) => {
    setBusy(true);
    setError(null);
    try {
      await signoffApi.sign(id, { result, notes: notes.trim() || null });
      notify(t("toast.signed"));
      setAsDifference(false);
      setNotes("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={6} md={4}>
          <KpiTile label={t("detail.sent")} value={fmt(detail.lines.reduce((n, l) => n + l.quantity, 0))} icon={<FaTruck size={14} />} tone="sky" />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <KpiTile label={t("detail.counted")} value={fmt(detail.lines.reduce((n, l) => n + (l.receivedQuantity ?? 0), 0))} icon={<FaBoxes size={14} />} tone="emerald" />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <KpiTile
            label={t("detail.difference")}
            value={fmt(detail.lines.reduce((n, l) => n + (l.difference ?? 0), 0))}
            icon={<FaBalanceScale size={14} />}
            tone={detail.lines.some((l) => l.difference) ? "amber" : "neutral"}
          />
        </ITGrid>
      </ITGrid>
      <PanelCard
        title={detail.folio}
        description={`${detail.from?.name ?? "—"} → ${detail.to?.name ?? "—"}`}
        actions={detail.signoffStatus ? <SignoffStatusChip status={detail.signoffStatus} /> : undefined}
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.receivedBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.receivedBy && <ProfileAvatar name={detail.receivedBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.receivedBy?.name ?? "—"}</ITText>
            </ITFlex>
            {detail.receivedAt && <ITText muted className="text-[11px]">{fmtDateTime(detail.receivedAt)}</ITText>}
          </ITGrid>
          {detail.signoffBy && (
            <ITGrid item xs={12} md={4}>
              <ITText muted className="text-[11px]">{t("detail.signoffBy")}</ITText>
              <ITFlex align="center" gap={2}>
                <ProfileAvatar name={detail.signoffBy.name} size="sm" />
                <ITText className="text-[12px] font-semibold">{detail.signoffBy.name}</ITText>
              </ITFlex>
              {detail.signoffAt && <ITText muted className="text-[11px]">{fmtDateTime(detail.signoffAt)}</ITText>}
            </ITGrid>
          )}
          {detail.signoffNotes && (
            <ITGrid item xs={12} md={4}>
              <ITText muted className="text-[11px]">{t("detail.notes")}</ITText>
              <ITText className="text-[12px]">{detail.signoffNotes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("detail.lines")}>
        <LinesTable lines={detail.lines} />
      </PanelCard>
      {detail.signoffStatus === null && <ITAlert variant="info">{t("detail.notApplicable")}</ITAlert>}

      {pending && canSign && (
        <PanelCard title={t("detail.action")} description={t("detail.noStockBlock")} actions={isCounter ? undefined : (
              <ITFlex gap={2}>
                {asDifference ? (
                  <>
                    <ITButton variant="outlined" color="secondary" label={t("cancel")} disabled={busy} onClick={() => setAsDifference(false)} />
                    <ITButton
                      variant="filled"
                      color="danger"
                      icon={<FaExclamationTriangle size={12} />}
                      label={t("detail.confirmDifference")}
                      disabled={busy || noteMissing}
                      onClick={() => void submit("DIFFERENCE")}
                    />
                  </>
                ) : (
                  <>
                    <ITButton
                      variant="outlined"
                      color="danger"
                      icon={<FaExclamationTriangle size={12} />}
                      label={t("detail.withDifference")}
                      disabled={busy}
                      onClick={() => setAsDifference(true)}
                    />
                    <ITButton
                      variant="filled"
                      color="primary"
                      icon={<FaCheck size={12} />}
                      label={t("detail.conform")}
                      disabled={busy}
                      onClick={() => void submit("CONFORM")}
                    />
                  </>
                )}
              </ITFlex>
        )}>
          {isCounter ? (
            <ITAlert variant="warning">{t("detail.sameUser")}</ITAlert>
          ) : (
            <ITFlex direction="column" gap={3}>
              {asDifference && (
                <ITTextarea
                  name="signoffNotes"
                  label={t("detail.notesLabel")}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e)}
                  error={noteMissing ? t("detail.notesRequired") : undefined}
                />
              )}
            </ITFlex>
          )}
        </PanelCard>
      )}
    </ITFlex>
  );
}
