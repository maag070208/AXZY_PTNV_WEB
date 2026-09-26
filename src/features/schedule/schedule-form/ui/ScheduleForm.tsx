import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITText,
  ITTimePicker,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaBed, FaCalendarCheck, FaClock, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { scheduleApi, type ScheduleDayInput, type ScheduleInput } from "@entities/schedule";
import { dyn } from "@shared/i18n/dyn";
import { useIsMobile } from "@shared/lib/useIsMobile";
import { formatMinutesAsHhMm } from "@shared/utils/dates";
import { dayMinutes, daysWorked, restDays, weeklyMinutes } from "../model/summary";
import { i18n } from "@shared/i18n";

const emptyDays = (): ScheduleDayInput[] =>
  [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    startTime: "08:00",
    endTime: "16:00",
    splitStartTime: null,
    splitEndTime: null,
    restDay: weekday === 7,
  }));

const emptyForm = (): ScheduleInput => ({
  name: "",
  entryToleranceMin: 10,
  exitToleranceMin: 10,
  mealBreakMin: 0,
  minOvertimeMin: 60,
  crossesMidnight: false,
  days: emptyDays(),
});

function ActionBar({
  saving,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
}: {
  saving: boolean;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <ITFlex justify="end" gap={2}>
      <ITButton variant="outlined" color="secondary" onClick={onCancel}>
        {cancelLabel}
      </ITButton>
      <ITButton variant="filled" color="primary" onClick={onSave} disabled={saving}>
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">{saveLabel}</ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );
}

export default function ScheduleForm({ id }: { id?: string }) {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const isMobile = useIsMobile();

  const [form, setForm] = useState<ScheduleInput>(emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    scheduleApi
      .list(true)
      .then((rows) => {
        const h = rows.find((x) => x.id === id);
        if (!h) {
          setError(i18n.t("schedules:form.notFound"));
          return;
        }
        setForm({
          name: h.name,
          entryToleranceMin: h.entryToleranceMin,
          exitToleranceMin: h.exitToleranceMin,
          mealBreakMin: h.mealBreakMin,
          minOvertimeMin: h.minOvertimeMin,
          crossesMidnight: h.crossesMidnight,
          days: h.days.map((d) => ({
            weekday: d.weekday,
            startTime: d.startTime,
            endTime: d.endTime,
            splitStartTime: d.splitStartTime,
            splitEndTime: d.splitEndTime,
            restDay: d.restDay,
          })),
        });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const setDay = (weekday: number, patch: Partial<ScheduleDayInput>) => {
    setForm((f) => ({
      ...f,
      days: f.days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) await scheduleApi.update(id!, form);
      else await scheduleApi.create(form);
      setToast(t("save"));
      setTimeout(() => navigate("/schedules"), 500);
    } catch (e) {
      setError((e as Error).message ?? t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(
    () => ({
      days: daysWorked(form.days),
      rest: restDays(form.days),
      weekly: weeklyMinutes(form.days, form.mealBreakMin ?? 0),
    }),
    [form.days, form.mealBreakMin]
  );

  if (loading) {
    return (
      <ITFlex justify="center" className="py-10">
        <ITLoader variant="spinner" size="lg" color="primary" />
      </ITFlex>
    );
  }

  const dayLabel = (n: number) => dyn(t)(`day${n}`);
  const hasSecond = (d: ScheduleDayInput) => Boolean(d.splitStartTime || d.splitEndTime);

  const summaryKpis = [
    {
      key: "days",
      value: `${summary.days}/7`,
      tint: "bg-sky-50 text-sky-600",
      icon: <FaCalendarCheck size={15} />,
    },
    {
      key: "weeklyHours",
      value: formatMinutesAsHhMm(summary.weekly),
      tint: "bg-emerald-50 text-emerald-600",
      icon: <FaClock size={15} />,
    },
    {
      key: "restDays",
      value: String(summary.rest),
      tint: "bg-slate-100 text-slate-500",
      icon: <FaBed size={15} />,
    },
  ];

  const sectionLabel = "text-[10px] font-black uppercase tracking-widest text-slate-400";

  return (
    <ITFlex direction="column" gap={4}>
      {/* Acciones arriba */}
      <ActionBar
        saving={saving}
        cancelLabel={t("cancel")}
        saveLabel={t("save")}
        onCancel={() => navigate("/schedules")}
        onSave={save}
      />

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {/* Datos + resumen */}
      <ITCard className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={4}>
          <ITText className={sectionLabel}>{t("sections.general")}</ITText>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={6}>
              <ITInput
                name="name"
                label={t("name")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </ITGrid>
          </ITGrid>

          <ITFlex wrap="wrap" gap={3}>
            {summaryKpis.map((k) => (
              <ITFlex
                key={k.key}
                grow={1}
                basis="180px"
                align="center"
                gap={3}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <ITFlex
                  align="center"
                  justify="center"
                  className={`h-10 w-10 shrink-0 rounded-xl ${k.tint}`}
                >
                  {k.icon}
                </ITFlex>
                <ITFlex direction="column" gap={0} className="min-w-0">
                  <ITText className="text-xl font-black leading-none text-slate-800">{k.value}</ITText>
                  <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {dyn(t)(`summary.${k.key}`)}
                  </ITText>
                </ITFlex>
              </ITFlex>
            ))}
          </ITFlex>
        </ITFlex>
      </ITCard>

      {/* Reglas de jornada */}
      <ITCard title={t("sections.rules")} className="!p-5 border border-slate-200">
        <ITGrid container columns={12} spacing={5}>
          <ITGrid item xs={12} md={4}>
            <ITFlex direction="column" gap={3}>
              <ITText className={sectionLabel}>{t("sections.tolerances")}</ITText>
              <ITInput
                name="tolEntrada"
                type="number"
                label={t("tolEntry")}
                value={String(form.entryToleranceMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, entryToleranceMin: Number(e.target.value) }))}
              />
              <ITInput
                name="tolSalida"
                type="number"
                label={t("tolExit")}
                value={String(form.exitToleranceMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, exitToleranceMin: Number(e.target.value) }))}
              />
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} md={4} className="md:border-l md:border-slate-100 md:pl-5">
            <ITFlex direction="column" gap={3}>
              <ITText className={sectionLabel}>{t("sections.workday")}</ITText>
              <ITInput
                name="mealBreak"
                type="number"
                label={t("meal")}
                value={String(form.mealBreakMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, mealBreakMin: Number(e.target.value) }))}
              />
              <ITCheckbox
                name="crossesMidnight"
                label={t("crossesMidnight")}
                checked={!!form.crossesMidnight}
                onChange={(v) => setForm((f) => ({ ...f, crossesMidnight: v }))}
              />
              <ITText className="text-[11px] text-slate-400">{t("crossesMidnightHint")}</ITText>
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} md={4} className="md:border-l md:border-slate-100 md:pl-5">
            <ITFlex direction="column" gap={3}>
              <ITText className={sectionLabel}>{t("sections.overtime")}</ITText>
              <ITInput
                name="minExtra"
                type="number"
                label={t("minExtra")}
                value={String(form.minOvertimeMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, minOvertimeMin: Number(e.target.value) }))}
              />
              <ITText className="text-[11px] text-slate-500">{t("minExtraHint")}</ITText>
            </ITFlex>
          </ITGrid>
        </ITGrid>
      </ITCard>

      {/* Rejilla semanal */}
      <ITCard title={t("sections.weekly")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITText className="text-[11px] text-slate-400">{t("secondHint")}</ITText>

          <ITGrid
            container
            columns={12}
            spacing={3}
            className="hidden md:grid px-3 items-end border-b border-slate-100 pb-2"
          >
            {["colDay", "entry", "exit", "second", "rest", "colHours"].map((key) => (
              <ITGrid key={key} item md={2}>
                <ITText className={sectionLabel}>{dyn(t)(key)}</ITText>
              </ITGrid>
            ))}
          </ITGrid>

          {form.days.map((d) => (
            <ITFlex
              key={d.weekday}
              direction="column"
              gap={2}
              className={`rounded-xl px-3 py-3 transition-colors ${
                d.restDay ? "bg-slate-50/80" : "hover:bg-slate-50/60"
              }`}
            >
              <ITGrid container columns={12} spacing={3} className="items-end">
                <ITGrid item xs={12} md={2}>
                  <ITFlex align="center" gap={2}>
                    <ITText
                      className={`text-[12px] font-black ${d.restDay ? "text-slate-400" : "text-slate-700"}`}
                    >
                      {dayLabel(d.weekday)}
                    </ITText>
                    {d.restDay && (
                      <ITBadget color="gray" size="sm">
                        {t("rest")}
                      </ITBadget>
                    )}
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  {!isMobile && (
                    <label htmlFor={`start-${d.weekday}`} className="sr-only">
                      {t("entry")}
                    </label>
                  )}
                  <ITTimePicker
                    name={`start-${d.weekday}`}
                    label={isMobile ? t("entry") : undefined}
                    value={d.startTime ?? ""}
                    onChange={(e: { target: { value: string } }) => setDay(d.weekday, { startTime: e.target.value })}
                    disabled={d.restDay}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  {!isMobile && (
                    <label htmlFor={`end-${d.weekday}`} className="sr-only">
                      {t("exit")}
                    </label>
                  )}
                  <ITTimePicker
                    name={`end-${d.weekday}`}
                    label={isMobile ? t("exit") : undefined}
                    value={d.endTime ?? ""}
                    onChange={(e: { target: { value: string } }) => setDay(d.weekday, { endTime: e.target.value })}
                    disabled={d.restDay}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITFlex align="center" className="pb-2">
                    <ITCheckbox
                      name={`second-${d.weekday}`}
                      label={t("second")}
                      checked={hasSecond(d)}
                      onChange={(v) =>
                        setDay(d.weekday, {
                          splitStartTime: v ? d.splitStartTime ?? "16:00" : null,
                          splitEndTime: v ? d.splitEndTime ?? "20:00" : null,
                        })
                      }
                      disabled={d.restDay}
                    />
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITFlex align="center" className="pb-2">
                    <ITCheckbox
                      name={`rest-${d.weekday}`}
                      label={t("rest")}
                      checked={!!d.restDay}
                      onChange={(v) =>
                        setDay(d.weekday, {
                          restDay: v,
                          ...(v ? { splitStartTime: null, splitEndTime: null } : {}),
                        })
                      }
                    />
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={12} md={2}>
                  <ITText className="text-[11px] font-bold text-slate-500">
                    {d.restDay ? "—" : formatMinutesAsHhMm(dayMinutes(d, form.mealBreakMin ?? 0))}
                  </ITText>
                </ITGrid>
              </ITGrid>

              {hasSecond(d) && !d.restDay && (
                <div className="md:ml-3 md:border-l-2 md:border-[#0D5777]/30 md:pl-3">
                  <ITGrid container columns={12} spacing={3} className="items-end mt-2">
                    <ITGrid item xs={12} md={2}>
                      <ITFlex align="center" gap={2} className="md:justify-end">
                        <FaClock size={10} className="text-[#0D5777]" />
                        <ITText className={sectionLabel}>{t("second")}</ITText>
                      </ITFlex>
                    </ITGrid>
                    <ITGrid item xs={6} md={2}>
                      {!isMobile && (
                        <label htmlFor={`splitStart-${d.weekday}`} className="sr-only">
                          {t("entry")}
                        </label>
                      )}
                      <ITTimePicker
                        name={`splitStart-${d.weekday}`}
                        label={isMobile ? t("entry") : undefined}
                        value={d.splitStartTime ?? ""}
                        onChange={(e: { target: { value: string } }) =>
                          setDay(d.weekday, { splitStartTime: e.target.value || null })
                        }
                      />
                    </ITGrid>
                    <ITGrid item xs={6} md={2}>
                      {!isMobile && (
                        <label htmlFor={`splitEnd-${d.weekday}`} className="sr-only">
                          {t("exit")}
                        </label>
                      )}
                      <ITTimePicker
                        name={`splitEnd-${d.weekday}`}
                        label={isMobile ? t("exit") : undefined}
                        value={d.splitEndTime ?? ""}
                        onChange={(e: { target: { value: string } }) =>
                          setDay(d.weekday, { splitEndTime: e.target.value || null })
                        }
                      />
                    </ITGrid>
                  </ITGrid>
                </div>
              )}
            </ITFlex>
          ))}
        </ITFlex>
      </ITCard>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="bottom-center"
          duration={2000}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
