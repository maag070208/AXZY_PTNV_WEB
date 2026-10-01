import type { ReactNode } from "react";
import { FaBan, FaCheckCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PolicyActionDef, PolicyAdmin, PolicyCondition } from "@entities/permission";
import { roleLabel } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { useConditionValue } from "./useConditionValue";

interface Props {
  policy: Pick<PolicyAdmin, "effect" | "roles" | "conditions">;
  action: PolicyActionDef | undefined;
}

/**
 * Regla en lenguaje natural: "Si es ADMIN → puede", "Si Creador es igual a la
 * misma persona → no puede", "Siempre → no puede". Los roles se leen como una
 * condición más ("es GERENTE o CHEF").
 */
export default function PolicySentence({ policy, action }: Props) {
  const { t } = useTranslation("roles");
  const tt = dyn(t);
  const valueText = useConditionValue();
  const fieldLabel = (field: string) => action?.fields.find((item) => item.key === field)?.label ?? field;

  const parts: ReactNode[] = [];
  if (policy.roles.length > 0) {
    parts.push(
      <span key="roles" className="inline-flex flex-wrap items-center gap-1">
        <span className="text-slate-500">{t("policies.isRole")}</span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700">
          {policy.roles.map(roleLabel).join(` ${t("policies.or")} `)}
        </span>
      </span>
    );
  }
  policy.conditions.forEach((item: PolicyCondition, index) =>
    parts.push(
      <span key={`${item.field}-${index}`} className="inline-flex flex-wrap items-center gap-1">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700">{fieldLabel(item.field)}</span>
        <span className="text-slate-500">{tt(`policies.operator.${item.operator}`)}</span>
        {item.value != null && (
          <span className="rounded-md bg-[#0D5777]/10 px-1.5 py-0.5 font-bold text-[#0D5777]">{valueText(item.value)}</span>
        )}
      </span>
    )
  );

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="font-black text-slate-400">{parts.length === 0 ? t("policies.always") : t("policies.if")}</span>
      {parts.map((part, index) => (
        <span key={index} className="inline-flex flex-wrap items-center gap-1.5">
          {index > 0 && <span className="font-black text-slate-400">{t("policies.and")}</span>}
          {part}
        </span>
      ))}
      <span className="text-slate-300">→</span>
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-black ${
          policy.effect === "DENY" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {policy.effect === "DENY" ? <FaBan size={9} /> : <FaCheckCircle size={9} />}
        {t(`policies.verdict.${policy.effect}`)}
      </span>
    </span>
  );
}
