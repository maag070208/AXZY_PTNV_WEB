import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ITBentoGrid,
  ITBentoSegments,
  ITBentoTile,
  ITButton,
  ITChip,
  ITFlex,
  ITPage,
  ITText,
  useITBentoCountUp,
} from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { PanelCard } from "@shared/ui/panel-card";
import { InsightNote } from "@shared/ui/bento-bits";
import { LiveSummaryRow } from "@shared/ui/live-summary";
import { LangostinState } from "@shared/ui/langostin";
import { FaEdit, FaFilePdf, FaFileSignature, FaUndoAlt } from "react-icons/fa";
import {
  LuBuilding2,
  LuClipboardList,
  LuFileText,
  LuHistory,
  LuMessageSquareText,
  LuPackageCheck,
  LuPackageOpen,
  LuHourglass,
  LuUndo2,
} from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { formatDate, formatTimeInTZ } from "@shared/utils/dates";
import { inventoryApi, type Condition, type Loan, type LoanReturn } from "@entities/inventory";
import { CustodyLetterPreview, downloadCustodyLetterPdf } from "@widgets/custody-letter";
import { i18n } from "@shared/i18n";
import { useGoBack } from "@shared/lib/useGoBack";

const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  ACTIVE: "success",
  PARTIAL: "warning",
  RETURNED: "gray",
  CANCELLED: "danger",
};

const CONDITION_COLOR: Record<Condition, "success" | "info" | "warning" | "danger"> = {
  GOOD: "success",
  FAIR: "info",
  POOR: "warning",
  BROKEN: "danger",
};

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Número grande de un mosaico: sube de 0 al valor al montar. */
function Count({ value }: { value: number }) {
  const shown = useITBentoCountUp(value, 1200, 0);
  return <>{Math.round(shown).toLocaleString("es-MX")}</>;
}

