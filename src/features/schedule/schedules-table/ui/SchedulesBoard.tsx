import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBentoGrid, ITBentoTile, ITButton, ITConfirmDialog, ITInput } from "@axzydev/axzy_ui_system";
import { LuCalendarDays, LuClock, LuPencil, LuSearch, LuTrash2, LuUsers } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { scheduleApi, type Schedule, type ScheduleDay } from "@entities/schedule";
import { LangostinState } from "@shared/ui/langostin";
import { FilterPills } from "@shared/ui/filter-pills";
import { MiniStat } from "@shared/ui/bento-bits";
import { dateLocale } from "@shared/i18n";

type Filter = "all" | "active" | "inactive";

// Inicial de cada día (lunes = 1), en el idioma de la interfaz. 2024-01-01 fue lunes.
const dayAbbr = (weekday: number): string =>
  new Date(Date.UTC(2024, 0, weekday)).toLocaleDateString(dateLocale(), { weekday: "narrow", timeZone: "UTC" });

/** Minutos de una jornada, descontando comida y sumando el segundo tramo. */
function dayMinutes(d: ScheduleDay, mealBreakMin: number): number {
  if (d.restDay || !d.startTime || !d.endTime) return 0;
  const toMin = (v: string) => Number(v.split(":")[0]) * 60 + Number(v.split(":")[1]);
  const span = toMin(d.endTime) - toMin(d.startTime);
  const second = d.splitStartTime && d.splitEndTime ? toMin(d.splitEndTime) - toMin(d.splitStartTime) : 0;
  return Math.max(0, (span > 0 ? span : span + 1440) + second - mealBreakMin);
}

/** "08:00–16:00 · descanso 14:00–15:00" del primer día laborable. */
function daySummary(days: ScheduleDay[]): string {
  const first = [...days].sort((a, b) => a.weekday - b.weekday).find((d) => !d.restDay);
  if (!first?.startTime || !first.endTime) return "—";
  const split = first.splitStartTime && first.splitEndTime ? ` · ${first.splitStartTime}–${first.splitEndTime}` : "";
  return `${first.startTime}–${first.endTime}${split}`;
}

/**
 * Horarios como tablero de tarjetas (plantilla P7): cada horario es un mosaico
 * con su semana en barras (horas reales por día), sus reglas, cuántas personas
 * lo tienen asignado y las acciones de editar / dar de baja.
 */
