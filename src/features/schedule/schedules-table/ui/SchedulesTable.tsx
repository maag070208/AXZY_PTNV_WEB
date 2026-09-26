import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { scheduleApi, type Schedule, type ScheduleDay } from "@entities/schedule";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { i18n, dateLocale } from "@shared/i18n";

// Inicial de cada día (lunes = 1), en el idioma de la interfaz. 2024-01-01 fue lunes.
const dayAbbr = (weekday: number): string =>
  new Date(Date.UTC(2024, 0, weekday)).toLocaleDateString(dateLocale(), { weekday: "narrow", timeZone: "UTC" });

const dayKey = (d: ScheduleDay): string =>
  d.restDay
    ? "rest"
    : `${d.startTime}-${d.endTime}${d.splitStartTime && d.splitEndTime ? ` + ${d.splitStartTime}-${d.splitEndTime}` : ""}`;

/** "L-V 08:00-16:00 · S 08:00-14:00 · D descansa" */
function formatDays(days: ScheduleDay[]): string {
  const sorted = [...days].sort((a, b) => a.weekday - b.weekday);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const k = dayKey(sorted[i]);
    let j = i;
    while (j + 1 < sorted.length && dayKey(sorted[j + 1]) === k && sorted[j + 1].weekday === sorted[j].weekday + 1) {
      j += 1;
    }
    const label =
      sorted[i].weekday === sorted[j].weekday
        ? dayAbbr(sorted[i].weekday)
        : `${dayAbbr(sorted[i].weekday)}-${dayAbbr(sorted[j].weekday)}`;
    parts.push(`${label} ${k === "rest" ? i18n.t("common:labels.rest") : k}`);
    i = j + 1;
  }
  return parts.join(" · ");
}

export default function SchedulesTable() {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [scheduleToDeactivate, setScheduleToDeactivate] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);

  // El fetcher corre en cada refetch; `reloadTrigger` fuerza a ITDataTable a
  // volver a pedir los datos tras un cambio.
  const fetchData = useMemo(
    () => makeClientTableFetch<Schedule>(() => scheduleApi.list(true)),
    []
  );

  const toggleActive = async (h: Schedule) => {
    try {
      await scheduleApi.update(h.id, { active: !h.active });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const confirmDeactivate = async () => {
    if (!scheduleToDeactivate) return;
    setSaving(true);
    try {
      await scheduleApi.update(scheduleToDeactivate.id, { active: false });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
      setScheduleToDeactivate(null);
    }
  };

  const columns: Column<Schedule>[] = [
    {
      key: "name",
      label: t("name"),
      type: "string",
      filter: true,
      sortable: true,
      render: (h) => <ITText className="text-[12px] font-black text-slate-800">{h.name}</ITText>,
    },
    {
      key: "days",
      label: t("days"),
      type: "string",
      sortable: false,
      render: (h) => (
        <ITText className="text-[11px] text-slate-600">{formatDays(h.days)}</ITText>
      ),
    },
    {
      key: "rules",
      label: t("tolEntry"),
      type: "string",
      sortable: false,
      render: (h) => (
        <ITText className="text-[11px] text-slate-500 whitespace-nowrap">
          E{h.entryToleranceMin} / S{h.exitToleranceMin} · {t("meal")} {h.mealBreakMin} · {t("minExtra")} {h.minOvertimeMin}
        </ITText>
      ),
    },
    {
      key: "assigned",
      label: t("assignedLabel"),
      type: "number",
      sortable: false,
      render: (h) => <ITText className="text-[12px] font-bold text-slate-700">{h.assigned ?? 0}</ITText>,
    },
    {
      key: "active",
      label: t("active"),
      type: "boolean",
      sortable: false,
      render: (h) => (
        <ITBadget color={h.active ? "success" : "danger"} size="sm">
          {h.active ? t("active") : t("inactive")}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      actions: (h) => (
        <ITFlex align="center" gap={1}>
          <ITButton
            variant="outlined"
            size="lg"
            color="primary"
            title={t("edit")}
            onClick={() => navigate(`/schedules/${h.id}/edit`)}
          >
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            size="lg"
            color={h.active ? "error" : "success"}
            title={h.active ? t("delete") : t("reactivate")}
            onClick={() => (h.active ? setScheduleToDeactivate(h) : void toggleActive(h))}
          >
            <FaTrashRestore size={12} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITFlex justify="end">
        <ITButton variant="filled" color="primary" onClick={() => navigate("/schedules/new")}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("new")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as never}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[10, 25, 50]}
        size="lg"
      />

      <ITConfirmDialog
        isOpen={!!scheduleToDeactivate}
        onClose={() => {
          if (!saving) setScheduleToDeactivate(null);
        }}
        onConfirm={confirmDeactivate}
        title={t("deactivateDialog.title")}
        message={t("deactivateDialog.message", { name: scheduleToDeactivate?.name ?? "" })}
        confirmLabel={t("deactivateDialog.confirm")}
        cancelLabel={t("cancel")}
        variant="danger"
        loading={saving}
      />
    </ITFlex>
  );
}
