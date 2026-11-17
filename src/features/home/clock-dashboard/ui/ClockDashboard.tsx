import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { AccessTodayWidget, SetupGapsWidget } from "@entities/dashboard";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { formatTimeInTZ } from "@shared/utils/dates";
import { toTitleCase } from "@shared/utils/text";
import { AttentionBlock, CardShell, StackedBar, StatChip, StatusPill } from "@shared/ui/dashboard-card";
import { InitialsAvatar } from "@shared/ui/initials-avatar";

interface Props {
  access: AccessTodayWidget | null;
  setup: SetupGapsWidget | null;
}

type ChipKey = "ENTRY" | "EXIT" | "ON_SITE";

const AMBER = "var(--color-warning)";
const GREEN = "var(--color-success)";
const VIOLET = "var(--color-violet-500)";

/** Estado vacío compacto, centrado dentro de la tarjeta. */
const Empty = ({ text }: { text: string }) => (
  <div className="py-4 text-center text-[12.5px] text-slate-500">{text}</div>
);

const linkCls = "cursor-pointer text-[13px] font-semibold text-slate-900 underline";

/**
 * Pestaña **Reloj y accesos**: accesos de hoy (con filtro por chip), pendientes
 * de configuración, quién sigue en sitio y los últimos registros.
 */
