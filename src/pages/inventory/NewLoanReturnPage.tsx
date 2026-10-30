import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ITButton,
  ITCheckbox,
  ITChip,
  ITFlex,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITToast, ITText } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaInfoCircle, FaTimesCircle, FaUndoAlt } from "react-icons/fa";
import { LuClipboardList, LuPackageCheck } from "react-icons/lu";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { inventoryApi, type Condition, type Loan } from "@entities/inventory";
import { i18n } from "@shared/i18n";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { useGoBack } from "@shared/lib/useGoBack";
import { FormSection } from "@shared/ui/form-section";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";
import { StickyActions } from "@shared/ui/sticky-actions";
import { LangostinGuide, LangostinState, type LangostinGuideStatus } from "@shared/ui/langostin";
import { ProfileAvatar } from "@shared/ui/profile-avatar";

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

// Presets de condición: ícono y tono pastel (tokens `--color-<tono>-soft`).
const CONDITION_PRESETS: Record<Condition, { icon: ReactNode; tone: "success" | "info" | "warning" | "danger" }> = {
  GOOD: { icon: <FaCheckCircle size={12} />, tone: "success" },
  FAIR: { icon: <FaInfoCircle size={12} />, tone: "info" },
  POOR: { icon: <FaTimesCircle size={12} />, tone: "warning" },
  BROKEN: { icon: <FaTimesCircle size={12} />, tone: "danger" },
};

const CONDITIONS: Condition[] = ["GOOD", "FAIR", "POOR", "BROKEN"];

