import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaFileSignature, FaInfoCircle, FaSave, FaTimesCircle, FaUndoAlt, FaUserTie } from "react-icons/fa";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { inventoryApi, type Condition, type Loan } from "@entities/inventory";
import { i18n } from "@shared/i18n";

interface Row {
  key: string;
  loanItemId: string;
  deviceName: string;
  loaned: number;
  returnedQuantity: number;
  pending: number;
  quantity: string;
  condition: Condition;
  notes: string;
  active: string[];
}

// Presets de condición (estilo "Urgencia" del ticket).
const CONDITION_PRESETS: Record<string, { icon: ReactNode; ring: string; text: string; dot: string }> = {
  GOOD: { icon: <FaCheckCircle size={12} />, ring: "ring-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  FAIR: { icon: <FaInfoCircle size={12} />, ring: "ring-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  POOR: { icon: <FaTimesCircle size={12} />, ring: "ring-orange-300", text: "text-orange-700", dot: "bg-orange-500" },
  BROKEN: { icon: <FaTimesCircle size={12} />, ring: "ring-red-300", text: "text-red-700", dot: "bg-red-500" },
};

const CONDITIONS: Condition[] = ["GOOD", "FAIR", "POOR", "BROKEN"];

export default function NewLoanReturnPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loanIdParam = searchParams.get("loanId");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    inventoryApi
      .loans()
      .then((p) => setLoans(p.filter((x) => x.status === "ACTIVE" || x.status === "PARTIAL")))
      .finally(() => setLoading(false));
  }, []);

  const select = (id: string) => {
    const p = loans.find((x) => x.id === id);
    setLoan(p ?? null);
    if (p) {
      setRows(
        p.items
          .filter((d) => d.quantity - d.returnedQuantity > 0)
          .map((d) => ({
            key: d.id,
            loanItemId: d.id,
            deviceName: d.device?.name ?? "",
            loaned: d.quantity,
            returnedQuantity: d.returnedQuantity,
            pending: d.quantity - d.returnedQuantity,
            quantity: String(d.quantity - d.returnedQuantity),
            condition: "GOOD",
            notes: "",
            active: (d.units ?? [])
              .filter((u) => !u.returned)
              .map((u) => u.deviceUnit?.assetTag ?? "")
              .filter(Boolean),
          }))
      );
    }
  };

  useEffect(() => {
    if (loanIdParam && loans.length > 0) select(loanIdParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanIdParam, loans.length]);

  const updateRow = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const totalToReturn = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const pendingTotal = rows.reduce((sum, r) => sum + r.pending, 0);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    // observación requerida si MALO/ROTO, mínimo 3 caracteres
    rows.forEach((r, idx) => {
      if ((r.condition === "POOR" || r.condition === "BROKEN") && r.notes.trim().length < 3) {
        e[`notes-${idx}`] = i18n.t("inventory:validation.notesMin", { min: 3 });
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid =
    !!loan &&
    rows.length > 0 &&
    rows.every((r) => Number(r.quantity) >= 0 && Number(r.quantity) <= r.pending && !!r.condition) &&
    totalToReturn > 0;

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({ message: i18n.t("inventory:validation.reviewNotes"), type: "error" });
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.createLoanReturn({
        loanId: loan!.id,
        items: rows
          .filter((r) => Number(r.quantity) > 0)
          .map((r) => ({
            loanItemId: r.loanItemId,
            quantity: Number(r.quantity),
            condition: r.condition,
            notes: (r.condition === "POOR" || r.condition === "BROKEN") && r.notes.trim() ? r.notes : undefined,
          })),
      });
      setToast({ message: t("loanReturn.saved"), type: "success" });
      setTimeout(() => navigate("/inventory/loans"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("loanReturn.new")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("loanReturn.new")}
      description={t("loanReturn.description")}
      icon={<FaUndoAlt size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loanReturn.title"), onClick: () => navigate("/inventory/returns") }, { label: t("loanReturn.new") }]}
      backAction={() => navigate("/inventory/loans")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("loanReturn.save")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={8}>
          <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ITSearchSelect
              label={t("loanReturn.selectLoan")}
              placeholder={t("loanReturn.selectLoanPlaceholder")}
              options={loans.map((p) => ({ value: p.id, label: `${p.number} · ${p.custodian?.name ?? p.department?.name ?? ""}` }))}
              value={loan?.id ?? ""}
              onChange={(v) => select(String(v))}
            />

            {loan && rows.length > 0 && (
              <>
                <ITFlex direction="column" gap={3}>
                  {rows.map((r) => {
                    return (
                      <ITFlex
                        key={r.key}
                        direction="column"
                        gap={3}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                      >
                        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                          <ITFlex align="center" gap={2} className="min-w-0">
                            <ITText className="text-sm font-bold text-slate-800">{r.deviceName}</ITText>
                          </ITFlex>
                          <ITFlex gap={1.5} wrap="wrap">
                            <ITBadget color="gray" size="lg">{t("loanReturn.loaned")}: {r.loaned}</ITBadget>
                            <ITBadget color="success" size="lg">{t("loanReturn.returnedQuantity")}: {r.returnedQuantity}</ITBadget>
                            <ITBadget color="warning" size="lg">{t("loanReturn.pending")}: {r.pending}</ITBadget>
                          </ITFlex>
                        </ITFlex>

                        {r.active.length > 0 && (
                          <ITFlex gap={1} wrap="wrap">
                            {r.active.map((a) => (
                              <span key={a} className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {a}
                              </span>
                            ))}
                          </ITFlex>
                        )}

                        <ITGrid container columns={12} spacing={4}>
                          <ITGrid item xs={12} md={3}>
                            <ITInput
                              name={`return-${r.key}`}
                              label={t("loanReturn.returnLoan")}
                              type="number"
                              min={0}
                              max={r.pending}
                              value={r.quantity}
                              onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
                            />
                          </ITGrid>
                          <ITGrid item xs={12} md={9}>
                            <ITFlex as="fieldset" direction="column" gap={2}>
                              <ITText as="legend" className="text-sm font-semibold text-slate-700">
                                {t("loanReturn.condition")}
                              </ITText>
                              <ITFlex gap={2} wrap="wrap">
                                {CONDITIONS.map((c) => {
                                  const p = CONDITION_PRESETS[c];
                                  const isActive = r.condition === c;
                                  return (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => updateRow(r.key, { condition: c })}
                                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                                        isActive
                                          ? `border-transparent bg-slate-50 ring-2 ${p.ring} ${p.text}`
                                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      {p.icon}
                                      <span>{t(`loanReturn.conditionLabels.${c}`)}</span>
                                    </button>
                                  );
                                })}
                              </ITFlex>
                            </ITFlex>
                          </ITGrid>
                        </ITGrid>

                        {r.condition === "BROKEN" && (
                          <ITText className="text-[11px] font-semibold text-red-600">{t("loanReturn.brokenRetirementHint")}</ITText>
                        )}
                        {(r.condition === "POOR" || r.condition === "BROKEN") && (
                          <div>
                            <ITInput
                              name={`notes-${r.key}`}
                              label={t("new.comment")}
                              placeholder={t("loanReturn.commentPlaceholder")}
                              value={r.notes}
                              onChange={(e) => updateRow(r.key, { notes: e.target.value })}
                              aria-invalid={!!errors[`notes-${rows.indexOf(r)}`]}
                            />
                            {errors[`notes-${rows.indexOf(r)}`] && (
                              <span role="alert" className="text-red-500 text-xs mt-1 block">
                                {errors[`notes-${rows.indexOf(r)}`]}
                              </span>
                            )}
                          </div>
                        )}
                      </ITFlex>
                    );
                  })}
                </ITFlex>
              </>
            )}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={4}>
          <ITFlex direction="column" gap={4} className="lg:sticky lg:top-6">
            {loan && (
              <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <ITFlex align="center" gap={2}>
                  <FaFileSignature className="text-slate-400" size={14} />
                  <ITText className="text-sm font-semibold text-slate-800">{t("loanReturn.custodyLetterInfo")}</ITText>
                </ITFlex>

                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.colNumber")}</ITText>
                  <ITText className="text-sm font-bold text-slate-900">{loan.number}</ITText>
                </ITFlex>

                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.colDate")}</ITText>
                  <ITText className="text-sm text-slate-600">{formatDate(loan.date)}</ITText>
                </ITFlex>

                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("loans.assignment")}</ITText>
                  <ITFlex align="center" gap={2}>
                    <FaUserTie className="text-slate-400" size={12} />
                    <ITText className="text-sm font-semibold text-slate-700">
                      {loan.custodian?.name ?? (loan.department?.name || "—")}
                    </ITText>
                  </ITFlex>
                </ITFlex>

                <ITFlex
                  align="center"
                  justify="between"
                  gap={2}
                  className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3"
                >
                  <ITText className="text-xs text-slate-600">{t("loanReturn.pendingTotal")}</ITText>
                  <ITText className="text-lg font-black text-slate-800">{pendingTotal}</ITText>
                </ITFlex>

                <ITFlex
                  align="center"
                  justify="between"
                  gap={2}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                >
                  <ITText className="text-xs text-slate-600">{t("loanReturn.toReturn")}</ITText>
                  <ITText className="text-lg font-black text-emerald-700">{totalToReturn}</ITText>
                </ITFlex>
              </ITFlex>
            )}
          </ITFlex>
        </ITGrid>
      </ITGrid>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}