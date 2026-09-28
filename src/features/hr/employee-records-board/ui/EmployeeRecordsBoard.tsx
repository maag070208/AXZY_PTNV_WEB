import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAvatar,
  ITBadget,
  ITButton,
  ITChip,
  ITConfirmDialog,
  ITInput,
  ITProgress,
  ITSearchSelect,
  ITSegmentedControl,
  ITStatCard,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaBell, FaCheck, FaChevronRight, FaSearch, FaTimes } from "react-icons/fa";
import { LottieLoader } from "@shared/ui/lottie-loader";
import type { RecordGapsRow } from "@entities/dashboard";
import { recordStatus, type RecordFilter, type RecordStatus, type UseEmployeeRecords } from "../model/useEmployeeRecords";

const FILTERS: RecordFilter[] = ["ALL", "REQUIRED", "INCOMPLETE", "COMPLETE"];
const OTHER_DOCS_PREVIEW = 4;
const FIELDS_PREVIEW = 4;

const STATUS_COLOR = { REQUIRED: "warning", INCOMPLETE: "gray", COMPLETE: "success" } as const satisfies Record<RecordStatus, string>;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const percent = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <div className="w-[96px]" title={label}>
      <ITProgress value={percent(done, total)} size="sm" color={done === total ? "success" : "primary"} />
      <div className="mt-1 text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function DocChip({ name, delivered }: { name: string; delivered: boolean }) {
  return (
    <ITChip
      size="sm"
      variant={delivered ? "soft" : "outlined"}
      color={delivered ? "success" : "danger"}
      icon={delivered ? <FaCheck size={8} /> : <FaTimes size={8} />}
      label={name}
    />
  );
}

interface Props {
  fx: UseEmployeeRecords;
}

/**
 * Expedientes de empleados (RH): indicadores, lista filtrable con los
 * obligatorios de cada quien, avance del expediente y de los datos personales,
 * y el detalle de la persona elegida para ver o subir documentos y avisarle.
 */