export default function NewLoanReturnPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
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
      setTimeout(() => navigate("/inventory/loans", { replace: true }), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("loanReturn.new")} backAction={() => goBack("/inventory/returns")}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  const damagedCount = selectedUnits.filter(({ unit }) => needsNotes(unit.condition)).length;
  const brokenCount = selectedUnits.filter(({ unit }) => unit.condition === "BROKEN").length;
  const assignedName = loan ? (loan.custodian?.name ?? loan.department?.name ?? "—") : undefined;
  const sectionsDone = (loan ? 1 : 0) + (totalToReturn > 0 ? 1 : 0);

  // Pistas de Langostín por campo (clave = atributo `name` del input).
  const hints: Record<string, string> = { loan: t("loanReturn.hints.loan") };
  for (const { unit } of selectedUnits) {
    if (needsNotes(unit.condition)) hints[`notes-${unit.unitId}`] = t("loanReturn.hints.notes");
  }
  const guideStatus: LangostinGuideStatus = saving
    ? "saving"
    : toast?.type === "success"
      ? "saved"
      : toast?.type === "error" || Object.keys(errors).length > 0
        ? "error"
        : "idle";

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("loanReturn.new")}
      description={t("loanReturn.description")}
      icon={<FaUndoAlt size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loanReturn.title"), onClick: () => navigate("/inventory/returns") }, { label: t("loanReturn.new") }]}
      backAction={() => goBack("/inventory/loans")}
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <FormSection
            number={1}
            icon={<LuClipboardList size={16} />}
            title={t("loanReturn.sectionLoan")}
            description={t("loanReturn.sectionLoanHint")}
            complete={!!loan}
          >
            <ITSearchSelect
              name="loan"
              label={t("loanReturn.selectLoan")}
              placeholder={t("loanReturn.selectLoanPlaceholder")}
              options={loans.map((p) => ({ value: p.id, label: `${p.number} · ${p.custodian?.name ?? p.department?.name ?? ""}` }))}
              value={loan?.id ?? ""}
              onChange={(v) => select(String(v))}
            />
          </FormSection>

          <FormSection
            number={2}
            icon={<LuPackageCheck size={16} />}
            title={t("loanReturn.sectionUnits")}
            description={t("loanReturn.unitsHint")}
            complete={totalToReturn > 0}
          >
            {!loan ? (
              <LangostinState kind="empty" size="sm" title={t("loanReturn.pickLoanFirst")} description={t("loanReturn.pickLoanFirstHint")} />
            ) : rows.length === 0 ? (
              <LangostinState kind="empty" size="sm" title={t("loanReturn.nothingPending")} description={t("loanReturn.nothingPendingHint")} />
            ) : (
              <ITFlex direction="column" gap={3}>
                {rows.map((r) => (
                  <div
                    key={r.key}
                    className="flex flex-col gap-3 rounded-[16px] bg-[color-mix(in_srgb,currentColor_4%,transparent)] p-4"
                  >
                    <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                      <ITText className="m-0 text-sm font-bold text-slate-800">{r.deviceName}</ITText>
                      <ITFlex gap={1.5} wrap="wrap">
                        <ITChip size="sm" color="gray">{t("loanReturn.loaned")}: {r.loaned}</ITChip>
                        <ITChip size="sm" color="success">{t("loanReturn.returnedQuantity")}: {r.returnedQuantity}</ITChip>
                        <ITChip size="sm" color="warning">{t("loanReturn.pending")}: {r.pending}</ITChip>
                      </ITFlex>
                    </ITFlex>

                    <ITFlex direction="column" gap={2}>
                      {r.units.map((u) => (
                        <div
                          key={u.unitId}
                          className={`flex flex-col gap-2 rounded-[14px] px-3 py-2.5 transition-opacity ${
                            u.selected ? "bg-[var(--it-card-bg)]" : "opacity-60"
                          }`}
                        >
                          <ITFlex align="center" gap={3} wrap="wrap">
                            <ITCheckbox
                              name={`return-${u.unitId}`}
                              checked={u.selected}
                              onChange={(checked) => updateUnit(r.key, u.unitId, { selected: checked })}
                              label={<ITText as="span" className="sr-only">{t("loanReturn.returnUnit", { assetTag: u.assetTag })}</ITText>}
                            />
                            <ITFlex className="min-w-0">
                              <ITText className="m-0 text-[13px] font-bold text-slate-800">{u.assetTag}</ITText>
                              <ITText className={`m-0 text-[12px] ${u.serialNumber ? "text-slate-600" : "italic text-slate-400"}`}>
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
                                      aria-pressed={isActive}
                                      onClick={() => updateUnit(r.key, u.unitId, { condition: c })}
                                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full !border-0 px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                                      style={
                                        isActive
                                          ? { background: `var(--color-${p.tone}-soft)`, color: `var(--color-${p.tone})` }
                                          : { background: "color-mix(in srgb, currentColor 6%, transparent)", color: "inherit", opacity: 0.8 }
                                      }
                                    >
                                      {p.icon}
                                      <ITText as="span">{t(`loanReturn.conditionLabels.${c}`)}</ITText>
                                    </button>
                                  );
                                })}
                              </ITFlex>
                            )}
                          </ITFlex>

                          {u.selected && u.condition === "BROKEN" && (
                            <ITText className="m-0 text-[12px] font-semibold text-[color:var(--color-danger)]">{t("loanReturn.brokenRetirementHint")}</ITText>
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
                                <ITText as="span" role="alert" className="mt-1 block text-xs text-[color:var(--color-danger)]">
                                  {errors[`notes-${u.unitId}`]}
                                </ITText>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </ITFlex>
                  </div>
                ))}
              </ITFlex>
            )}
          </FormSection>
        </div>

        {/* Resumen vivo: el préstamo elegido y lo que se va a devolver */}
        <LiveSummary
          title={t("loanReturn.summaryTitle")}
          total={2}
          done={sectionsDone}
          footer={
            brokenCount > 0 ? (
              <ITText className="m-0 text-[12px] font-semibold text-[color:var(--color-danger)]">{t("loanReturn.brokenRetirementHint")}</ITText>
            ) : undefined
          }
        >
          {loan?.custodian && (
            <ITFlex align="center" gap={2.5}>
              <ProfileAvatar name={loan.custodian.name} size="lg" />
              <ITFlex className="min-w-0">
                <ITText className="m-0 truncate text-[13px] font-bold text-slate-800">{loan.custodian.name}</ITText>
                {loan.custodian.employeeNumber && (
                  <ITText className="m-0 text-[11.5px] text-slate-500">{t("loans.employeeNo", { n: loan.custodian.employeeNumber })}</ITText>
                )}
              </ITFlex>
            </ITFlex>
          )}
          <LiveSummaryRow label={t("loans.colNumber")} value={loan?.number} />
          <LiveSummaryRow label={t("loans.colDate")} value={loan ? formatDate(loan.date) : undefined} />
          <LiveSummaryRow label={t("loans.assignment")} value={assignedName} />
          <LiveSummaryRow label={t("loanReturn.pendingTotal")} value={loan ? pendingTotal : undefined} />
          <LiveSummaryRow label={t("loanReturn.toReturn")} value={loan ? totalToReturn : undefined} />
          {loan && damagedCount > 0 && <LiveSummaryRow label={t("loanReturn.withDamage")} value={damagedCount} />}
        </LiveSummary>
      </div>

      <StickyActions>
        <ITButton label={t("common:actions.cancel")} variant="outlined" color="gray" size="sm" className="!rounded-full" onClick={() => goBack("/inventory/loans")} disabled={saving} />
        <ITButton
          label={saving ? t("new.saving") : t("loanReturn.save")}
          variant="rounded"
          color="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={saving || !isValid}
        />
      </StickyActions>

      <LangostinGuide storageKey="inventory-return-new" hints={hints} status={guideStatus} defaultText={t("loanReturn.hints.default")} />

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}