/** Historial de devoluciones (kardex del préstamo) agrupado por día, de lo más reciente a lo más antiguo. */
function ReturnsFeed({ returns }: { returns: LoanReturn[] }) {
  const { t } = useTranslation("inventory");
  const sorted = [...returns].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const todayKey = dayKey(new Date().toISOString());
  const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000).toISOString());
  const groups: { key: string; label: string; items: LoanReturn[] }[] = [];
  for (const dv of sorted) {
    const key = dayKey(dv.date);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const label = key === todayKey ? t("ui.today") : key === yesterdayKey ? t("ui.yesterday") : formatDate(dv.date);
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(dv);
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.key} className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-semibold text-slate-500">{g.label}</p>
          {g.items.map((dv) => (
            <div key={dv.id} className="flex gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
              >
                <LuUndo2 size={15} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <ITChip size="sm" color="info">{dv.number}</ITChip>
                  <span className="text-[12px] text-slate-500">{formatTimeInTZ(dv.date)}</span>
                  {dv.custodian?.name && (
                    <span className="text-[12px] text-slate-400">{i18n.t("common:labels.byName", { name: dv.custodian.name })}</span>
                  )}
                </div>
                {dv.items.map((dd) => (
                  <div key={dd.id} className="flex flex-col gap-1.5 rounded-[14px] bg-[color-mix(in_srgb,currentColor_5%,transparent)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-[12.5px] font-semibold text-slate-700">
                        {dd.device?.name ?? t("loans.title")} <span className="font-normal text-slate-400">×{dd.quantity}</span>
                      </p>
                      <ITChip size="sm" color={CONDITION_COLOR[dd.condition]}>
                        {t(`loanReturn.conditionLabels.${dd.condition}`)}
                      </ITChip>
                    </div>
                    {dd.units && dd.units.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dd.units.map((u) => (
                          <ITChip key={u.id} size="sm" color="gray">
                            {u.deviceUnit.assetTag}
                            {u.deviceUnit.serialNumber ? ` · ${u.deviceUnit.serialNumber}` : ""}
                          </ITChip>
                        ))}
                      </div>
                    )}
                    {dd.notes && (
                      <p className="m-0 flex items-center gap-1.5 text-[12px] italic text-slate-500">
                        <LuMessageSquareText size={12} className="shrink-0" />“{dd.notes}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    inventoryApi
      .getLoan(id)
      .then(setLoan)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (failed && !loan) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("loans.detail")} backAction={() => goBack("/inventory/loans")}>
        <LangostinState kind="error" description={t("common:errors.load")} />
      </ITPage>
    );
  }

  if (loading || !loan) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("loans.detail")} backAction={() => goBack("/inventory/loans")}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  const isOpen = loan.status === "ACTIVE" || loan.status === "PARTIAL";
  const loaned = loan.items.reduce((acc, d) => acc + d.quantity, 0);
  const returned = loan.items.reduce((acc, d) => acc + d.returnedQuantity, 0);
  const pending = Math.max(0, loaned - returned);
  const assignedName = loan.custodian?.name ?? (loan.department ? `${loan.department.name}${loan.subarea ? ` — ${loan.subarea.name}` : ""}` : "—");

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={loan.number}
      description={`${loan.custodian?.name ?? "—"} · ${formatDate(loan.date)}`}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title"), onClick: () => navigate("/inventory/loans") }, { label: loan?.number ?? "" }]}
      backAction={() => goBack("/inventory/loans")}
      actions={
        <ITFlex gap={2}>
          {isOpen && (
            <ITButton variant="outlined" color="primary" onClick={() => navigate(`/inventory/loans/${loan.id}/edit`)}>
              <ITFlex align="center" gap={1}>
                <FaEdit size={12} />
                <ITText className="font-bold text-[11px]">{t("loans.edit")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton variant="outlined" color="secondary" onClick={() => downloadCustodyLetterPdf(loan)}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{t("loans.custodyLetterPdf")}</ITText>
            </ITFlex>
          </ITButton>
          {isOpen && (
            <ITButton variant="filled" color="primary" onClick={() => navigate(`/inventory/returns/new?loanId=${loan.id}`)}>
              <ITFlex align="center" gap={1}>
                <FaUndoAlt size={12} />
                <ITText className="font-bold text-[11px]">{t("loanReturn.new")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <ITBentoGrid>
        {/* Héroe: la persona (o el departamento) a quien se prestó */}
        <ITBentoTile
          tone="sea"
          cols={6}
          rows={2}
          wide
          icon={<LuFileText size={15} />}
          label={loan.number}
        >
          <div className="relative z-[1] flex min-h-0 flex-1 items-center gap-3">
            {loan.custodian ? (
              <ProfileAvatar name={loan.custodian.name} size="xl" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,currentColor_12%,transparent)]">
                <LuBuilding2 size={26} />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="m-0 text-[22px] font-bold leading-tight">{assignedName}</p>
              <p className="m-0 text-[12px] opacity-70">
                {formatDate(loan.date)}
                {loan.custodian?.employeeNumber ? ` · ${t("loans.employeeNo", { n: loan.custodian.employeeNumber })}` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <ITChip size="sm" color={STATUS_COLOR[loan.status]}>{t(`loanStatus.${loan.status}`)}</ITChip>
                <ITChip size="sm" color={loan.custodian ? "success" : "info"}>
                  {loan.custodian ? t("loans.toEmployee") : t("loans.toDepartment")}
                </ITChip>
              </div>
            </div>
          </div>
        </ITBentoTile>

        <ITBentoTile
          cols={2}
          rows={2}
          icon={<LuPackageOpen size={15} />}
          label={t("loanReturn.loaned")}
          value={<Count value={loaned} />}
          caption={t("loans.pieces", { count: loaned })}
        />
        <ITBentoTile
          tone="mint"
          cols={2}
          rows={2}
          icon={<LuPackageCheck size={15} />}
          label={t("loanReturn.returnedQuantity")}
          value={<Count value={returned} />}
          caption={t("loans.pieces", { count: returned })}
        />
        <ITBentoTile
          tone="sun"
          cols={2}
          rows={2}
          icon={<LuHourglass size={15} />}
          label={t("loanReturn.pending")}
          value={<Count value={pending} />}
          caption={t("loans.pieces", { count: pending })}
        />
        {loaned > 0 && loaned <= 40 && (
          <ITBentoTile cols={12} rows={1} wide label={t("loans.progress", { returned, loaned })}>
            <ITBentoSegments total={loaned} done={returned} />
          </ITBentoTile>
        )}
      </ITBentoGrid>

      <div className="grid gap-2.5 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-2.5 lg:col-span-5">
          <PanelCard title={t("loans.detailData")} icon={<LuClipboardList size={16} />}>
            <div className="flex flex-col gap-2.5">
              <LiveSummaryRow label={t("loans.colNumber")} value={loan.number} />
              <LiveSummaryRow label={t("loans.colDate")} value={formatDate(loan.date)} />
              <LiveSummaryRow label={t("loans.assignment")} value={assignedName} />
              {loan.notes && <InsightNote icon={<LuMessageSquareText size={13} />}>{loan.notes}</InsightNote>}
            </div>
          </PanelCard>

          {/* Seguimiento del préstamo */}
          <PanelCard title={t("loans.items")} icon={<LuPackageOpen size={16} />}>
            <div className="flex flex-col gap-1">
              {loan.items.map((d) => {
                const left = d.quantity - d.returnedQuantity;
                return (
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-[14px] px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-[12.5px] font-semibold text-slate-700">
                        {d.device?.name} <span className="font-normal text-slate-400">({d.device?.brand} {d.device?.model})</span>
                      </p>
                      <p className="m-0 text-[11.5px] text-slate-400">
                        {t("loanReturn.loaned")}: {d.quantity} · {t("loanReturn.returnedQuantity")}: {d.returnedQuantity} · {t("loanReturn.pending")}: {left}
                      </p>
                    </div>
                    <ITChip size="sm" color={left > 0 ? "warning" : "success"}>
                      {left > 0 ? t("loanReturn.partial") : t("loanReturn.complete")}
                    </ITChip>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          {/* Historial de devoluciones (kardex) */}
          <PanelCard title={t("loans.loanReturnHistory")} icon={<LuHistory size={16} />} description={t("loans.loanReturnHistoryHint")}>
            {!loan.returns || loan.returns.length === 0 ? (
              <LangostinState kind="empty" size="sm" title={t("loans.withoutReturns")} description={t("loans.withoutReturnsHint")} />
            ) : (
              <ReturnsFeed returns={loan.returns} />
            )}
          </PanelCard>
        </div>

        <div className="min-w-0 lg:col-span-7">
          <PanelCard title={t("loans.preview")} icon={<LuFileText size={16} />}>
            <CustodyLetterPreview loan={loan} />
          </PanelCard>
        </div>
      </div>
    </ITPage>
  );
}
