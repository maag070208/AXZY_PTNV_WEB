import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { SystemHealthWidget } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { formatDateTime } from "@shared/utils/dates";
import { CardShell, DotRow, StackedBar, StatChip, StatusPill } from "@shared/ui/dashboard-card";

/** Una sincronización con más de este tiempo se marca atrasada (igual que el widget). */
const STALE_SYNC_MS = 2 * 60 * 60 * 1000;

const GREEN = "var(--color-success)";
const AMBER = "var(--color-warning)";
const RED = "var(--color-danger)";

interface Props {
  health: SystemHealthWidget | null;
}

const linkCls = "cursor-pointer text-[13px] font-semibold text-slate-900 underline";

/**
 * Pestaña **Sistema**: salud de los relojes, correos, último auditor de
 * inventario, estado de cada reloj y atajos de configuración.
 */
export default function SystemDashboard({ health }: Props) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const canConfigure = useCan("system.configure");

  const clocks = health?.clocks ?? [];
  const total = clocks.length;
  const isStale = (syncedAt: string | null) => !syncedAt || Date.now() - Date.parse(syncedAt) > STALE_SYNC_MS;
  const stale = clocks.filter((c) => isStale(c.syncedAt)).length;
  const fresh = total - stale;
  const failed = health?.failedEmailsLast7Days ?? 0;
  const pending = health?.pendingEmails ?? 0;
  const audit = health?.inventoryAudit ?? null;
  // El widget no trae bandera de resultado: el aviso de descuadre es el que dice "descuadre/mismatch".
  const auditBad = !!audit && /descuadre|mismatch/i.test(audit.title);
  const toClocks = canConfigure ? () => navigate("/clocks") : undefined;

  const shortcuts = [
    { label: t("system.shortcutClocks"), to: "/clocks" },
    { label: t("system.shortcutRoles"), to: "/roles" },
    { label: t("system.shortcutCatalog"), to: "/catalogs" },
    { label: t("system.shortcutAudit"), to: "/inventory" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:!flex-row">
        {/* Salud del sistema */}
        <CardShell
          title={t("system.title")}
          className="xl:basis-[44%]"
          right={<span className="text-[13px] text-slate-600">{t("system.syncedOf", { fresh, total })}</span>}
        >
          <StackedBar
            label={t("system.title")}
            segments={[
              { key: "synced", value: fresh, color: GREEN },
              { key: "stale", value: stale, color: AMBER },
            ]}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatChip label={t("system.chipSynced")} value={fresh} color={GREEN} />
            <StatChip label={t("system.chipStale")} value={stale} color={AMBER} tint="#fef1e3" />
          </div>
          {total === 0 && <div className="py-4 text-center text-[12.5px] text-slate-500">{t("system.noClocks")}</div>}
        </CardShell>

        {/* Correos */}
        <CardShell
          title={t("system.mail")}
          className="xl:basis-[29%]"
          right={
            failed === 0 && pending === 0 ? (
              <StatusPill tone="success">{t("system.allGood")}</StatusPill>
            ) : (
              <StatusPill tone="danger">{t("system.needsAttention")}</StatusPill>
            )
          }
        >
          <DotRow label={t("system.failedEmails")} value={failed} color={RED} />
          <DotRow label={t("system.pendingEmails")} value={pending} color={AMBER} />
        </CardShell>

        {/* Auditor de inventario */}
        <CardShell
          title={t("system.audit")}
          className="xl:basis-[27%]"
          right={
            audit ? <StatusPill tone={auditBad ? "danger" : "success"}>{auditBad ? t("system.auditMismatch") : t("system.auditOk")}</StatusPill> : undefined
          }
        >
          {audit ? (
            <div className="flex flex-1 flex-col gap-1">
              <div className="text-[13.5px] font-semibold text-slate-900">{audit.title}</div>
              {audit.detail && <div className="text-[12.5px] text-slate-600">{audit.detail}</div>}
              <div className="text-[12px] text-slate-400">{formatDateTime(audit.at)}</div>
            </div>
          ) : (
            <div className="py-4 text-center text-[12.5px] text-slate-500">{t("system.auditNone")}</div>
          )}
          <button type="button" onClick={() => navigate("/inventory")} className={`${linkCls} mt-3 self-start`}>
            {t("system.viewAudit")}
          </button>
        </CardShell>
      </div>

      <div className="flex flex-col gap-4 xl:!flex-row">
        {/* Relojes */}
        <CardShell
          title={t("system.clocks")}
          className="xl:basis-[72%]"
          right={
            toClocks ? (
              <button type="button" onClick={toClocks} className={linkCls}>
                {t("system.viewClocks")}
              </button>
            ) : undefined
          }
        >
          {total === 0 ? (
            <div className="py-4 text-center text-[12.5px] text-slate-500">{t("system.noClocks")}</div>
          ) : (
            <div className="max-h-[300px] overflow-auto" style={{ borderTop: "1px solid #eef1f5" }}>
              {clocks.map((c) => {
                const late = isStale(c.syncedAt);
                return (
                  <div key={c.serialNumber} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid #f3f5f8" }}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: late ? AMBER : GREEN }} />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-800">{c.name ?? c.serialNumber}</span>
                    <span className="shrink-0 text-[12.5px] tabular-nums text-slate-500">
                      {c.syncedAt ? t("system.lastSyncShort", { when: formatDateTime(c.syncedAt) }) : t("system.neverSynced")}
                    </span>
                    <StatusPill tone={late ? "warning" : "success"}>{late ? t("system.staleOne") : t("system.okOne")}</StatusPill>
                  </div>
                );
              })}
            </div>
          )}
        </CardShell>

        {/* Atajos de configuración */}
        <CardShell title={t("system.shortcuts")} className="xl:basis-[28%]">
          <div style={{ borderTop: "1px solid #eef1f5" }}>
            {shortcuts.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 py-2.5 text-left text-[13px] text-slate-800 hover:bg-slate-50"
                style={{ borderBottom: "1px solid #f3f5f8" }}
              >
                {item.label}
                <span aria-hidden className="text-slate-400">›</span>
              </button>
            ))}
          </div>
        </CardShell>
      </div>
    </div>
  );
}