export default function SchedulesBoard() {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();
  const [rows, setRows] = useState<Schedule[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [toDeactivate, setToDeactivate] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    scheduleApi
      .list(true)
      .then((data) => {
        setRows(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  };

  useEffect(load, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter((h) => {
      if (filter === "active" && !h.active) return false;
      if (filter === "inactive" && h.active) return false;
      if (!q) return true;
      return h.name.toLowerCase().includes(q);
    });
  }, [rows, query, filter]);

  const totals = useMemo(() => {
    const list = rows ?? [];
    return {
      total: list.length,
      active: list.filter((h) => h.active).length,
      assigned: list.reduce((acc, h) => acc + (h.assigned ?? 0), 0),
    };
  }, [rows]);

  const toggleActive = async (h: Schedule) => {
    await scheduleApi.update(h.id, { active: !h.active });
    load();
  };

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    setSaving(true);
    try {
      await scheduleApi.update(toDeactivate.id, { active: false });
      load();
    } finally {
      setSaving(false);
      setToDeactivate(null);
    }
  };

  if (failed) return <LangostinState kind="error" />;
  if (!rows) return <LangostinState kind="loading" />;

  return (
    <div className="flex flex-col gap-4">
      {/* Franja de resumen: totales reales, clic = filtra */}
      <ITBentoGrid>
        <ITBentoTile
          cols={4}
          rows={2}
          wide
          icon={<LuCalendarDays size={15} />}
          label={t("summary.total")}
          value={totals.total}
          caption={t("summary.totalCaption")}
          onClick={() => setFilter("all")}
        />
        <ITBentoTile
          cols={4}
          rows={2}
          wide
          tone="mint"
          icon={<LuClock size={15} />}
          label={t("summary.active")}
          value={totals.active}
          caption={t("summary.activeCaption")}
          onClick={() => setFilter("active")}
        />
        <ITBentoTile
          cols={4}
          rows={2}
          wide
          tone="sun"
          icon={<LuUsers size={15} />}
          label={t("summary.assigned")}
          value={totals.assigned}
          caption={t("summary.assignedCaption")}
          onClick={() => navigate("/schedules/assign")}
        />
      </ITBentoGrid>

      {/* Filtros en una fila */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[240px] flex-1">
          <ITInput
            name="schedules_search"
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            iconLeft={<LuSearch size={12} />}
          />
        </div>
        <FilterPills
          items={[
            { id: "all" as const, label: t("filter.all") },
            { id: "active" as const, label: t("active") },
            { id: "inactive" as const, label: t("inactive") },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {visible.length === 0 ? (
        <LangostinState kind="empty" title={t("emptyTitle")} description={t("emptyHint")} />
      ) : (
        <ITBentoGrid>
          {visible.map((h) => {
            const week = [...h.days]
              .sort((a, b) => a.weekday - b.weekday)
              .map((d) => ({
                label: dayAbbr(d.weekday),
                value: Math.round(dayMinutes(d, h.mealBreakMin) / 60),
                tone: d.restDay ? ("future" as const) : ("past" as const),
              }));
            const weekly = week.reduce((acc, d) => acc + d.value, 0);
            const worked = h.days.filter((d) => !d.restDay).length;

            return (
              <ITBentoTile
                key={h.id}
                cols={4}
                rows={3}
                icon={<LuCalendarDays size={15} />}
                label={h.name}
                value={`${weekly} h`}
                caption={t("weekHours")}
                aside={
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: h.active ? "color-mix(in srgb, var(--color-success) 14%, transparent)" : "color-mix(in srgb, var(--color-text-muted) 14%, transparent)",
                      color: h.active ? "var(--color-success)" : "var(--color-text-muted)",
                    }}
                  >
                    {h.active ? t("active") : t("inactive")}
                  </span>
                }
              >
                <div className="mt-2 grid flex-1 grid-cols-2 gap-2">
                  <MiniStat label={t("daysWorked")} value={worked} color="var(--color-primary-500)" />
                  <MiniStat label={t("assignedLabel")} value={h.assigned ?? 0} color="var(--color-violet-500)" />
                </div>

                {/* Semana en barras: horas reales por día */}
                <div className="mt-2 flex items-end gap-1" aria-hidden="true">
                  {week.map((d) => {
                    const max = Math.max(1, ...week.map((x) => x.value));
                    return (
                      <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                        <i
                          className="w-full rounded-t-[4px] rounded-b-[2px]"
                          style={{
                            height: `${d.value === 0 ? 4 : Math.max(8, (d.value / max) * 26)}px`,
                            background: d.value === 0 ? "color-mix(in srgb, currentColor 12%, transparent)" : "var(--color-primary-500)",
                          }}
                        />
                        <span className="text-[9.5px]" style={{ color: "var(--it-bento-muted)" }}>
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="m-0 mt-2 text-[11px]" style={{ color: "var(--it-bento-muted)" }}>
                  {daySummary(h.days)} · E{h.entryToleranceMin}/S{h.exitToleranceMin} · {t("meal")} {h.mealBreakMin} · {t("minExtra")} {h.minOvertimeMin}
                </p>

                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={() => navigate(`/schedules/${h.id}/edit`)} title={t("edit")}>
                    <LuPencil size={12} />
                  </ITButton>
                  <ITButton
                    variant="outlined"
                    color={h.active ? "error" : "success"}
                    size="sm"
                    title={h.active ? t("delete") : t("reactivate")}
                    onClick={() => (h.active ? setToDeactivate(h) : void toggleActive(h))}
                  >
                    <LuTrash2 size={12} />
                  </ITButton>
                </div>
              </ITBentoTile>
            );
          })}
        </ITBentoGrid>
      )}

      <ITConfirmDialog
        isOpen={!!toDeactivate}
        onClose={() => setToDeactivate(null)}
        onConfirm={() => void confirmDeactivate()}
        title={t("deactivateDialog.title")}
        message={t("deactivateDialog.message", { name: toDeactivate?.name ?? "" })}
        confirmLabel={t("deactivateDialog.confirm")}
        cancelLabel={t("cancel")}
        loading={saving}
      />
    </div>
  );
}
