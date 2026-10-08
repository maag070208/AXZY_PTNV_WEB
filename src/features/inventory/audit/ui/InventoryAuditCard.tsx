import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaSyncAlt } from "react-icons/fa";
import { formatDateTime } from "@shared/utils/dates";
import { useInventoryAudit } from "../model/useInventoryAudit";

/** `YYYY-MM-DD` → `DD/MM/AAAA` sin pasar por `Date` (la zona local correría el día). */
const formatDay = (day?: string): string => (day ? day.split("-").reverse().join("/") : "");

/**
 * Estado de consistencia del inventario: préstamos, unidades y kardex. En
 * verde si todo cuadra; si no, cada regla rota con sus casos y el atajo para
 * resolverlos. La API también la revisa a diario y avisa cuando cambia.
 */
export default function InventoryAuditCard() {
  const { t } = useTranslation("inventory");
  const { audit, loading, error, reload } = useInventoryAudit(true);
  const navigate = useNavigate();
  const failing = audit?.checks.filter((c) => c.count > 0) ?? [];

  /** Abre la pantalla de descuadres con ese renglón ya elegido. */
  const abrirDescuadre = (movementItemId?: string) =>
    navigate("/inventory/audit/mismatches", { state: movementItemId ? { movementItemId } : undefined });

  return (
    <ITFlex
      as="section"
      direction="column"
      gap={3}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex align="center" gap={2} className="min-w-0">
          <FaShieldAlt className="shrink-0 text-slate-400" size={16} />
          <ITFlex direction="column" gap={0} className="min-w-0">
            <ITText className="text-sm font-bold text-slate-800">{t("audit.title")}</ITText>
            <ITText className="text-[11px] text-slate-500">{t("audit.hint")}</ITText>
          </ITFlex>
        </ITFlex>
        <ITFlex align="center" gap={2} wrap="wrap">
          <ITButton variant="outlined" color="secondary" size="sm" disabled={loading} onClick={() => void reload()}>
            <ITFlex align="center" gap={1}>
              <FaSyncAlt size={11} className={loading ? "animate-spin" : ""} />
              <ITText className="text-[11px] font-bold">{t("audit.run")}</ITText>
            </ITFlex>
          </ITButton>
          {failing.length > 0 && (
            <ITButton variant="filled" color="primary" size="sm" onClick={() => abrirDescuadre()}>
              <ITText className="text-[11px] font-bold">{t("audit.resolveScreen")}</ITText>
            </ITButton>
          )}
        </ITFlex>
      </ITFlex>

      {error && <ITAlert variant="error">{error}</ITAlert>}

      {audit &&
        (audit.ok ? (
          <ITFlex align="center" gap={2} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <FaCheckCircle className="text-emerald-600" size={14} />
            <ITText className="text-[12px] font-semibold text-emerald-700">{t("audit.ok")}</ITText>
          </ITFlex>
        ) : (
          <ITFlex direction="column" gap={3}>
            {failing.map((c) => (
              <ITFlex
                key={c.key}
                direction="column"
                gap={2}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <ITFlex align="center" gap={2} wrap="wrap">
                  <FaExclamationTriangle className="shrink-0 text-amber-600" size={12} />
                  <ITText className="text-[12px] font-bold text-amber-900">{t(`audit.checks.${c.key}`)}</ITText>
                  <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {t("audit.cases", { count: c.count })}
                  </span>
                </ITFlex>
                {c.rows?.length ? (
                  <ITFlex direction="column" gap={2}>
                    {c.rows.map((row, i) => (
                      <ITFlex
                        key={`${row.device}-${i}`}
                        align="center"
                        gap={2}
                        wrap="wrap"
                        className="rounded-lg border border-amber-200/70 bg-white/70 px-3 py-2"
                      >
                        <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                          {row.movementType}
                        </span>
                        <ITText className="text-[11px] text-slate-500">{formatDay(row.date)}</ITText>
                        <ITText className="text-[12px] font-semibold text-slate-800">{row.device}</ITText>
                        {row.quantity !== undefined && row.linked !== undefined && (
                          <ITFlex align="center" gap={1} wrap="wrap">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {t("audit.chipSays", { n: row.quantity })}
                            </span>
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                              {t("audit.chipLinked", { n: row.linked })}
                            </span>
                            {row.quantity > row.linked ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                {t("audit.chipMissing", { n: row.quantity - row.linked })}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                {t("audit.chipExtra", { n: row.linked - row.quantity })}
                              </span>
                            )}
                          </ITFlex>
                        )}
                        {row.movementItemId && (
                          <ITButton
                            variant="outlined"
                            color="secondary"
                            size="sm"
                            className="!ml-auto"
                            onClick={() => abrirDescuadre(row.movementItemId)}
                          >
                            <ITText className="text-[10px] font-bold">{t("audit.resolve")}</ITText>
                          </ITButton>
                        )}
                      </ITFlex>
                    ))}
                  </ITFlex>
                ) : (
                  <ITText className="text-[11px] text-amber-900">{c.samples.join(" · ")}</ITText>
                )}
                <ITText className="text-[10px] text-amber-700">{t(`audit.fix.${c.key}`)}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        ))}

      {audit && (
        <ITText className="text-[10px] text-slate-400">
          {t("audit.checkedAt", { date: formatDateTime(audit.checkedAt) })}
        </ITText>
      )}
    </ITFlex>
  );
}
