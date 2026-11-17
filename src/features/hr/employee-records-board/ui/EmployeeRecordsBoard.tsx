import { useRef, useState } from "react";
import { ITAlert, ITConfirmDialog, ITInput, ITToast, ITText } from "@axzydev/axzy_ui_system";
import { FaChevronDown, FaRegBell, FaSearch } from "react-icons/fa";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { Num } from "@shared/ui/bento-bits";
import type { RecordFilter, UseEmployeeRecords } from "../model/useEmployeeRecords";
import RecordDetail from "./RecordDetail";
import RecordRow from "./RecordRow";
import { NAVY, hairline, recordsGrid } from "./recordStyles";

const FILTERS: RecordFilter[] = ["ALL", "REQUIRED", "INCOMPLETE", "COMPLETE"];
const th = "text-[10.5px] font-bold uppercase tracking-[0.05em] text-slate-500";
const cardStyle = { background: "var(--it-card-bg, #ffffff)", border: "1px solid #e6eaf0", borderRadius: 16 } as const;

interface Props {
  fx: UseEmployeeRecords;
  /** Oculta la franja de indicadores (el inicio ya la muestra en el mosaico). */
  hideKpis?: boolean;
}

/**
 * Expedientes de empleados (RH): lista filtrable con casillas de selección, los
 * obligatorios, el avance del expediente y de los datos personales, y el
 * detalle de la persona elegida para ver o subir documentos y avisarle.
 *
 * La tabla usa divs con roles ARIA y líneas finas inline (las clases
 * border-slate/border-[color:] no se generan en el CSS de la app y el tema
 * mete reglas globales a thead/tbody con !important).
 */
/** Tarjeta de indicador blanca, como las de Pre-nómina. */
function RecordKpi({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <div
      className="rounded-[14px] px-4 py-3.5"
      style={{ background: "var(--it-card-bg, #ffffff)", boxShadow: "0 1px 2px rgb(15 23 42 / 0.06)" }}
    >
      <ITText muted className="block !text-[12px] font-semibold">
        {label}
      </ITText>
      <ITText
        className="mt-1 block !text-[26px] font-extrabold leading-none tabular-nums"
        style={alert ? { color: value > 0 ? "var(--color-danger)" : "var(--color-text-muted)" } : undefined}
      >
        <Num value={value} />
      </ITText>
    </div>
  );
}

