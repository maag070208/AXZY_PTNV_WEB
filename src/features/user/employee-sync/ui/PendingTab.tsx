import { useMemo, useState } from "react";
import {
  ITBadget,
  ITButton,
  ITCard,
  ITChip,
  ITFlex,
  ITSearchSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type {
  EmployeeSyncPendingCandidate,
  EmployeeSyncPendingRow,
  EmployeeSyncReason,
} from "@entities/user";
import type { EmployeeSyncResolvedPending, UseEmployeeSync } from "../model/useEmployeeSync";

/** Cómo se va a resolver una fila pendiente. */
type ResolveMode = "existing" | "new";

/** Etiqueta de un candidato: nombre + número de empleado (si lo tiene). */
const candidateLabel = (candidate: EmployeeSyncPendingCandidate): string =>
  candidate.employeeNumber ? `${candidate.name} · #${candidate.employeeNumber}` : candidate.name;

/**
 * Pestaña "Por resolver": una tarjeta por persona con UNA sola decisión.
 *
 * Se pregunta si la persona ya existe en el sistema y se muestra un único
 * selector según la respuesta: candidatos (vincular) o departamento (alta
 * nueva). Así RH resuelve sin editar el Excel: la fila queda vinculada (solo se
 * manda su posición de nómina) o pasa a la pestaña Altas como una persona
 * nueva. Las resueltas bajan a una lista compacta con "Deshacer".
 */
export default function PendingTab({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");
  const rows = fx.pendingRows;
  const resolved = fx.resolvedPending;

  /** Opción elegida por `rowKey`; sin elegir, la que tenga sentido por candidatos. */
  const [modes, setModes] = useState<Record<string, ResolveMode>>({});
  const [candidates, setCandidates] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Record<string, string>>({});

  const reasonLabel = useMemo(
    () => (value: EmployeeSyncReason) =>
      t(`sync.reasons.${value}` as `sync.reasons.${EmployeeSyncReason}`),
    [t]
  );

  const hintOf = (reason: EmployeeSyncReason) =>
    t(`sync.pending.hints.${reason}` as `sync.pending.hints.${EmployeeSyncReason}`);

  const modeOf = (row: EmployeeSyncPendingRow): ResolveMode =>
    modes[row.rowKey] ?? ((row.candidates ?? []).length > 0 ? "existing" : "new");

  const candidateOf = (row: EmployeeSyncPendingRow) => candidates[row.rowKey] ?? "";
  const departmentOf = (row: EmployeeSyncPendingRow) =>
    departments[row.rowKey] ?? row.departmentId ?? "";

  const resolvedSection =
    resolved.length === 0 ? null : (
      <ITFlex direction="column" gap={2}>
        <ITText className="!text-[12.5px] font-semibold text-slate-800">
          {t("sync.pending.resolvedTitle")}
        </ITText>
        <ITText muted className="!text-[11.5px]">
          {t("sync.pending.resolvedHint")}
        </ITText>
        {resolved.map((item: EmployeeSyncResolvedPending) => (
          <ITCard key={`resolved-${item.rowKey}`} contentClassName="!px-4 !py-2">
            <ITFlex align="center" justify="between" gap={3} wrap="wrap">
              <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
                <ITText className="truncate !text-[12px] font-semibold text-slate-800">
                  {item.name ?? item.employeeNumber ?? "—"}
                </ITText>
                <ITText muted className="!text-[11px]">
                  {item.kind === "linked"
                    ? t("sync.pending.linkedTo", { name: item.userName ?? "—" })
                    : t("sync.pending.movedToAltas", { department: item.departmentName ?? "—" })}
                </ITText>
              </ITFlex>
              <ITButton
                variant="outlined"
                color="gray"
                size="sm"
                onClick={() => fx.undoPending(item.rowKey)}
              >
                <ITText className="!text-[11px] font-bold">{t("sync.pending.undo")}</ITText>
              </ITButton>
            </ITFlex>
          </ITCard>
        ))}
      </ITFlex>
    );

  if (rows.length === 0) {
    return (
      <ITFlex direction="column" gap={3}>
        <ITBadget color="success" size="sm" className="self-start">
          {t("sync.pending.allResolved")}
        </ITBadget>
        {resolvedSection}
      </ITFlex>
    );
  }

  return (
    <ITFlex direction="column" gap={3}>
      <ITText className="!text-[12px] font-semibold text-slate-700">
        {t("sync.pending.counter", { count: rows.length })}
      </ITText>

      {rows.map((row) => {
        const rowCandidates = row.candidates ?? [];
        const mode = modeOf(row);
        const chosenCandidate = candidateOf(row);
        const chosenDepartment = departmentOf(row);
        return (
          <ITCard key={`pending-${row.rowKey}`} contentClassName="!px-5 !py-4">
            <ITFlex direction="column" gap={3}>
              {/* Quién es y por qué quedó pendiente. */}
              <ITFlex direction="column" gap={1} className="min-w-0">
                <ITFlex align="center" gap={2} wrap="wrap">
                  <ITText className="!text-[13.5px] font-black text-slate-800">
                    {row.name ?? "—"}
                  </ITText>
                  <ITBadget color="warning" size="sm">
                    {reasonLabel(row.reason)}
                  </ITBadget>
                </ITFlex>
                <ITText muted className="!text-[11px]">
                  {t("sync.pending.rowMeta", { row: row.row, order: row.payrollOrder })}
                </ITText>
                <ITText className="!text-[11.5px] text-slate-600">{hintOf(row.reason)}</ITText>
                {row.detail && (
                  <ITText muted className="!text-[11px]">
                    {row.detail}
                  </ITText>
                )}
              </ITFlex>

              {/* Una sola pregunta y dos opciones excluyentes. */}
              <ITFlex
                align="center"
                justify="between"
                gap={3}
                wrap="wrap"
                className="rounded-2xl bg-slate-50/70 px-4 py-3"
              >
                <ITText className="!text-[12px] font-semibold text-slate-800">
                  {t("sync.pending.question")}
                </ITText>
                <ITFlex direction="column" gap={1} className="items-end">
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <ITChip
                      size="md"
                      color="primary"
                      variant={mode === "existing" ? "filled" : "outlined"}
                      selected={mode === "existing"}
                      disabled={rowCandidates.length === 0}
                      onClick={() =>
                        setModes((current) => ({ ...current, [row.rowKey]: "existing" }))
                      }
                      label={t("sync.pending.optionExisting")}
                    />
                    <ITChip
                      size="md"
                      color="primary"
                      variant={mode === "new" ? "filled" : "outlined"}
                      selected={mode === "new"}
                      onClick={() => setModes((current) => ({ ...current, [row.rowKey]: "new" }))}
                      label={t("sync.pending.optionNew")}
                    />
                  </ITFlex>
                  {rowCandidates.length === 0 && (
                    <ITText muted className="!text-[10.5px]">
                      {t("sync.pending.noCandidates")}
                    </ITText>
                  )}
                </ITFlex>
              </ITFlex>

              {/* Un solo selector visible según la opción elegida. */}
              {mode === "existing" ? (
                <ITFlex direction="column" gap={2}>
                  <ITFlex className="max-w-[440px] min-w-[260px]">
                    <ITSearchSelect
                      name={`pending-candidate-${row.rowKey}`}
                      label={t("sync.pending.searchCandidate")}
                      options={rowCandidates.map((candidate) => ({
                        value: candidate.userId,
                        label: candidateLabel(candidate),
                      }))}
                      value={chosenCandidate}
                      onChange={(value) =>
                        setCandidates((current) => ({ ...current, [row.rowKey]: String(value) }))
                      }
                      size="sm"
                      className="w-full min-w-0"
                    />
                  </ITFlex>
                  <ITFlex align="center" gap={3} wrap="wrap">
                    <ITButton
                      variant="filled"
                      color="primary"
                      disabled={!chosenCandidate}
                      onClick={() => fx.linkPending(row.rowKey, chosenCandidate)}
                    >
                      <ITText className="!text-[11px] font-bold !text-white">
                        {t("sync.pending.linkAction")}
                      </ITText>
                    </ITButton>
                    <ITText muted className="!text-[11px]">
                      {t("sync.pending.linkNote")}
                    </ITText>
                  </ITFlex>
                </ITFlex>
              ) : (
                <ITFlex direction="column" gap={2}>
                  <ITFlex className="max-w-[440px] min-w-[260px]">
                    <ITSearchSelect
                      name={`pending-department-${row.rowKey}`}
                      label={t("sync.altas.thDepartment")}
                      options={fx.departmentOptions}
                      value={chosenDepartment}
                      onChange={(value) =>
                        setDepartments((current) => ({ ...current, [row.rowKey]: String(value) }))
                      }
                      size="sm"
                      className="w-full min-w-0"
                    />
                  </ITFlex>
                  <ITFlex align="center" gap={3} wrap="wrap">
                    <ITButton
                      variant="filled"
                      color="primary"
                      disabled={!chosenDepartment}
                      onClick={() => fx.convertPendingToAlta(row.rowKey, chosenDepartment)}
                    >
                      <ITText className="!text-[11px] font-bold !text-white">
                        {t("sync.pending.newAction")}
                      </ITText>
                    </ITButton>
                    <ITText muted className="!text-[11px]">
                      {t("sync.pending.newNote")}
                    </ITText>
                  </ITFlex>
                </ITFlex>
              )}
            </ITFlex>
          </ITCard>
        );
      })}

      {resolvedSection}
    </ITFlex>
  );
}
