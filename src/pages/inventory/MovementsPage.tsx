import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITGrid, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaExchangeAlt, FaFilePdf, FaHistory, FaPlus, FaTrash, FaUndoAlt, FaWrench } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type Movement, type MovementType } from "@entities/inventory";
import { TYPE_BADGE_COLOR } from "@entities/inventory/model/movementColors";
import { downloadReportMovementsPdf } from "@widgets/movement-pdf";
import { StatCard } from "@shared/ui/stat-card";
import { i18n } from "@shared/i18n";

interface StatCounts {
  total: number;
  retirements: number;
  maintenance: number;
}

type TypeGroup = "retirements" | "maintenance";

const GROUP_TYPES: Record<TypeGroup, MovementType[]> = {
  retirements: ["RETIREMENT"],
  maintenance: ["MAINTENANCE_IN", "MAINTENANCE_OUT"],
};

type ActionColor = "success" | "warning" | "danger" | "info";
const ACTION_VISUAL: Record<MovementType, { icon: ReactNode; color: ActionColor }> = {
  STOCK_IN: { icon: <FaArrowDown size={12} />, color: "success" },
  ADJUSTMENT_IN: { icon: <FaArrowDown size={12} />, color: "success" },
  RETURN: { icon: <FaArrowRight size={12} />, color: "success" },
  LOAN: { icon: <FaArrowUp size={12} />, color: "warning" },
  RETIREMENT: { icon: <FaTrash size={12} />, color: "danger" },
  ADJUSTMENT_OUT: { icon: <FaArrowUp size={12} />, color: "warning" },
  TRANSFER: { icon: <FaExchangeAlt size={12} />, color: "info" },
  MAINTENANCE_IN: { icon: <FaWrench size={12} />, color: "info" },
  MAINTENANCE_OUT: { icon: <FaWrench size={12} />, color: "warning" },
  REVERSAL: { icon: <FaUndoAlt size={12} />, color: "danger" },
};
const ACTION_DEFAULT: ActionColor = "warning";

interface MovementRow {
  id: string;
  movementId: string;
  date: string;
  type: MovementType;
  name: string;
  unit: string;
  reason?: string | null;
  custodian?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  status: "ACTIVE" | "CANCELLED";
}

function flattenMovements(list: Movement[]): MovementRow[] {
  const out: MovementRow[] = [];
  for (const m of list) {
    for (const d of m.items ?? []) {
      const name = d.device?.name ?? "—";
      const units = d.units ?? [];
      if (units.length > 0) {
        for (const u of units) {
          out.push({
            id: `${m.id}:${d.id}:${u.id}`,
            movementId: m.id,
            date: m.date,
            type: m.type,
            name,
            unit: u.deviceUnit?.assetTag ?? "—",
            reason: m.reason,
            custodian: m.custodian,
            user: m.createdBy,
            status: m.status,
          });
        }
      } else {
        out.push({
          id: `${m.id}:${d.id}`,
          movementId: m.id,
          date: m.date,
          type: m.type,
          name,
          unit: d.quantity > 1 ? `×${d.quantity}` : "—",
          reason: m.reason,
          custodian: m.custodian,
          user: m.createdBy,
          status: m.status,
        });
      }
    }
  }
  return out;
}

