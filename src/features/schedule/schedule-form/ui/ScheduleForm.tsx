import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
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
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { scheduleApi, type HorarioDiaInput, type HorarioInput } from "@entities/schedule";
import { dyn } from "@shared/i18n/dyn";

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
  cruzaMedianoche: false,
  dias: emptyDays(),
});

export default function ScheduleForm({ id }: { id?: string }) {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();
  const isEdit = Boolean(id);

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

  if (loading) {
    return (
      <ITFlex justify="center" className="py-10">
        <ITLoader variant="spinner" size="lg" color="primary" />
      </ITFlex>
    );
  }

  const dayLabel = (n: number) => dyn(t)(`day${n}`);
  const hasSecond = (d: HorarioDiaInput) => Boolean(d.entrada2 || d.salida2);

  return (
    <ITFlex direction="column" gap={4}>
      {/* Acciones arriba */}
      <ITFlex justify="end" gap={2}>
        <ITButton variant="outlined" color="secondary" onClick={() => navigate("/horarios")}>
          {t("cancel")}
        </ITButton>
        <ITButton variant="filled" color="primary" onClick={save} disabled={saving}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{t("save")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={4}>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={6}>
              <ITInput
                name="nombre"
                label={t("name")}
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </ITGrid>
            <ITGrid item xs={4} md={2}>
              <ITInput
                name="tolEntrada"
                type="number"
                label={t("tolEntrada")}
                value={String(form.toleranciaEntradaMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, toleranciaEntradaMin: Number(e.target.value) }))}
              />
            </ITGrid>
            <ITGrid item xs={4} md={2}>
              <ITInput
                name="tolSalida"
                type="number"
                label={t("tolSalida")}
                value={String(form.toleranciaSalidaMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, toleranciaSalidaMin: Number(e.target.value) }))}
              />
            </ITGrid>
            <ITGrid item xs={4} md={2}>
              <ITInput
                name="comida"
                type="number"
                label={t("comida")}
                value={String(form.comidaMin ?? 0)}
                onChange={(e) => setForm((f) => ({ ...f, comidaMin: Number(e.target.value) }))}
              />
            </ITGrid>
          </ITGrid>

          <ITFlex align="center" gap={4} wrap="wrap">
            <ITCheckbox
              name="cruzaMedianoche"
              label={t("crossesMidnight")}
              checked={!!form.cruzaMedianoche}
              onChange={(v) => setForm((f) => ({ ...f, cruzaMedianoche: v }))}
            />
          </ITFlex>
        </ITFlex>
      </ITCard>

      <ITCard title={t("days")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITText className="text-[11px] text-slate-400">{t("secondHint")}</ITText>

          {form.dias.map((d) => (
            <ITFlex
              key={d.diaSemana}
              direction="column"
              gap={2}
              className="border-b border-slate-100 pb-3 last:border-0"
            >
              <ITGrid container columns={12} spacing={3} className="items-end">
                <ITGrid item xs={12} md={2}>
                  <ITText className="text-[12px] font-bold text-slate-600">
                    {dayLabel(d.diaSemana)}
                  </ITText>
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITTimePicker
                    name={`entrada-${d.diaSemana}`}
                    label={t("entry")}
                    value={d.entrada ?? ""}
                    onChange={(e: { target: { value: string } }) => setDay(d.diaSemana, { entrada: e.target.value })}
                    disabled={d.descanso}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITTimePicker
                    name={`salida-${d.diaSemana}`}
                    label={t("exit")}
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
              </ITGrid>

              {hasSecond(d) && !d.descanso && (
                <ITGrid container columns={12} spacing={3} className="items-end">
                  <ITGrid item xs={12} md={2} />
                  <ITGrid item xs={6} md={2}>
                    <ITTimePicker
                      name={`entrada2-${d.diaSemana}`}
                      label={t("entry")}
                      value={d.entrada2 ?? ""}
                      onChange={(e: { target: { value: string } }) => setDay(d.diaSemana, { entrada2: e.target.value || null })}
                    />
                  </ITGrid>
                  <ITGrid item xs={6} md={2}>
                    <ITTimePicker
                      name={`salida2-${d.diaSemana}`}
                      label={t("exit")}
                      value={d.salida2 ?? ""}
                      onChange={(e: { target: { value: string } }) => setDay(d.diaSemana, { salida2: e.target.value || null })}
                    />
                  </ITGrid>
                </ITGrid>
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
