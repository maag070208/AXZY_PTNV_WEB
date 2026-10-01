import { FaGavel, FaVial } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PolicyListData } from "@entities/permission";
import PolicySentence from "../shared/PolicySentence";

interface Props {
  role: string;
  policies: PolicyListData | null;
  /** ¿El rol tiene el permiso de la acción (en el borrador)? */
  hasPermission: (permission: string) => boolean;
  onTest: (permission: string) => void;
}

/**
 * Reglas ABAC que aplican a este rol: las que lo nombran o las que aplican a
 * todos, agrupadas por acción. Si el rol no tiene el permiso de la acción, la
 * regla no llega a evaluarse (el RBAC ya lo detiene).
 */
export default function RolePoliciesList({ role, policies, hasPermission, onTest }: Props) {
  const { t } = useTranslation("roles");
  const applicable = (policies?.policies ?? []).filter(
    (policy) => policy.roles.length === 0 || policy.roles.includes(role)
  );

  if (applicable.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <FaGavel size={22} className="text-slate-300" />
        <p className="text-[12px] text-slate-500">{t("rolePolicies.empty")}</p>
      </div>
    );
  }

  const actions = [...new Set(applicable.map((policy) => policy.action))];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-slate-500">{t("rolePolicies.intro")}</p>
      {actions.map((actionKey) => {
        const action = policies?.actions.find((item) => item.key === actionKey);
        const reaches = hasPermission(actionKey);
        const rules = applicable
          .filter((policy) => policy.action === actionKey)
          .sort((a, b) => a.priority - b.priority);
        return (
          <div key={actionKey} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-slate-800">{action?.label ?? actionKey}</p>
                <p className="font-mono text-[10px] text-slate-400">{actionKey}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    reaches ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {reaches ? t("rolePolicies.evaluated") : t("rolePolicies.notReached")}
                </span>
                <button
                  type="button"
                  onClick={() => onTest(actionKey)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 !bg-white px-2 py-1 text-[10px] font-bold text-[#0D5777] hover:border-[#0D5777]"
                >
                  <FaVial size={9} /> {t("simulator.test")}
                </button>
              </div>
            </div>
            <ol className="divide-y divide-slate-100">
              {rules.map((policy, index) => (
                <li key={policy.id} className={`flex items-start gap-2 px-3 py-1.5 ${policy.active ? "" : "opacity-50"}`}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-slate-700">
                      {policy.name}
                      {!policy.active && <span className="ml-2 text-[10px] text-amber-600">{t("policies.inactive")}</span>}
                    </p>
                    <PolicySentence policy={policy} action={action} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
