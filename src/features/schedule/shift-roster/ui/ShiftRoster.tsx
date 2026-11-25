import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITCard,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { LuChevronLeft, LuChevronRight, LuCircleHelp, LuCopy, LuPlus, LuSave, LuUndo2, LuX } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useBlocker } from "react-router-dom";
import { useCan } from "@entities/user";
import { dateLocale } from "@shared/i18n";
import { LangostinState } from "@shared/ui/langostin";
import { ConfirmDialog } from "@shared/ui/confirm-dialog";
import { REST_VALUE, cellKey, useShiftRoster } from "../model/useShiftRoster";
import { BASE_TONE, REST_TONE, buildToneMap, type Tone } from "../model/shiftColors";
import NewShiftDialog from "./NewShiftDialog";
import BulkAssignPanel from "./BulkAssignPanel";
import RosterRow from "./RosterRow";
import RosterHelpDialog from "./RosterHelpDialog";
import HelpHint from "./HelpHint";

const HELP_KEY = "roster.helpSeen";

const dayHeader = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    name: d.toLocaleDateString(dateLocale(), { weekday: "short", timeZone: "UTC" }),
    date: d.toLocaleDateString(dateLocale(), { day: "2-digit", month: "2-digit", timeZone: "UTC" }),
  };
};

/**
 * Rol semanal: empleados × 7 días; cada celda elige el turno de esa fecha
 * (anula el horario base). Edición solo con `schedules.manage`.
 */