export default function EmployeeRecordsBoard({ fx }: Props) {
  const { t } = fx;
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<string | null>(null);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const sel = fx.selected;

  const pickFile = (typeId: string) => {
    setUploadType(typeId);
    fileInput.current?.click();
  };

  const kpis: Array<{ key: string; value: number; color?: string }> = [
    { key: "active", value: fx.counts.total },
    { key: "complete", value: fx.counts.COMPLETE },
    { key: "missingRequired", value: fx.counts.REQUIRED, color: "bg-warning-50 dark:bg-warning-950/20" },
    { key: "incomplete", value: fx.counts.INCOMPLETE },
  ];

  const done = (items: Array<{ delivered: boolean }>) => items.filter((i) => i.delivered).length;
  const totalOf = (r: RecordGapsRow) => ({
    done: done(r.requiredDocuments) + done(r.otherDocuments) + r.filledFields.length,
    total: r.requiredDocuments.length + r.otherDocuments.length + r.filledFields.length + r.missingFields.length,
  });

  if (fx.loading && fx.visible.length === 0 && !fx.error) {
    return (
      <div className="flex justify-center py-16">
        <LottieLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Indicadores + aviso masivo */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid flex-1 !grid-cols-2 gap-3 md:!grid-cols-4">
          {kpis.map((k) => (
            <ITStatCard key={k.key} label={t(`records.kpis.${k.key}`)} value={k.value} color={k.color} />
          ))}
        </div>
        <ITButton
          variant="filled"
          color="primary"
          size="sm"
          icon={<FaBell size={11} />}
          label={t("records.notifyPending")}
          disabled={fx.pendingVisible.length === 0}
          onClick={() => fx.setBulkOpen(true)}
        />
      </div>

      {fx.error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-700">{fx.error}</div>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Lista */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
            <div className="min-w-[200px] flex-1 basis-full 2xl:basis-auto">
              <ITInput
                name="employee_records_search"
                size="sm"
                value={fx.search}
                onChange={(e) => fx.setSearch(e.target.value)}
                placeholder={t("records.filters.search")}
                iconLeft={<FaSearch size={12} />}
              />
            </div>
            <ITSegmentedControl
              size="sm"
              options={FILTERS.map((f) => ({ value: f, label: f === "ALL" ? t("records.filters.all") : t(`records.filters.${f}`) }))}
              value={fx.filter}
              onChange={(value) => fx.setFilter(value as RecordFilter)}
            />
            <div className="w-[220px]">
              <ITSearchSelect
                name="employee_records_department"
                size="sm"
                placeholder={t("records.filters.department")}
                options={[
                  { value: "", label: t("records.filters.allDepartments") },
                  ...fx.departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={fx.departmentId}
                onChange={(value) => fx.setDepartmentId(String(value))}
              />
            </div>
          </div>

          <div className="max-h-[640px] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">{t("records.columns.employee")}</th>
                  <th className="px-3 py-3">{t("records.columns.required")}</th>
                  <th className="px-3 py-3">{t("records.columns.record")}</th>
                  <th className="px-3 py-3">{t("records.columns.personal")}</th>
                  <th className="px-3 py-3">{t("records.columns.status")}</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {fx.visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[12px] text-slate-400">
                      {t("records.empty")}
                    </td>
                  </tr>
                )}
                {fx.visible.map((r) => {
                  const status = recordStatus(r);
                  const active = sel?.userId === r.userId;
                  const fieldsTotal = r.filledFields.length + r.missingFields.length;
                  return (
                    <tr
                      key={r.userId}
                      onClick={() => fx.select(r.userId)}
                      className={`cursor-pointer border-t border-slate-100 align-middle ${
                        active ? "bg-slate-50 shadow-[inset_3px_0_0_#1e3a5f]" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <ITAvatar initials={initials(r.name)} size="sm" />
                          <div className="min-w-0 max-w-[200px]">
                            <div className="line-clamp-2 text-[12px] font-bold leading-tight text-slate-900">{r.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {[r.employeeNumber ? `#${r.employeeNumber}` : "#—", r.departmentName].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-0.5">
                          {r.requiredDocuments.map((d) => (
                            <DocChip key={d.id} name={d.name} delivered={d.delivered} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Progress
                          done={done(r.otherDocuments)}
                          total={r.otherDocuments.length}
                          label={t("records.progress", { done: done(r.otherDocuments), total: r.otherDocuments.length })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Progress
                          done={r.filledFields.length}
                          total={fieldsTotal}
                          label={t("records.progress", { done: r.filledFields.length, total: fieldsTotal })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <ITBadget size="sm" className="whitespace-nowrap" color={STATUS_COLOR[status]} label={t(`records.status.${status}`)} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <ITButton
                            variant="icon-only"
                            color="gray"
                            size="sm"
                            disabled={status === "COMPLETE" || fx.notifying === r.userId}
                            onClick={() => void fx.notify(r)}
                            title={t("records.notify")}
                            ariaLabel={t("records.notify")}
                          >
                            <FaBell size={12} />
                          </ITButton>
                          <ITButton
                            variant="icon-only"
                            color="gray"
                            size="sm"
                            onClick={() => navigate(`/employees/${r.userId}`)}
                            title={t("records.detail.open")}
                            ariaLabel={t("records.detail.open")}
                          >
                            <FaChevronRight size={11} />
                          </ITButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalle */}
        <div className="flex max-h-[760px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:sticky xl:top-4">
          {!sel ? (
            <div className="p-8 text-center text-[12px] text-slate-400">{t("records.detail.select")}</div>
          ) : (
            <>
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <ITAvatar initials={initials(sel.name)} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-slate-900">{sel.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {[sel.employeeNumber ? `#${sel.employeeNumber}` : "#—", sel.departmentName].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-[11px]">
                  <span className="text-slate-600">{t("records.detail.total")}</span>
                  <span className="font-bold text-slate-900">
                    {t("records.progress", totalOf(sel))}
                  </span>
                </div>
                <ITProgress value={percent(totalOf(sel).done, totalOf(sel).total)} size="sm" className="mt-1.5" />
              </div>

              <div className="flex-1 overflow-auto p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-orange-700">
                  {t("records.detail.required", { done: done(sel.requiredDocuments), total: sel.requiredDocuments.length })}
                </div>
                <div className="mt-2 divide-y divide-slate-100">
                  {sel.requiredDocuments.map((d) => {
                    const file = fx.documentOf(d.id);
                    return (
                      <div key={d.id} className="flex items-center gap-2.5 py-1">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            d.delivered ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                          }`}
                        >
                          {d.delivered ? <FaCheck size={9} /> : <FaTimes size={9} />}
                        </span>
                        <span className="flex-1 text-[12px] text-slate-800">{d.name}</span>
                        {d.delivered && file ? (
                          <ITButton variant="text" color="primary" size="sm" label={t("records.detail.view")} onClick={() => window.open(file.url, "_blank", "noopener")} />
                        ) : (
                          <ITButton
                            variant="outlined"
                            color="secondary"
                            size="sm"
                            disabled={fx.uploading === d.id}
                            onClick={() => pickFile(d.id)}
                            label={fx.uploading === d.id ? t("records.detail.uploading") : t("records.detail.upload")}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t("records.detail.other", { done: done(sel.otherDocuments), total: sel.otherDocuments.length })}
                </div>
                <div className="mt-2">
                  {(showAllDocs ? sel.otherDocuments : sel.otherDocuments.slice(0, OTHER_DOCS_PREVIEW)).map((d) => {
                    const file = fx.documentOf(d.id);
                    return (
                      <div key={d.id} className="flex items-center gap-2.5 py-1">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${d.delivered ? "bg-emerald-600" : "bg-slate-300"}`} />
                        <span className="flex-1 text-[12px] text-slate-800">{d.name}</span>
                        {d.delivered && file ? (
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-[11px] text-slate-500 hover:underline">
                            {t("records.detail.delivered")}
                          </a>
                        ) : showAllDocs ? (
                          <ITButton
                            variant="text"
                            color="primary"
                            size="sm"
                            disabled={fx.uploading === d.id}
                            onClick={() => pickFile(d.id)}
                            label={fx.uploading === d.id ? t("records.detail.uploading") : t("records.detail.upload")}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-500">{d.delivered ? t("records.detail.delivered") : t("records.detail.pending")}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {sel.otherDocuments.length > OTHER_DOCS_PREVIEW && (
                  <ITButton
                    variant="text"
                    color="primary"
                    size="sm"
                    onClick={() => setShowAllDocs((v) => !v)}
                    label={showAllDocs ? t("records.detail.showLess") : t("records.detail.showAll", { count: sel.otherDocuments.length })}
                  />
                )}

                <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {t("records.detail.personal", {
                    done: sel.filledFields.length,
                    total: sel.filledFields.length + sel.missingFields.length,
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(() => {
                    const all = [
                      ...sel.filledFields.map((f) => ({ key: f, filled: true })),
                      ...sel.missingFields.map((f) => ({ key: f, filled: false })),
                    ];
                    const shown = showAllFields ? all : all.slice(0, FIELDS_PREVIEW);
                    return (
                      <>
                        {shown.map((f) => (
                          <ITChip
                            key={f.key}
                            size="sm"
                            variant={f.filled ? "soft" : "outlined"}
                            color={f.filled ? "success" : "gray"}
                            label={t(`records.profileFields.${f.key}`)}
                          />
                        ))}
                        {all.length > FIELDS_PREVIEW && (
                          <ITButton
                            variant="text"
                            color="primary"
                            size="sm"
                            onClick={() => setShowAllFields((v) => !v)}
                            label={showAllFields ? t("records.detail.showLess") : t("records.detail.moreFields", { count: all.length - FIELDS_PREVIEW })}
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid !grid-cols-2 gap-2 border-t border-slate-100 p-3">
                <ITButton
                  variant="outlined"
                  color="secondary"
                  size="sm"
                  className="w-full"
                  disabled={recordStatus(sel) === "COMPLETE" || fx.notifying === sel.userId}
                  onClick={() => void fx.notify(sel)}
                  label={recordStatus(sel) === "COMPLETE" ? t("records.complete") : t("records.detail.notify")}
                />
                <ITButton
                  variant="filled"
                  color="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/employees/${sel.userId}`)}
                  label={t("records.detail.open")}
                />
              </div>
            </>
          )}
        </div>
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
        message={t("records.notifyPendingConfirm", { count: fx.pendingVisible.length })}
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
