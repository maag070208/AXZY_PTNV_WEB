import { ITBentoGauge, ITBentoGrid, ITBentoTile } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuClock, LuHeartPulse, LuMail, LuShieldCheck, LuWrench } from "react-icons/lu";
import type { SystemHealthWidget } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { formatDateTime } from "@shared/utils/dates";
import { MiniStat, Num } from "@shared/ui/bento-bits";

/** Una sincronización con más de este tiempo se marca atrasada (igual que el widget). */
const STALE_SYNC_MS = 2 * 60 * 60 * 1000;

interface Props {
  health: SystemHealthWidget | null;
}

/**
 * Pestaña **Sistema** con el mosaico bento del inicio: salud general con el
 * medidor de relojes sincronizados, correos de los últimos días, el último
 * auditor de inventario y el estado de cada reloj. Cada número lleva a la
 * pantalla donde se atiende.
 */
export default function SystemDashboard({ health }: Props) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const canConfigure = useCan("system.configure");

  const clocks = health?.clocks ?? [];
  const total = clocks.length;
  const fresh = clocks.filter((c) => c.syncedAt && Date.now() - Date.parse(c.syncedAt) <= STALE_SYNC_MS).length;
  const stale = total - fresh;
  const failed = health?.failedEmailsLast7Days ?? 0;
  const pending = health?.pendingEmails ?? 0;
  const audit = health?.inventoryAudit ?? null;

  return (
    <ITBentoGrid>
      {/* Salud general: relojes sincronizados en las últimas 2 h */}
      <ITBentoTile
        tone="sea"
        cols={4}
        rows={4}
        wide
        icon={<LuHeartPulse size={15} />}
        label={t("system.title")}
        value={<Num value={fresh} />}
        caption={t("system.ofClocks", { total })}
        onClick={canConfigure ? () => navigate("/clocks") : undefined}
      >
        <div className="relative z-[1] my-1 flex min-h-0 flex-1 flex-col justify-center">
          {total > 0 ? (
            <ITBentoGauge value={fresh / total} color="var(--color-success)" trackColor="rgb(255 255 255 / 0.14)" />
          ) : (
            <p className="m-0 text-center text-[12px] font-medium" style={{ color: "rgba(234,246,248,.6)" }}>
              {t("system.noClocks")}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px]">
              <b className="h-[7px] w-[7px] rounded-full bg-[var(--color-success)]" />
              {t("system.synced", { count: fresh })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px]">
              <b className="h-[7px] w-[7px] rounded-full bg-[var(--color-warning)]" />
              {t("system.stale", { count: stale })}
            </span>
          </div>
        </div>
      </ITBentoTile>

      {/* Correos */}
      <ITBentoTile cols={4} rows={2} wide icon={<LuMail size={15} />} label={t("system.mail")}>
        <div className="mt-2 grid flex-1 !grid-cols-2 gap-2">
          <MiniStat
            label={t("system.failedEmails")}
            value={<Num value={failed} />}
            color={failed > 0 ? "var(--color-danger)" : "var(--color-success)"}
            outline={failed === 0}
          />
          <MiniStat
            label={t("system.pendingEmails")}
            value={<Num value={pending} />}
            color={pending > 0 ? "var(--color-warning)" : "var(--color-success)"}
            outline={pending === 0}
          />
        </div>
      </ITBentoTile>

      {/* Auditor de inventario */}
      <ITBentoTile
        cols={4}
        rows={2}
        wide
        icon={<LuShieldCheck size={15} />}
        label={t("system.audit")}
        onClick={() => navigate("/inventory")}
      >
        {audit ? (
          <div className="mt-2 flex flex-1 flex-col justify-center gap-1">
            <p className="m-0 text-[13px] font-bold text-slate-900">{audit.title}</p>
            <p className="m-0 text-[11.5px]" style={{ color: "var(--it-bento-muted)" }}>
              {[audit.detail, formatDateTime(audit.at)].filter(Boolean).join(" · ")}
            </p>
          </div>
        ) : (
          <p className="m-0 mt-2 text-[12px] font-medium" style={{ color: "var(--it-bento-muted)" }}>
            {t("system.auditNone")}
          </p>
        )}
      </ITBentoTile>

      {/* Relojes con su última sincronización */}
      <ITBentoTile
        cols={4}
        rows={2}
        icon={<LuClock size={15} />}
        label={t("system.clocks")}
        onClick={canConfigure ? () => navigate("/clocks") : undefined}
      >
        {total === 0 ? (
          <p className="m-0 mt-2 text-[12px] font-medium" style={{ color: "var(--it-bento-muted)" }}>
            {t("system.noClocks")}
          </p>
        ) : (
          <ul className="m-0 mt-1.5 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0">
            {clocks.map((c) => {
              const isStale = !c.syncedAt || Date.now() - Date.parse(c.syncedAt) > STALE_SYNC_MS;
              return (
                <li key={c.serialNumber} className="flex items-center gap-2 rounded-[12px] px-2 py-1.5" style={{ background: "color-mix(in srgb, currentColor 4%, transparent)" }}>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: isStale ? "var(--color-warning)" : "var(--color-success)" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold">{c.name ?? c.serialNumber}</span>
                    <span className="block truncate text-[11px]" style={{ color: "var(--it-bento-muted)" }}>
                      {c.syncedAt ? t("system.lastSyncShort", { when: formatDateTime(c.syncedAt) }) : t("system.neverSynced")}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold" style={{ color: isStale ? "var(--color-warning)" : "var(--color-success)" }}>
                    {isStale ? t("system.staleOne") : t("system.okOne")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ITBentoTile>

      {/* Atajos de configuración */}
      <ITBentoTile cols={4} rows={2} icon={<LuWrench size={15} />} label={t("system.shortcuts")}>
        <ul className="m-0 mt-1.5 flex min-h-0 flex-1 list-none flex-col justify-between gap-1 overflow-y-auto p-0">
          {[
            { label: t("system.shortcutClocks"), to: "/clocks" },
            { label: t("system.shortcutRoles"), to: "/roles" },
            { label: t("system.shortcutCatalog"), to: "/catalogs" },
            { label: t("system.shortcutAudit"), to: "/inventory" },
          ].map((item) => (
            <li key={item.to}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[12px] px-2.5 py-1.5 text-left text-[12px] font-semibold transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
                style={{ background: "color-mix(in srgb, currentColor 4%, transparent)" }}
              >
                {item.label}
                <span aria-hidden style={{ color: "var(--it-bento-muted)" }}>
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ITBentoTile>
    </ITBentoGrid>
  );
}