export default function ShiftRoster() {
  const { t } = useTranslation(["schedules", "common"]);
  const canManage = useCan("schedules.manage");
  const fx = useShiftRoster();
  const [newShiftOpen, setNewShiftOpen] = useState(false);
  const [tab, setTab] = useState<"bulk" | "grid">("grid");
  const [helpOpen, setHelpOpen] = useState(false);
  const [copyConfirm, setCopyConfirm] = useState(false);
  /** Acción pendiente que descartaría cambios sin guardar. */
  const [pending, setPending] = useState<(() => void) | null>(null);

  // Primera visita: abre la guía una sola vez.
  useEffect(() => {
    try {
      if (!localStorage.getItem(HELP_KEY)) {
        localStorage.setItem(HELP_KEY, "1");
        setHelpOpen(true);
      }
    } catch {
      /* sin localStorage: no se muestra automáticamente */
    }
  }, []);

  // Aviso del navegador al cerrar/recargar con cambios sin guardar.
  useEffect(() => {
    if (!fx.dirtyCount) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fx.dirtyCount]);

  // Aviso al cambiar de pantalla dentro de la app con cambios sin guardar.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => fx.dirtyCount > 0 && currentLocation.pathname !== nextLocation.pathname
  );

  /** Ejecuta la acción; si hay cambios sin guardar pide confirmar primero. */
  const guard = (action: () => void) => (fx.dirtyCount ? setPending(() => action) : action());

  const editable = canManage && !fx.closed;
  const week = fx.week;
  // Sin permiso o con semana cerrada solo existe la cuadrícula (lectura).
  const showBulk = editable && tab === "bulk";
  const showGrid = !showBulk;

  const handleRange = (e: { target: { value: unknown } }) => {
    const value = e.target.value;
    if (Array.isArray(value) && value[0] instanceof Date) {
      const picked = value[0];
      guard(() => fx.setWeekDate(picked));
    }
  };

  const tones = useMemo(() => buildToneMap(fx.schedules.map((s) => s.id)), [fx.schedules]);
  const byId = useMemo(() => new Map(fx.schedules.map((s) => [s.id, s])), [fx.schedules]);

  // Como en la guía: siempre hay un pincel elegido (el primer turno) para pintar de inmediato.
  useEffect(() => {
    if (fx.brush === null && fx.schedules.length) fx.setBrush(fx.schedules[0].id);
  }, [fx.brush, fx.schedules]); // eslint-disable-line react-hooks/exhaustive-deps

  // Siempre apunta a la última versión del estado: los handlers de abajo son estables.
  const latest = useRef(fx);
  latest.current = fx;
  const stroke = useRef<{ last: string | null; start: Record<string, string> } | null>(null);

  const paintPerson = useCallback((userId: string) => {
    const f = latest.current;
    if (f.brush === null) return;
    const person = f.week?.people.find((p) => p.userId === userId);
    if (person) f.paintCells(person.cells.map((c) => cellKey(userId, c.date)), f.brush);
  }, []);

  const paintDay = (day: string) => {
    if (fx.brush === null) return;
    fx.paintCells(fx.visiblePeople.map((p) => cellKey(p.userId, day)), fx.brush);
  };

  /** Último tipo de puntero: en celular se pinta con un toque y el dedo sigue sirviendo para desplazarse. */
  const pointerType = useRef<string>("mouse");

  const onGridPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    pointerType.current = e.pointerType;
    // Táctil/lápiz: sin arrastre-pintura (bloquearía el scroll); se pinta en el click del toque.
    if (e.pointerType !== "mouse") return;
    const f = latest.current;
    if (f.brush === null || e.button !== 0) return;
    const key = (e.target as Element).closest<HTMLElement>("[data-k]")?.dataset.k;
    if (!key) return;
    e.preventDefault();
    // En táctil el puntero queda capturado por la celda inicial: se libera para seguir el arrastre.
    const el = e.target as Element;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    stroke.current = { last: key, start: f.currentEdits() };
    f.beginStroke();
    f.paintCells([key], f.brush, false);
  };

  const onGridClick = (e: React.MouseEvent<HTMLElement>) => {
    if (pointerType.current === "mouse") return; // con mouse ya pintó el pointerdown
    const f = latest.current;
    const key = (e.target as Element).closest<HTMLElement>("[data-k]")?.dataset.k;
    if (key && f.brush !== null) f.paintCells([key], f.brush);
  };

  const onGridPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const s = stroke.current;
    if (!s) return;
    const key = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-k]")?.dataset.k;
    // Solo al entrar a otra celda, no en cada movimiento.
    if (!key || key === s.last) return;
    s.last = key;
    const f = latest.current;
    if (f.brush !== null) f.paintCells([key], f.brush, false);
  };

  useEffect(() => {
    const end = () => {
      const s = stroke.current;
      if (!s) return;
      stroke.current = null;
      latest.current.endStroke(s.start);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const chip = (value: string, label: string, tone: Tone) => {
    const active = fx.brush === value;
    const base = value === "";
    return (
      <button
        key={value || "__BASE__"}
        type="button"
        aria-pressed={active}
        onClick={() => fx.setBrush(value)}
        style={{
          background: tone.background,
          color: tone.color,
          border: `1.5px ${base ? "dashed" : "solid"} ${base ? "#6b7280" : "transparent"}`,
          outline: active ? "2px solid #111827" : undefined,
          outlineOffset: active ? 2 : undefined,
        }}
        className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[14px] leading-tight transition hover:brightness-95"
      >
        {label}
      </button>
    );
  };

  return (
    <ITFlex direction="column" gap={3} className="min-w-0 pb-24">
      <ITCard contentClassName="!p-3" className="bento-rise">
        <ITFlex align="end" wrap="wrap" gap={2.5}>
          <ITFlex align="end" gap={1} className="min-w-[280px] flex-[1.3]">
            <ITButton
              variant="outlined"
              color="secondary"
              size="sm"
              onClick={() => guard(fx.previousWeek)}
              aria-label={t("roster.previousWeek")}
              title={t("roster.previousWeek")}
            >
              <LuChevronLeft size={13} />
            </ITButton>
            <ITFlex className="min-w-0 flex-1">
              <ITDatePicker
                name="rosterWeek"
                label={t("roster.week")}
                range
                value={fx.rangeValue}
                onChange={handleRange}
                className="w-full min-w-0"
              />
            </ITFlex>
            <ITButton
              variant="outlined"
              color="secondary"
              size="sm"
              onClick={() => guard(fx.nextWeek)}
              aria-label={t("roster.nextWeek")}
              title={t("roster.nextWeek")}
            >
              <LuChevronRight size={13} />
            </ITButton>
          </ITFlex>
          <ITFlex className="min-w-[190px] flex-1">
            <ITSearchSelect
              name="rosterDepartment"
              label={t("roster.department")}
              options={[
                { value: "", label: t("roster.allDepartments") },
                ...fx.departments.data.map((d) => ({ value: d.id, label: d.name })),
              ]}
              value={fx.departmentId}
              onChange={(value) => guard(() => fx.setDepartmentId(String(value)))}
              className="w-full min-w-0"
            />
          </ITFlex>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => setHelpOpen(true)}>
            <ITFlex align="center" gap={1}>
              <LuCircleHelp size={13} />
              <ITText as="span" className="text-[11px] font-bold">{t("roster.helpButton")}</ITText>
            </ITFlex>
          </ITButton>
          {canManage && (
            <ITFlex align="center" wrap="wrap" gap={2}>
              <ITButton variant="outlined" color="secondary" size="sm" onClick={() => setNewShiftOpen(true)}>
                <ITFlex align="center" gap={1}>
                  <LuPlus size={13} />
                  <ITText as="span" className="text-[11px] font-bold">{t("roster.newShift.button")}</ITText>
                </ITFlex>
              </ITButton>
              <ITButton
                variant="outlined"
                color="secondary"
                size="sm"
                disabled={!editable || fx.saving}
                onClick={() => (fx.hasRosterCells ? setCopyConfirm(true) : guard(() => void fx.copyPreviousWeek()))}
              >
                <ITFlex align="center" gap={1}>
                  <LuCopy size={13} />
                  <ITText as="span" className="text-[11px] font-bold">{t("roster.copyPrevious")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          )}
        </ITFlex>
      </ITCard>

      {editable && (
        <nav role="tablist" className="flex flex-wrap gap-1.5">
          {(["grid", "bulk"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              style={
                tab === k
                  ? { background: "var(--color-primary)", color: "#fff", borderColor: "var(--color-primary)" }
                  : undefined
              }
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                tab === k ? "" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              {t(k === "bulk" ? "roster.bulk.toggle" : "roster.tabGrid")}
            </button>
          ))}
        </nav>
      )}

      {showBulk && week && (
        <BulkAssignPanel
          days={week.days}
          schedules={fx.schedules}
          people={fx.visiblePeople}
          tones={tones}
          onApply={fx.stageBulk}
        />
      )}

      {showGrid && (
        // Misma tarjeta blanca que «Asignar en bloque»: las dos pestañas se ven igual
        <div className="bento-rise grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {editable && <p className="text-[14px] text-slate-600">{t("roster.gridIntro")}</p>}
          <div className="flex flex-wrap items-end gap-2">
            <ITInput
              name="rosterSearch"
              label={t("roster.searchLabel")}
              placeholder={t("roster.searchPlaceholder")}
              value={fx.search}
              onChange={(e) => fx.setSearch(e.target.value)}
              className="w-full min-w-[200px] max-w-[280px]"
            />
            {editable && (
              <>
                <ITButton variant="outlined" color="secondary" size="sm" disabled={!fx.undoCount || fx.saving} onClick={fx.undo}>
                  <ITFlex align="center" gap={1}>
                    <LuUndo2 size={13} />
                    <ITText as="span" className="text-[12px] font-bold">{t("roster.undo")}</ITText>
                  </ITFlex>
                </ITButton>
                <ITButton variant="outlined" color="secondary" size="sm" disabled={!fx.dirtyCount || fx.saving} onClick={fx.discard}>
                  <ITFlex align="center" gap={1}>
                    <LuX size={13} />
                    <ITText as="span" className="text-[12px] font-bold">{t("roster.discard")}</ITText>
                  </ITFlex>
                </ITButton>
                <ITButton variant="filled" color="primary" size="sm" disabled={!fx.dirtyCount || fx.saving} onClick={() => void fx.save()}>
                  <ITFlex align="center" gap={1}>
                    <LuSave size={13} className="text-white" />
                    <ITText as="span" className="text-[12px] font-bold !text-white">{t("roster.save")}</ITText>
                  </ITFlex>
                </ITButton>
                <span className="pb-1.5 text-[14px] text-slate-600">
                  {fx.dirtyCount ? (
                    <b style={{ color: "#92570a" }}>{t("roster.unsavedChanges", { count: fx.dirtyCount })}</b>
                  ) : (
                    t("roster.allSaved")
                  )}
                </span>
              </>
            )}
          </div>
          {editable && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--color-primary)" }}>
                  {t("roster.brushTitle")}
                </span>
                <HelpHint text={t("roster.help.brush")} />
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {fx.schedules.map((sc) => chip(sc.id, sc.name, tones.get(sc.id) ?? BASE_TONE))}
                {chip(REST_VALUE, t("roster.rest"), REST_TONE)}
                {chip("", t("roster.baseBrush"), BASE_TONE)}
              </div>
            </div>
          )}
        </div>
      )}

      {fx.closed && <ITAlert variant="warning">{t("roster.closedNotice")}</ITAlert>}
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      {fx.loading && !week ? (
        <LangostinState kind="loading" />
      ) : !week || week.people.length === 0 ? (
        <ITCard contentClassName="!p-6">
          <ITText muted className="text-center">{t("roster.empty")}</ITText>
        </ITCard>
      ) : !showGrid ? null : (
        <div className="min-w-0 overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          {/* El scroll horizontal vive dentro de la tarjeta, no en la página */}
          <div className="max-h-[70vh] max-w-full overflow-auto overscroll-contain">
            <table onPointerDown={onGridPointerDown} onPointerMove={onGridPointerMove} onClick={onGridClick} className="w-full min-w-[680px] select-none border-separate border-spacing-0 text-[13px]">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 min-w-[120px] sm:min-w-[170px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold text-slate-600">
                    {t("roster.person")}
                  </th>
                  {week.days.map((d) => {
                    const h = dayHeader(d);
                    return (
                      <th key={d} className="sticky top-0 z-20 min-w-[110px] border-b border-slate-200 bg-slate-50 px-2 py-2 text-center font-bold text-slate-600">
                        {editable ? (
                          <button
                            type="button"
                            disabled={fx.brush === null}
                            onClick={() => paintDay(d)}
                            title={t("roster.paintDay")}
                            className={`w-full ${fx.brush !== null ? "cursor-pointer hover:text-sky-700" : "cursor-default"}`}
                          >
                            <span className="block capitalize">{h.name}</span>
                            <span className="block text-[11px] font-semibold text-slate-400">{h.date}</span>
                          </button>
                        ) : (
                          <>
                            <span className="block capitalize">{h.name}</span>
                            <span className="block text-[11px] font-semibold text-slate-400">{h.date}</span>
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {fx.visiblePeople.map((p) => (
                  <RosterRow
                    key={p.userId}
                    person={p}
                    vals={p.cells.map((c) => fx.edits[cellKey(p.userId, c.date)])}
                    editable={editable}
                    painting={fx.brush !== null}
                    tones={tones}
                    byId={byId}
                    onPaintPerson={paintPerson}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showGrid && week && week.people.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3.5 w-3.5 rounded" style={{ background: "#f5f7fa", border: "1px solid #c9d0da" }} />
            {t("roster.legend.assigned")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3.5 w-3.5 rounded" style={{ border: "1.5px dashed #6b7280" }} />
            {t("roster.legend.base")}
            <HelpHint text={t("roster.help.baseConcept")} />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3.5 w-3.5 rounded" style={{ boxShadow: "inset 0 0 0 2px #d99a1e" }} />
            {t("roster.legend.dirty")}
          </span>
        </div>
      )}

      <RosterHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <NewShiftDialog
        open={newShiftOpen}
        onClose={() => setNewShiftOpen(false)}
        onCreated={(s) => {
          setNewShiftOpen(false);
          fx.setNotice(t("roster.newShift.created", { name: s.name }));
          void fx.reloadSchedules();
        }}
      />
      <ConfirmDialog
        isOpen={copyConfirm}
        onClose={() => setCopyConfirm(false)}
        onConfirm={() => {
          setCopyConfirm(false);
          guard(() => void fx.copyPreviousWeek());
        }}
        title={t("roster.copyConfirm.title")}
        message={t("roster.copyConfirm.message")}
        confirmLabel={t("roster.copyConfirm.confirm")}
        cancelLabel={t("cancel")}
      />
      <ConfirmDialog
        isOpen={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => {
          const action = pending;
          setPending(null);
          fx.discard();
          action?.();
        }}
        title={t("roster.unsaved.title")}
        message={t("roster.unsaved.message")}
        confirmLabel={t("roster.unsaved.confirm")}
        cancelLabel={t("cancel")}
      />
      <ConfirmDialog
        isOpen={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title={t("roster.unsaved.title")}
        message={t("roster.unsaved.message")}
        confirmLabel={t("roster.unsaved.confirm")}
        cancelLabel={t("cancel")}
      />
      {fx.notice && <ITToast message={fx.notice} type="success" position="top-right" duration={3000} onClose={() => fx.setNotice(null)} />}
    </ITFlex>
  );
}