export default function ClockDashboard({ access, setup }: Props) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const canAssign = useCan("schedules.view");
  const canLog = useCan("access.log");
  const [selectedKey, setSelectedKey] = useState<ChipKey | null>(null);

  const entries = access?.entries ?? 0;
  const exits = access?.exits ?? 0;
  const mine = access?.registeredByMe ?? 0;
  const onSiteRows = access?.onSite ?? [];
  const latest = access?.latest ?? [];
  const time = (iso: string) => (access ? formatTimeInTZ(iso, access.timezone) : "");
  const nameOf = (n: string | null) => (n ? toTitleCase(n) : "—");
  const openLog = canLog ? () => navigate("/access") : undefined;
  const linked = () => navigate("/hr/time-clock/employees");

  const chips: Array<{ key: ChipKey | "MINE"; label: string; value: number; color: string }> = [
    { key: "ENTRY", label: t("access.entries"), value: entries, color: GREEN },
    { key: "EXIT", label: t("access.exits"), value: exits, color: AMBER },
    { key: "MINE", label: t("access.mine"), value: mine, color: "#9aa3b2" },
    { key: "ON_SITE", label: t("access.onSite"), value: onSiteRows.length, color: VIOLET },
  ];
  const selected = chips.find((c) => c.key === selectedKey) ?? null;
  // Filas del filtro: registros recientes del tipo elegido, o quienes siguen en sitio.
  const listRows =
    selectedKey === "ON_SITE"
      ? onSiteRows.map((p) => ({ id: p.employeeId, name: p.name, detail: [p.site, t("access.since", { time: time(p.since) })].filter(Boolean).join(" · ") }))
      : selectedKey
        ? latest.filter((e) => e.type === selectedKey).map((e) => ({ id: e.id, name: e.name, detail: [e.site, time(e.at)].filter(Boolean).join(" · ") }))
        : [];

  const setupBlocks = [
    {
      key: "numbers",
      value: setup?.unlinkedClockNumbers ?? 0,
      title: t("setup.unlinkedClockNumbers"),
      subtitle: t("setup.unlinkedNumbersHint"),
      action: t("setup.link"),
      onAction: linked,
    },
    {
      key: "withoutClock",
      value: setup?.personalWithoutClock ?? 0,
      title: t("setup.personalWithoutClock"),
      subtitle: t("setup.withoutClockHint"),
      action: t("setup.link"),
      onAction: linked,
    },
    {
      key: "withoutSchedule",
      value: setup?.personalWithoutSchedule ?? 0,
      title: t("setup.personalWithoutSchedule"),
      subtitle: t("setup.withoutScheduleHint"),
      action: t("setup.assign"),
      onAction: canAssign ? () => navigate("/schedules/assign") : undefined,
    },
  ].filter((b) => b.value > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 xl:!flex-row">
        {/* Accesos de hoy */}
        <CardShell
          title={t("access.title")}
          className="xl:basis-[44%]"
          right={<span className="text-[13px] text-slate-600">{t("access.entriesExits", { entries, exits })}</span>}
        >
          <StackedBar
            label={t("access.title")}
            segments={[
              { key: "ENTRY", value: entries, color: GREEN },
              { key: "EXIT", value: exits, color: AMBER },
            ]}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chips.map((chip) =>
              chip.key === "MINE" ? (
                <StatChip key={chip.key} label={chip.label} value={chip.value} color={chip.color} onClick={openLog} />
              ) : (
                <StatChip
                  key={chip.key}
                  label={chip.label}
                  value={chip.value}
                  color={chip.color}
                  selected={selectedKey === chip.key}
                  onClick={() => setSelectedKey(selectedKey === chip.key ? null : (chip.key as ChipKey))}
                />
              ),
            )}
          </div>
          {entries + exits === 0 && !selected && <Empty text={t("access.noEntries")} />}
          {selected && (
            <div className="mt-3 flex min-h-0 flex-col">
              <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                <b className="font-semibold text-slate-900">{selected.label} · {listRows.length}</b>
                <span className="flex items-center gap-3">
                  {openLog && (
                    <button type="button" className="cursor-pointer text-[12px] font-semibold text-slate-900 underline" onClick={openLog}>
                      {t("access.viewLog")}
                    </button>
                  )}
                  <button type="button" className="cursor-pointer text-[12px] text-slate-500 underline" onClick={() => setSelectedKey(null)}>
                    {t("attendance.clearFilter")}
                  </button>
                </span>
              </div>
              <div className="max-h-[216px] overflow-auto" style={{ borderTop: "1px solid #eef1f5" }}>
                {listRows.length === 0 ? (
                  <Empty text={t("attendance.nobody")} />
                ) : (
                  listRows.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 py-1.5" style={{ borderBottom: "1px solid #f3f5f8" }}>
                      <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-slate-800">
                        <InitialsAvatar name={r.name ?? "—"} size={28} />
                        <span className="truncate">{nameOf(r.name)}</span>
                      </span>
                      <span className="shrink-0 text-[12.5px] tabular-nums text-slate-600">{r.detail}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardShell>

        {/* Pendientes de configuración */}
        <CardShell
          title={t("setup.title")}
          className="xl:basis-[29%]"
          right={
            setupBlocks.length > 0 ? (
              <StatusPill tone="danger">{t("setup.pending", { count: setupBlocks.length })}</StatusPill>
            ) : undefined
          }
        >
          <div className="flex flex-1 flex-col gap-2.5">
            {setupBlocks.map((b) => (
              <AttentionBlock
                key={b.key}
                value={b.value}
                title={b.title}
                subtitle={b.subtitle}
                action={b.action}
                onAction={b.onAction}
                bg="#fef1e3"
                color="#f97316"
              />
            ))}
            {setupBlocks.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-3 py-6 text-center" style={{ background: "#e6f4ea" }}>
                <b className="text-[14px] font-semibold" style={{ color: GREEN }}>{t("setup.allDone")}</b>
                <span className="text-[12px] text-slate-600">{t("setup.allDoneHint")}</span>
              </div>
            )}
          </div>
        </CardShell>

        {/* En sitio */}
        <CardShell
          title={t("access.onSite")}
          className="xl:basis-[27%]"
          right={<span className="text-[13px] text-slate-600">{t("access.onSiteCount", { count: onSiteRows.length })}</span>}
        >
          {onSiteRows.length === 0 ? (
            <Empty text={t("access.nobodyInside")} />
          ) : (
            <div className="max-h-[260px] overflow-auto" style={{ borderTop: "1px solid #eef1f5" }}>
              {onSiteRows.map((p) => (
                <div key={p.employeeId} className="flex items-center justify-between gap-3 py-1.5" style={{ borderBottom: "1px solid #f3f5f8" }}>
                  <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-slate-800">
                    <InitialsAvatar name={p.name ?? "—"} size={28} />
                    <span className="truncate">{nameOf(p.name)}</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] tabular-nums text-slate-600">{time(p.since)}</span>
                </div>
              ))}
            </div>
          )}
        </CardShell>
      </div>

      {/* Últimos registros */}
      <CardShell
        title={t("access.latest")}
        right={
          openLog ? (
            <button type="button" onClick={openLog} className={linkCls}>
              {t("access.viewLog")}
            </button>
          ) : undefined
        }
      >
        {latest.length === 0 ? (
          <Empty text={t("access.noRecords")} />
        ) : (
          <div className="max-h-[352px] overflow-auto" style={{ borderTop: "1px solid #eef1f5" }}>
            {latest.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: "1px solid #f3f5f8" }}>
                <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-slate-800">
                  <InitialsAvatar name={e.name ?? "—"} size={28} />
                  <span className="truncate">{nameOf(e.name)}</span>
                  <StatusPill tone={e.type === "ENTRY" ? "success" : "warning"}>{t(`access.${e.type}`)}</StatusPill>
                  {e.site && <span className="hidden truncate text-[12.5px] text-slate-500 sm:inline">{e.site}</span>}
                </span>
                <span className="shrink-0 text-[12.5px] tabular-nums text-slate-600">{time(e.at)}</span>
              </div>
            ))}
          </div>
        )}
      </CardShell>
    </div>
  );
}