export default function EmployeeRecordsBoard({ fx, hideKpis = false }: Props) {
  const { t } = fx;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<string | null>(null);
  const sel = fx.selected;

  const pickFile = (typeId: string) => {
    setUploadType(typeId);
    fileInput.current?.click();
  };

  if (fx.loading && fx.visible.length === 0 && !fx.error) {
    return (
      <div className="flex justify-center py-16">
        <LottieLoader size="lg" />
      </div>
    );
  }

  const percentComplete = fx.counts.total ? Math.round((fx.counts.COMPLETE / fx.counts.total) * 100) : 0;
  const countOf = (f: RecordFilter) => (f === "ALL" ? fx.counts.total : fx.counts[f]);

  return (
    <div className="flex flex-col gap-4">
      {/* Indicadores estilo Pre-nómina (solo en la pantalla de Expedientes). */}
      {!hideKpis && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[14px] px-4 py-3.5" style={{ background: "var(--color-primary-900)" }}>
            <ITText className="block !text-[12px] font-semibold !text-white/75">{t("records.kpis.active")}</ITText>
            <ITText className="mt-1 block !text-[26px] font-extrabold leading-none tabular-nums !text-white">
              <Num value={fx.counts.total} />
            </ITText>
          </div>
          <RecordKpi label={t("records.kpis.complete")} value={fx.counts.COMPLETE} />
          <RecordKpi label={t("records.kpis.missingRequired")} value={fx.counts.REQUIRED} alert />
          <RecordKpi label={t("records.kpis.incomplete")} value={fx.counts.INCOMPLETE} />
        </div>
      )}

      {fx.error && <ITAlert variant="error">{fx.error}</ITAlert>}

      <div className="grid gap-4 xl:!grid-cols-[minmax(0,1fr)_28%]">
        {/* Lista */}
        <section className="min-w-0 overflow-hidden" style={cardStyle}>
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
            <div>
              <h3 className="m-0 text-[17px] font-semibold text-slate-900">{t("records.listTitle")}</h3>
              <div className="mt-0.5 text-[12.5px] text-slate-500">
                {t("records.subtitle", { total: fx.counts.total, percent: percentComplete })}
              </div>
            </div>
            <button
              type="button"
              disabled={fx.notifyTargets.length === 0}
              onClick={() => fx.setBulkOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: NAVY }}
            >
              <FaRegBell size={13} />
              {t("records.remind", { count: fx.notifyTargets.length })}
            </button>
          </div>

          <div className="mt-4 grid gap-2 px-5 md:grid-cols-[minmax(0,1fr)_minmax(0,240px)] md:items-center">
            <ITInput
              name="employee_records_search"
              value={fx.search}
              onChange={(e) => fx.setSearch(e.target.value)}
              placeholder={t("records.filters.searchShort")}
              iconLeft={<FaSearch size={12} />}
            />
            <label
              className="relative flex h-full min-h-[40px] cursor-pointer items-center gap-2 rounded-[10px] bg-white px-3 text-[13px]"
              style={{ border: "1px solid #dfe3ea" }}
            >
              <span className="text-slate-500">{t("records.filters.areaLabel")}</span>
              <select
                name="employee_records_department"
                value={fx.departmentId}
                onChange={(e) => fx.setDepartmentId(e.target.value)}
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 font-semibold text-slate-900 outline-none"
              >
                <option value="">{t("records.filters.allAreas")}</option>
                {fx.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <FaChevronDown size={11} className="pointer-events-none absolute right-3 text-slate-500" />
            </label>
          </div>

          {/* Filtro segmentado */}
          <div className="mt-3 flex flex-wrap px-5 pb-4">
            <div className="inline-flex flex-wrap gap-1 rounded-xl p-1" style={{ background: "#f1f3f6" }}>
              {FILTERS.map((f) => {
                const active = fx.filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => fx.setFilter(f)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold"
                    style={{ background: active ? NAVY : "transparent", color: active ? "#ffffff" : "#334155" }}
                  >
                    {f === "ALL" ? t("records.filters.all") : t(`records.filters.${f}`)}
                    <span
                      className="rounded-full px-1.5 text-[11px] font-bold tabular-nums"
                      style={{ background: active ? "rgb(255 255 255 / 0.18)" : "#e3e7ee" }}
                    >
                      {countOf(f)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[640px] overflow-auto" style={{ borderTop: hairline }}>
            {/* Divs con roles ARIA (no <table>): el tema inyecta reglas globales
                a thead/tbody con !important y ensucian cualquier tabla plana. */}
            <div role="table" aria-label={t("records.columns.employee")} className="min-w-[860px]">
              <div role="row" className={`${recordsGrid} sticky top-0 z-10 px-4 py-2.5`} style={{ background: "#f4f6f9", borderBottom: hairline }}>
                <span role="columnheader">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer"
                    checked={fx.allChecked}
                    onChange={fx.toggleAllChecked}
                    aria-label={t("records.selectAll")}
                  />
                </span>
                <span role="columnheader" className={th}>{t("records.columns.employee")}</span>
                <span role="columnheader" className={th}>{t("records.columns.area")}</span>
                <span role="columnheader" className={th}>{t("records.columns.required")}</span>
                <span role="columnheader" className={th}>{t("records.columns.record")}</span>
                <span role="columnheader" className={th}>{t("records.columns.personal")}</span>
                <span role="columnheader" className={th}>{t("records.columns.status")}</span>
                <span role="columnheader" />
              </div>
              {fx.visible.length === 0 && (
                <div role="row" className="px-4 py-10 text-center text-[12px] text-slate-400">
                  {t("records.empty")}
                </div>
              )}
              {fx.visible.map((r, i) => (
                <RecordRow key={r.userId} row={r} fx={fx} active={sel?.userId === r.userId} last={i === fx.visible.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* Detalle */}
        <section className="flex max-h-[820px] min-w-0 flex-col self-start p-5 xl:sticky xl:top-4" style={cardStyle}>
          {!sel ? (
            <div className="p-8 text-center text-[12px] text-slate-400">{t("records.detail.select")}</div>
          ) : (
            <RecordDetail sel={sel} fx={fx} onPickFile={pickFile} />
          )}
        </section>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadType) void fx.upload(uploadType, file);
          e.target.value = "";
        }}
      />

      <ITConfirmDialog
        isOpen={fx.bulkOpen}
        onClose={() => fx.setBulkOpen(false)}
        onConfirm={() => void fx.notifyPending()}
        title={t("records.notifyPendingConfirmTitle")}
        message={t("records.notifyPendingConfirm", { count: fx.notifyTargets.length })}
        confirmLabel={t("records.notifyPending")}
        cancelLabel={t("common:actions.cancel")}
        loading={fx.bulkSending}
      />

      {fx.toast && (
        <ITToast message={fx.toast.message} type={fx.toast.type} position="bottom-center" duration={3000} onClose={() => fx.setToast(null)} />
      )}
    </div>
  );
}
