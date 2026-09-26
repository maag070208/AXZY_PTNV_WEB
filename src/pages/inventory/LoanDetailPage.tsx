import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaCommentDots, FaEdit, FaFilePdf, FaFileSignature, FaUndoAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDate, formatDateTime } from "@shared/utils/dates";
import { inventoryApi, type Condition, type Loan } from "@entities/inventory";
import { CustodyLetterPreview, downloadCustodyLetterPdf } from "@widgets/custody-letter";

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

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    inventoryApi.getLoan(id).then(setLoan).finally(() => setLoading(false));
  }, [id]);

  if (loading || !loan) {
    return (
      <ITPage title={t("loans.detail")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={loan.number}
      description={`${loan.custodian?.name ?? "—"} · ${formatDate(loan.date)}`}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title"), onClick: () => navigate("/inventory/loans") }, { label: loan?.number ?? "" }]}
      backAction={() => navigate("/inventory/loans")}
      actions={
        <ITFlex gap={2}>
          {(loan.status === "ACTIVE" || loan.status === "PARTIAL") && (
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
          {(loan.status === "ACTIVE" || loan.status === "PARTIAL") && (
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
      <ITBadget color={STATUS_COLOR[loan.status]} size="lg">{loan.status}</ITBadget>

      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={5}>
          <ITFlex direction="column" gap={4}>
            {/* Formulario en modo lectura */}
            <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ITText className="text-sm font-bold text-slate-800">{t("loans.detailData")}</ITText>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.colNumber")}</ITText>
                <ITText className="text-sm font-bold text-slate-900">{loan.number}</ITText>
              </ITFlex>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.colDate")}</ITText>
                <ITText className="text-sm text-slate-700">{formatDate(loan.date)}</ITText>
              </ITFlex>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.assignment")}</ITText>
                {loan.custodian ? (
                  <ITFlex align="center" gap={2}>
                    <ITBadget color="success" size="lg">{t("loans.toEmployee")}</ITBadget>
                    <ITText className="text-sm font-semibold text-slate-700">{loan.custodian.name}</ITText>
                  </ITFlex>
                ) : loan.department ? (
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <ITBadget color="info" size="lg">{t("loans.toDepartment")}</ITBadget>
                    <ITText className="text-sm font-semibold text-slate-700">
                      {loan.department.name}{loan.subarea ? ` — ${loan.subarea.name}` : ""}
                    </ITText>
                  </ITFlex>
                ) : (
                  <ITText className="text-sm text-slate-400">—</ITText>
                )}
                {loan.custodian?.employeeNumber && (
                  <ITText className="text-[10px] text-slate-400">{t("loans.employeeNo", { n: loan.custodian.employeeNumber })}</ITText>
                )}
              </ITFlex>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.resource")}</ITText>
                {loan.items.map((d) => (
                  <ITText key={d.id} className="text-sm text-slate-700">
                    {d.device?.name} ({d.device?.brand} {d.device?.model}) —{" "}
                    <b>{t("loans.quantity", { n: d.quantity })}</b>
                  </ITText>
                ))}
              </ITFlex>

              {loan.notes && (
                <ITFlex direction="column" gap={0.5}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.notes")}</ITText>
                  <ITText className="text-sm text-slate-600">{loan.notes}</ITText>
                </ITFlex>
              )}
            </ITFlex>

            {/* Seguimiento del préstamo */}
            <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ITText className="text-sm font-bold text-slate-800">{t("loans.items")}</ITText>
              {loan.items.map((d) => {
                const pending = d.quantity - d.returnedQuantity;
                return (
                  <ITFlex key={d.id} align="center" justify="between" gap={2} className="border-b border-slate-100 py-2 last:border-0">
                    <ITFlex direction="column" gap={0.5} className="min-w-0">
                      <ITText className="text-[12px] font-bold text-slate-700">{d.device?.name}</ITText>
                      <ITText className="text-[10px] text-slate-400">
                        {t("loanReturn.loaned")}: {d.quantity} · {t("loanReturn.returnedQuantity")}: {d.returnedQuantity} · {t("loanReturn.pending")}: {pending}
                      </ITText>
                    </ITFlex>
                    <ITBadget color={pending > 0 ? "warning" : "success"} size="lg">
                      {pending > 0 ? t("loanReturn.partial") : t("loanReturn.complete")}
                    </ITBadget>
                  </ITFlex>
                );
              })}
            </ITFlex>

            {/* Historial de devoluciones (kardex) */}
            <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-sm font-bold text-slate-800">{t("loans.loanReturnHistory")}</ITText>
                <ITText className="text-[10px] text-slate-400">{t("loans.loanReturnHistoryHint")}</ITText>
              </ITFlex>
              {!loan.returns || loan.returns.length === 0 ? (
                <ITText className="text-[11px] text-slate-400">{t("loans.withoutReturns")}</ITText>
              ) : (
                <div className="relative pl-5 before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-100">
                  {[...loan.returns]
                    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
                    .map((dv) => (
                      <ITFlex key={dv.id} direction="column" gap={2} className="relative pb-4 last:pb-0">
                        <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                        <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                          <ITFlex align="center" gap={2} className="min-w-0">
                            <ITText className="text-[12px] font-black text-slate-700">{formatDateTime(dv.date)}</ITText>
                            <ITBadget color="info" size="lg">{dv.number}</ITBadget>
                          </ITFlex>
                          {dv.custodian?.name && (
                            <ITText className="text-[10px] text-slate-400">por {dv.custodian.name}</ITText>
                          )}
                        </ITFlex>
                        {dv.items.map((dd) => (
                          <ITFlex key={dd.id} direction="column" gap={1} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                            <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                              <ITText className="text-[11px] font-bold text-slate-700">
                                {dd.device?.name ?? t("loans.title")} <span className="text-slate-400">×{dd.quantity}</span>
                              </ITText>
                              <ITBadget color={CONDITION_COLOR[dd.condition]} size="lg">
                                {t(`loanReturn.conditionLabels.${dd.condition}`)}
                              </ITBadget>
                            </ITFlex>
                            {dd.units && dd.units.length > 0 && (
                              <ITFlex gap={1} wrap="wrap">
                                {dd.units.map((u) => (
                                  <span key={u.id} className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {u.deviceUnit.assetTag}
                                  </span>
                                ))}
                              </ITFlex>
                            )}
                            {dd.notes && (
                              <ITFlex align="center" gap={1}>
                                <FaCommentDots className="text-slate-400" size={11} />
                                <ITText className="text-[10px] italic text-slate-500">“{dd.notes}”</ITText>
                              </ITFlex>
                            )}
                          </ITFlex>
                        ))}
                      </ITFlex>
                    ))}
                </div>
              )}
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={7}>
          <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{t("loans.preview")}</ITText>
            <CustodyLetterPreview loan={loan} />
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}