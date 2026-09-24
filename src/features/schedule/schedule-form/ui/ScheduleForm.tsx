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
import { scheduleApi, type HorarioDiaInput, type HorarioInput } from "@entities/schedule";
import { dyn } from "@shared/i18n/dyn";
import { useIsMobile } from "@shared/lib/useIsMobile";
import { formatMinutesAsHhMm } from "@shared/utils/dates";
import { dayMinutes, daysWorked, restDays, weeklyMinutes } from "../model/summary";

const emptyDays = (): HorarioDiaInput[] =>
  [1, 2, 3, 4, 5, 6, 7].map((diaSemana) => ({
    diaSemana,
    entrada: "08:00",
    salida: "16:00",
    entrada2: null,
    salida2: null,
    descanso: diaSemana === 7,
  }));

const emptyForm = (): HorarioInput => ({
  nombre: "",
  toleranciaEntradaMin: 10,
  toleranciaSalidaMin: 10,
  comidaMin: 0,
  minimoExtraMin: 60,
  cruzaMedianoche: false,
  dias: emptyDays(),
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

  const [form, setForm] = useState<HorarioInput>(emptyForm());
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
          setError("Horario no encontrado");
          return;
        }
        setForm({
          nombre: h.nombre,
          toleranciaEntradaMin: h.toleranciaEntradaMin,
          toleranciaSalidaMin: h.toleranciaSalidaMin,
          comidaMin: h.comidaMin,
          minimoExtraMin: h.minimoExtraMin,
          cruzaMedianoche: h.cruzaMedianoche,
          dias: h.dias.map((d) => ({
            diaSemana: d.diaSemana,
            entrada: d.entrada,
            salida: d.salida,
            entrada2: d.entrada2,
            salida2: d.salida2,
            descanso: d.descanso,
          })),
        });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const setDay = (diaSemana: number, patch: Partial<HorarioDiaInput>) => {
    setForm((f) => ({
      ...f,
      dias: f.dias.map((d) => (d.diaSemana === diaSemana ? { ...d, ...patch } : d)),
    }));
  };

  const save = async () => {
    if (!form.nombre.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) await scheduleApi.update(id!, form);
      else await scheduleApi.create(form);
      setToast(t("save"));
      setTimeout(() => navigate("/horarios"), 500);
    } catch (e) {
      setError((e as Error).message ?? t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(
    () => ({
      days: daysWorked(form.dias),
      rest: restDays(form.dias),
      weekly: weeklyMinutes(form.dias, form.comidaMin ?? 0),
    }),
    [form.dias, form.comidaMin]
  );

  if (loading) {
    return (
      <ITFlex justify="center" className="py-10">
        <ITLoader variant="spinner" size="lg" color="primary" />
      </ITFlex>
    );
  }

  const dayLabel = (n: number) => dyn(t)(`day${n}`);
  const hasSecond = (d: HorarioDiaInput) => Boolean(d.entrada2 || d.salida2);

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
        onCancel={() => navigate("/horarios")}
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
                name="nombre"
                label={t("name")}
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
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
                label={t("tolEntrada")}
                value={String(form.toleranciaEntradaMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, toleranciaEntradaMin: Number(e.target.value) }))}
              />
              <ITInput
                name="tolSalida"
                type="number"
                label={t("tolSalida")}
                value={String(form.toleranciaSalidaMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, toleranciaSalidaMin: Number(e.target.value) }))}
              />
            </ITFlex>
          </ITGrid>

          <ITGrid item xs={12} md={4} className="md:border-l md:border-slate-100 md:pl-5">
            <ITFlex direction="column" gap={3}>
              <ITText className={sectionLabel}>{t("sections.workday")}</ITText>
              <ITInput
                name="comida"
                type="number"
                label={t("comida")}
                value={String(form.comidaMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, comidaMin: Number(e.target.value) }))}
              />
              <ITCheckbox
                name="cruzaMedianoche"
                label={t("crossesMidnight")}
                checked={!!form.cruzaMedianoche}
                onChange={(v) => setForm((f) => ({ ...f, cruzaMedianoche: v }))}
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
                value={String(form.minimoExtraMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, minimoExtraMin: Number(e.target.value) }))}
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

          {form.dias.map((d) => (
            <ITFlex
              key={d.diaSemana}
              direction="column"
              gap={2}
              className={`rounded-xl px-3 py-3 transition-colors ${
                d.descanso ? "bg-slate-50/80" : "hover:bg-slate-50/60"
              }`}
            >
              <ITGrid container columns={12} spacing={3} className="items-end">
                <ITGrid item xs={12} md={2}>
                  <ITFlex align="center" gap={2}>
                    <ITText
                      className={`text-[12px] font-black ${d.descanso ? "text-slate-400" : "text-slate-700"}`}
                    >
                      {dayLabel(d.diaSemana)}
                    </ITText>
                    {d.descanso && (
                      <ITBadget color="gray" size="sm">
                        {t("rest")}
                      </ITBadget>
                    )}
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  {!isMobile && (
                    <label htmlFor={`entrada-${d.diaSemana}`} className="sr-only">
                      {t("entry")}
                    </label>
                  )}
                  <ITTimePicker
                    name={`entrada-${d.diaSemana}`}
                    label={isMobile ? t("entry") : undefined}
                    value={d.entrada ?? ""}
                    onChange={(e: { target: { value: string } }) => setDay(d.diaSemana, { entrada: e.target.value })}
                    disabled={d.descanso}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  {!isMobile && (
                    <label htmlFor={`salida-${d.diaSemana}`} className="sr-only">
                      {t("exit")}
                    </label>
                  )}
                  <ITTimePicker
                    name={`salida-${d.diaSemana}`}
                    label={isMobile ? t("exit") : undefined}
                    value={d.salida ?? ""}
                    onChange={(e: { target: { value: string } }) => setDay(d.diaSemana, { salida: e.target.value })}
                    disabled={d.descanso}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITFlex align="center" className="pb-2">
                    <ITCheckbox
                      name={`second-${d.diaSemana}`}
                      label={t("second")}
                      checked={hasSecond(d)}
                      onChange={(v) =>
                        setDay(d.diaSemana, {
                          entrada2: v ? d.entrada2 ?? "16:00" : null,
                          salida2: v ? d.salida2 ?? "20:00" : null,
                        })
                      }
                      disabled={d.descanso}
                    />
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITFlex align="center" className="pb-2">
                    <ITCheckbox
                      name={`rest-${d.diaSemana}`}
                      label={t("rest")}
                      checked={!!d.descanso}
                      onChange={(v) =>
                        setDay(d.diaSemana, {
                          descanso: v,
                          ...(v ? { entrada2: null, salida2: null } : {}),
                        })
                      }
                    />
                  </ITFlex>
                </ITGrid>
                <ITGrid item xs={12} md={2}>
                  <ITText className="text-[11px] font-bold text-slate-500">
                    {d.descanso ? "—" : formatMinutesAsHhMm(dayMinutes(d, form.comidaMin ?? 0))}
                  </ITText>
                </ITGrid>
              </ITGrid>

              {hasSecond(d) && !d.descanso && (
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
                        <label htmlFor={`entrada2-${d.diaSemana}`} className="sr-only">
                          {t("entry")}
                        </label>
                      )}
                      <ITTimePicker
                        name={`entrada2-${d.diaSemana}`}
                        label={isMobile ? t("entry") : undefined}
                        value={d.entrada2 ?? ""}
                        onChange={(e: { target: { value: string } }) =>
                          setDay(d.diaSemana, { entrada2: e.target.value || null })
                        }
                      />
                    </ITGrid>
                    <ITGrid item xs={6} md={2}>
                      {!isMobile && (
                        <label htmlFor={`salida2-${d.diaSemana}`} className="sr-only">
                          {t("exit")}
                        </label>
                      )}
                      <ITTimePicker
                        name={`salida2-${d.diaSemana}`}
                        label={isMobile ? t("exit") : undefined}
                        value={d.salida2 ?? ""}
                        onChange={(e: { target: { value: string } }) =>
                          setDay(d.diaSemana, { salida2: e.target.value || null })
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
