import { LottieLoader } from "@shared/ui/lottie-loader";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ITBadget, ITButton, ITCheckbox, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaFileSignature, FaInfoCircle, FaSave, FaTimesCircle, FaUndoAlt, FaUserTie } from "react-icons/fa";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { inventoryApi, type Condition, type Loan } from "@entities/inventory";
import { i18n } from "@shared/i18n";
import { useRequestKey } from "@shared/lib/useRequestKey";

/** Una pieza pendiente de devolver: se decide pieza por pieza. */
interface UnitRow {
  unitId: string;
  assetTag: string;
  serialNumber: string | null;
  selected: boolean;
  condition: Condition;
  notes: string;
}

interface Row {
  key: string;
  loanItemId: string;
  deviceName: string;
  loaned: number;
  returnedQuantity: number;
  pending: number;
  units: UnitRow[];
}

const needsNotes = (c: Condition) => c === "POOR" || c === "BROKEN";

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
  const requestKey = useRequestKey();
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

  // La lista de préstamos no trae las unidades: se lee el préstamo completo.
  const select = (id: string) => {
    setLoan(null);
    setRows([]);
    setErrors({});
    if (!id) return;
    inventoryApi
      .getLoan(id)
      .then((p) => {
        setLoan(p);
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
              units: (d.units ?? [])
                .filter((u) => !u.returned)
                .map((u) => ({
                  unitId: u.deviceUnit.id,
                  assetTag: u.deviceUnit.assetTag,
                  serialNumber: u.deviceUnit.serialNumber ?? null,
                  selected: true,
                  condition: "GOOD" as Condition,
                  notes: "",
                }))
                .sort((a, b) => a.assetTag.localeCompare(b.assetTag)),
            }))
        );
      })
      .catch((e: unknown) => setToast({ message: e instanceof Error ? e.message : String(e), type: "error" }));
  };

  useEffect(() => {
    if (loanIdParam) select(loanIdParam);
  }, [loanIdParam]);

  const updateUnit = (key: string, unitId: string, patch: Partial<UnitRow>) =>
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, units: r.units.map((u) => (u.unitId === unitId ? { ...u, ...patch } : u)) } : r))
    );

  const selectedUnits = rows.flatMap((r) => r.units.filter((u) => u.selected).map((u) => ({ row: r, unit: u })));
  const totalToReturn = selectedUnits.length;
  const pendingTotal = rows.reduce((sum, r) => sum + r.pending, 0);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    // observación requerida si MALO/ROTO, mínimo 3 caracteres
    for (const { unit } of selectedUnits) {
      if (needsNotes(unit.condition) && unit.notes.trim().length < 3) {
        e[`notes-${unit.unitId}`] = i18n.t("inventory:validation.notesMin", { min: 3 });
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = !!loan && totalToReturn > 0;

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({ message: i18n.t("inventory:validation.reviewNotes"), type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        loanId: loan!.id,
        // Un renglón por (detalle, condición, nota) con sus unidades exactas.
        items: Object.values(
          selectedUnits.reduce<Record<string, { loanItemId: string; unitIds: string[]; condition: Condition; notes?: string }>>(
            (acc, { row, unit }) => {
              const notes = needsNotes(unit.condition) ? unit.notes.trim() : "";
              const key = `${row.loanItemId}|${unit.condition}|${notes}`;
              acc[key] ??= { loanItemId: row.loanItemId, unitIds: [], condition: unit.condition, notes: notes || undefined };
              acc[key].unitIds.push(unit.unitId);
              return acc;
            },
            {}
          )
        ),
      };
      await inventoryApi.createLoanReturn(payload, requestKey(payload));
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
      <ITPage title={t("loanReturn.new")} backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <LottieLoader size="lg" />
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

                        <ITText className="text-[11px] text-slate-500">{t("loanReturn.unitsHint")}</ITText>

                        <ITFlex direction="column" gap={2}>
                          {r.units.map((u) => (
                            <ITFlex
                              key={u.unitId}
                              direction="column"
                              gap={2}
                              className={`rounded-lg border px-3 py-2 ${u.selected ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50 opacity-70"}`}
                            >
                              <ITFlex align="center" gap={3} wrap="wrap">
                                <ITCheckbox
                                  name={`return-${u.unitId}`}
                                  checked={u.selected}
                                  onChange={(checked) => updateUnit(r.key, u.unitId, { selected: checked })}
                                  label={<span className="sr-only">{t("loanReturn.returnUnit", { assetTag: u.assetTag })}</span>}
                                />
                                <ITFlex direction="column" className="min-w-0">
                                  <ITText className="text-[12px] font-bold text-slate-800">{u.assetTag}</ITText>
                                  <ITText className={`text-[11px] ${u.serialNumber ? "text-slate-600" : "italic text-slate-400"}`}>
                                    {u.serialNumber ? t("units.serial", { value: u.serialNumber }) : t("units.noSerial")}
                                  </ITText>
                                </ITFlex>
                                {u.selected && (
                                  <ITFlex gap={1.5} wrap="wrap" className="ml-auto">
                                    {CONDITIONS.map((c) => {
                                      const p = CONDITION_PRESETS[c];
                                      const isActive = u.condition === c;
                                      return (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => updateUnit(r.key, u.unitId, { condition: c })}
                                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
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
                                )}
                              </ITFlex>

                              {u.selected && u.condition === "BROKEN" && (
                                <ITText className="text-[11px] font-semibold text-red-600">{t("loanReturn.brokenRetirementHint")}</ITText>
                              )}
                              {u.selected && needsNotes(u.condition) && (
                                <div>
                                  <ITInput
                                    name={`notes-${u.unitId}`}
                                    label={t("new.comment")}
                                    placeholder={t("loanReturn.commentPlaceholder")}
                                    value={u.notes}
                                    onChange={(e) => updateUnit(r.key, u.unitId, { notes: e.target.value })}
                                    aria-invalid={!!errors[`notes-${u.unitId}`]}
                                  />
                                  {errors[`notes-${u.unitId}`] && (
                                    <span role="alert" className="text-red-500 text-xs mt-1 block">
                                      {errors[`notes-${u.unitId}`]}
                                    </span>
                                  )}
                                </div>
                              )}
                            </ITFlex>
                          ))}
                        </ITFlex>
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