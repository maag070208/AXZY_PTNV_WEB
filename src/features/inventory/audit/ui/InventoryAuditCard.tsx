import { useTranslation } from "react-i18next";
import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaSyncAlt } from "react-icons/fa";
import { formatDateTime } from "@shared/utils/dates";
import { useInventoryAudit } from "../model/useInventoryAudit";

/**
 * Estado de consistencia del inventario: préstamos, unidades y kardex. En
 * verde si todo cuadra; si no, cada regla rota con ejemplos para corregirla.
 * La API también la revisa a diario y avisa cuando cambia.
 */
export default function InventoryAuditCard() {
  const { t } = useTranslation(["inventory"]);
  const { audit, loading, error, reload } = useInventoryAudit(true);
  const failing = audit?.checks.filter((c) => c.count > 0) ?? [];

  return (
    <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <ITFlex align="center" justify="between" gap={2} wrap="wrap">
        <ITFlex align="center" gap={2}>
          <FaShieldAlt className="text-slate-400" size={16} />
          <ITText className="text-sm font-bold text-slate-800">{t("audit.title")}</ITText>
        </ITFlex>
        <ITButton variant="outlined" color="secondary" size="sm" onClick={() => void reload()} disabled={loading}>
          <ITFlex align="center" gap={1}>
            <FaSyncAlt size={11} className={loading ? "animate-spin" : ""} />
            <ITText className="text-[11px] font-bold">{t("audit.run")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>
      <ITText className="text-[11px] text-slate-500">{t("audit.hint")}</ITText>

      {error && <ITAlert variant="error">{error}</ITAlert>}

      {audit &&
        (audit.ok ? (
          <ITFlex align="center" gap={2} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <FaCheckCircle className="text-emerald-600" size={14} />
            <ITText className="text-[12px] font-semibold text-emerald-700">{t("audit.ok")}</ITText>
          </ITFlex>
        ) : (
          <ITFlex direction="column" gap={2}>
            {failing.map((c) => (
              <ITFlex key={c.key} direction="column" gap={1} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <ITFlex align="center" gap={2}>
                  <FaExclamationTriangle className="text-amber-600" size={12} />
                  <ITText className="text-[12px] font-bold text-amber-800">
                    {t(`audit.checks.${c.key}`)}: {c.count}
                  </ITText>
                </ITFlex>
                <ITText className="text-[11px] text-amber-900">{c.samples.join(" · ")}</ITText>
                <ITText className="text-[10px] text-amber-700">{t(`audit.fix.${c.key}`)}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        ))}

      {audit && <ITText className="text-[10px] text-slate-400">{t("audit.checkedAt", { date: formatDateTime(audit.checkedAt) })}</ITText>}
    </ITFlex>
  );
}
