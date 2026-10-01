import { useMemo, useState } from "react";
import { ITAlert, ITButton } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaEdit, FaGavel, FaLock, FaPlus, FaVial } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PolicyAdmin } from "@entities/permission";
import { LottieLoader } from "@shared/ui/lottie-loader";
import type { PoliciesState } from "../../model/usePolicies";
import PolicySentence from "../shared/PolicySentence";
import PolicyEditorDialog, { type PolicySubmit } from "../PolicyEditorDialog";

interface Props {
  policies: PoliciesState;
  onTest: (permission: string) => void;
  notify: (message: string, type: "success" | "error") => void;
}

/**
 * Pestaña "Políticas" (ABAC): por acción, las reglas en el orden en que se
 * evalúan, en lenguaje natural, con el paso final implícito ("si ninguna casa,
 * se permite"). Crear, editar y probar sin tocar código.
 */
export default function PoliciesPanel({ policies, onTest, notify }: Props) {
  const { t } = useTranslation("roles");
  const { data, loading, error, saving, create, update, remove } = policies;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PolicyAdmin | null>(null);
  const [newForAction, setNewForAction] = useState<string | null>(null);

  const grouped = useMemo(() => {
    if (!data) return [];
    const keys = [...new Set([...data.actions.map((action) => action.key), ...data.policies.map((policy) => policy.action)])];
    return keys.map((key) => ({
      key,
      action: data.actions.find((action) => action.key === key),
      rules: data.policies.filter((policy) => policy.action === key).sort((a, b) => a.priority - b.priority),
    }));
  }, [data]);

  const handleSubmit = async (submit: PolicySubmit): Promise<boolean> => {
    const result =
      submit.mode === "create" ? await create(submit.payload) : submit.id ? await update(submit.id, submit.payload) : { ok: false };
    notify(
      result.ok ? (submit.mode === "create" ? t("policies.created") : t("policies.updated")) : result.error ?? t("policies.saveError"),
      result.ok ? "success" : "error"
    );
    return result.ok;
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    const result = await remove(id);
    notify(result.ok ? t("policies.deleted") : result.error ?? t("policies.saveError"), result.ok ? "success" : "error");
    return result.ok;
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <LottieLoader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ITAlert variant="error" dismissible={false}>
        {error ?? t("policies.loadError")}
      </ITAlert>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-[11px] text-slate-500">{t("policies.subtitle")}</p>
        <ITButton
          variant="filled"
          color="primary"
          size="sm"
          onClick={() => {
            setEditing(null);
            setNewForAction(null);
            setEditorOpen(true);
          }}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <FaPlus size={11} /> {t("policies.new")}
          </span>
        </ITButton>
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-2">
        {grouped.map(({ key, action, rules }) => (
          <div key={key} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0D5777]/10 text-[#0D5777]">
                  <FaGavel size={11} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-black text-slate-800">{action?.label ?? key}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {key}
                    {action && <> · {action.module}</>}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setNewForAction(key);
                    setEditorOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 !bg-white px-2 py-1 text-[10px] font-bold text-[#0D5777] hover:border-[#0D5777]"
                >
                  <FaPlus size={8} /> {t("policies.addRule")}
                </button>
                <button
                  type="button"
                  onClick={() => onTest(key)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 !bg-white px-2 py-1 text-[10px] font-bold text-[#0D5777] hover:border-[#0D5777]"
                >
                  <FaVial size={9} /> {t("simulator.test")}
                </button>
              </span>
            </div>
            <ol className="flex flex-1 flex-col gap-0 px-3 py-2">
              {rules.length === 0 && (
                <li className="py-2 text-[11px] italic text-slate-400">{t("policies.noRulesForAction")}</li>
              )}
              {rules.map((policy, index) => (
                <li key={policy.id} className="relative flex gap-2 pb-2">
                  <span className="absolute left-[9px] top-5 h-[calc(100%-14px)] w-px bg-slate-200" />
                  <span
                    className={`z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                      policy.active ? "bg-[#0D5777] text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className={`min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 ${policy.active ? "" : "opacity-60"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-800">{policy.name}</span>
                      <span className="rounded bg-slate-100 px-1.5 text-[9px] font-black text-slate-500">
                        {t("policies.priorityShort", { priority: policy.priority })}
                      </span>
                      {policy.key && (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 text-[9px] font-black text-slate-500">
                          <FaLock size={7} /> {t("policies.basePolicy")}
                        </span>
                      )}
                      {!policy.active && <span className="text-[10px] font-bold text-amber-600">{t("policies.inactive")}</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(policy);
                          setEditorOpen(true);
                        }}
                        className="ml-auto inline-flex items-center gap-1 !bg-transparent text-[10px] font-bold text-[#0D5777] hover:underline"
                      >
                        <FaEdit size={9} /> {t("policies.edit")}
                      </button>
                    </div>
                    <div className="mt-1">
                      <PolicySentence policy={policy} action={action} />
                    </div>
                    {policy.description && <p className="mt-1 text-[10px] text-slate-400">{policy.description}</p>}
                  </div>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FaCheckCircle size={11} />
                </span>
                <span className="text-[10px] font-semibold text-slate-500">{t("policies.fallback")}</span>
              </li>
            </ol>
          </div>
        ))}
      </div>

      <PolicyEditorDialog
        isOpen={editorOpen}
        policy={editing}
        actions={data.actions}
        policies={data.policies}
        initialAction={newForAction}
        saving={saving}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