export default function MovementsPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeGroup | null>(null);
  const [stats, setStats] = useState<StatCounts>({ total: 0, retirements: 0, maintenance: 0 });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    inventoryApi.movements().then((list) => {
      const rows = flattenMovements(list);
      const counts: StatCounts = { total: rows.length, retirements: 0, maintenance: 0 };
      for (const r of rows) {
        if (GROUP_TYPES.retirements.includes(r.type)) counts.retirements += 1;
        else if (GROUP_TYPES.maintenance.includes(r.type)) counts.maintenance += 1;
      }
      setStats(counts);
    });
  }, [reloadKey]);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Record<string, unknown>>(async () => {
        const list = await inventoryApi.movements();
        const filtered = typeFilter ? list.filter((m) => GROUP_TYPES[typeFilter].includes(m.type)) : list;
        return flattenMovements(filtered) as unknown as Record<string, unknown>[];
      }),
    [typeFilter]
  );

  const applyFilter = (group: TypeGroup | null) => {
    setTypeFilter((prev) => (prev === group ? null : group));
    setReloadKey((k) => k + 1);
  };

  const revert = async (movementId: string) => {
    if (!window.confirm(t("movements.confirmRevert"))) return;
    try {
      await inventoryApi.revert(movementId);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      window.alert(e.message || "Error");
    }
  };

  const generateReport = async () => {
    setGeneratingPdf(true);
    try {
      const list = await inventoryApi.movements();
      await downloadReportMovementsPdf(list);
    } catch {
      window.alert(i18n.t("common:errors.report"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const statCardActive = (group: TypeGroup | null) => typeFilter === group;

  const columns: any[] = [
    {
      type: "date",
      key: "date",
      label: t("stockLedger.date"),
      sortable: false,
      render: (m: MovementRow) => <ITText className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{formatDateTime(m.date)}</ITText>,
    },
    {
      type: "string",
      key: "type",
      label: t("movements.colType"),
      sortable: false,
      filter: true,
      render: (m: MovementRow) => <ITBadget color={TYPE_BADGE_COLOR[m.type]} size="lg">{m.type}</ITBadget>,
    },
    {
      type: "string",
      key: "name",
      label: t("movements.colItem"),
      render: (m: MovementRow) => (
        <ITText className="text-[11px] text-slate-600 truncate">
          {m.name} {m.unit !== "—" && <b className="text-slate-800">· {m.unit}</b>}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "reason",
      label: t("movements.colComment"),
      render: (m: MovementRow) => <ITText className="text-[11px] text-slate-500">{m.reason || "—"}</ITText>,
    },
    {
      type: "string",
      key: "custodian",
      label: t("movements.colCustodian"),
      render: (m: MovementRow) => <ITText className="text-[11px] text-slate-600">{m.custodian?.name ?? m.user?.name ?? "—"}</ITText>,
    },
    {
      type: "string",
      key: "status",
      label: t("movements.colStatus"),
      render: (m: MovementRow) =>
        m.status === "CANCELLED" ? <ITBadget color="danger" size="lg">{t("movements.cancelled")}</ITBadget> : <ITBadget color="success" size="lg">{t("movements.activeLabel")}</ITBadget>,
    },
  ];

  return (
    <ITPage
      title={t("movements.title")}
      description={t("movements.description")}
      icon={<FaHistory size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("movements.title") }]}
      backAction={() => navigate("/inventory")}
      actions={
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="primary" onClick={generateReport} disabled={generatingPdf}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{generatingPdf ? t("new.saving") : t("movements.report")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/movements/new")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("movements.new")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={6} md={4}>
          <StatCard
            size="lg"
            icon={<FaHistory size={16} className="text-white" />}
            circleClass={statCardActive(null) ? "bg-slate-800 ring-4 ring-slate-200" : "bg-slate-800"}
            value={stats.total}
            label={t("movements.stats.total")}
            onClick={() => applyFilter(null)}
          />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <StatCard
            size="lg"
            icon={<FaTrash size={16} className="text-white" />}
            circleClass={statCardActive("retirements") ? "bg-red-500 ring-4 ring-red-200" : "bg-red-500"}
            value={stats.retirements}
            label={t("movements.stats.retirements")}
            onClick={() => applyFilter("retirements")}
          />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <StatCard
            size="lg"
            icon={<FaWrench size={16} className="text-white" />}
            circleClass={statCardActive("maintenance") ? "bg-sky-500 ring-4 ring-sky-200" : "bg-sky-500"}
            value={stats.maintenance}
            label={t("movements.stats.maintenance")}
            onClick={() => applyFilter("maintenance")}
          />
        </ITGrid>
      </ITGrid>

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        size="lg"
      />
    </ITPage>
  );
}