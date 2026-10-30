import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITChip, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { LangostinState } from "@shared/ui/langostin";
import { ListSummaryStrip, type ListSummaryItem } from "@shared/ui/list-summary-strip";
import { FaFilePdf, FaFileSignature, FaPlus } from "react-icons/fa";
import { LuFileText, LuHourglass, LuPackageCheck, LuPackageOpen } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type Loan } from "@entities/inventory";
import { downloadCustodyLetterPdf } from "@widgets/custody-letter";
import { useGoBack } from "@shared/lib/useGoBack";

const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  ACTIVE: "success",
  PARTIAL: "warning",
  RETURNED: "gray",
  CANCELLED: "danger",
};

type Filter = "all" | "ACTIVE" | "PARTIAL" | "RETURNED";

/** Piezas que aún no regresan de un préstamo. */
const pendingPieces = (p: Loan) => p.items.reduce((acc, d) => acc + (d.quantity - d.returnedQuantity), 0);

export default function LoansPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(() => {
    setFailed(false);
    setLoans(null);
    inventoryApi
      .loans()
      .then(setLoans)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Totales reales de la lista; cada mosaico filtra por estado al hacer clic.
  const summary = useMemo<ListSummaryItem[]>(() => {
    const rows = loans ?? [];
    const count = (status: Loan["status"]) => rows.filter((p) => p.status === status).length;
    const pending = rows.filter((p) => p.status === "ACTIVE" || p.status === "PARTIAL").reduce((acc, p) => acc + pendingPieces(p), 0);
    return [
      { id: "all", label: t("loans.summaryTotal"), value: rows.length, tone: "sea", icon: <LuFileText size={15} /> },
      {
        id: "ACTIVE",
        label: t("loans.summaryActive"),
        value: count("ACTIVE"),
        tone: "mint",
        icon: <LuPackageOpen size={15} />,
        caption: t("loans.summaryPending", { count: pending }),
      },
      { id: "PARTIAL", label: t("loans.summaryPartial"), value: count("PARTIAL"), tone: "sun", icon: <LuHourglass size={15} /> },
      { id: "RETURNED", label: t("loans.summaryReturned"), value: count("RETURNED"), tone: "lavender", icon: <LuPackageCheck size={15} /> },
    ];
  }, [loans, t]);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Loan>(async () => (loans ?? []).filter((p) => filter === "all" || p.status === filter), {
        custodian: {
          value: (p) =>
            p.custodian
              ? [p.custodian.name, p.custodian.employeeNumber]
              : [p.department?.name, p.subarea?.name],
        },
        item: { value: (p) => p.items.flatMap((d) => [d.device?.name, d.device?.brand, d.device?.model]) },
        status: { match: "equals" },
      }),
    [loans, filter]
  );

  // La lista no trae las unidades físicas (activo fijo, número de serie): la
  // carta se genera con el préstamo completo, igual que desde su detalle.
  const downloadLetter = async (id: string) => {
    try {
      await downloadCustodyLetterPdf(await inventoryApi.getLoan(id));
    } catch {
      window.alert(t("common:errors.report"));
    }
  };

  const columns: any[] = [
    {
      type: "string",
      key: "number",
      label: t("loans.colNumber"),
      width: 150,
      sortable: false,
      filter: true,
      render: (p: Loan) => <ITText className="text-[11px] font-bold text-slate-800">{p.number}</ITText>,
    },
    {
      type: "string",
      key: "custodian",
      label: t("loans.colCustodian"),
      width: 240,
      filter: true,
      sortable: false,
      render: (p: Loan) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {p.custodian ? (
            <>
              <ITChip size="sm" color="success">{t("loans.toEmployee")}</ITChip>
              <ITFlex align="center" gap={2} className="min-w-0">
                <ProfileAvatar name={p.custodian.name} size="xs" />
                <ITText className="truncate text-[11px] text-slate-600">{p.custodian.name}</ITText>
              </ITFlex>
            </>
          ) : p.department ? (
            <>
              <ITChip size="sm" color="info">{t("loans.toDepartment")}</ITChip>
              <ITText className="text-[11px] text-slate-600">
                {p.department.name}{p.subarea ? ` — ${p.subarea.name}` : ""}
              </ITText>
            </>
          ) : (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "date",
      key: "date",
      label: t("loans.colDate"),
      width: 190,
      sortable: false,
      filter: "date-range",
      dateFilterOptions: { maxDate: new Date() },
      render: (p: Loan) => <ITText className="text-[11px] text-slate-500">{formatDate(p.date)}</ITText>,
    },
    {
      type: "string",
      key: "item",
      label: t("loans.colItem"),
      width: 300,
      filter: true,
      render: (p: Loan) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {p.items.map((d) => {
            const pending = d.quantity - d.returnedQuantity;
            return (
              <ITText key={d.id} className="text-[10px] leading-tight">
                <ITText as="span" className="font-bold text-slate-700">{d.device?.name}</ITText> <ITText as="span" className="text-slate-400">×{d.quantity}</ITText>
                <ITText as="span" className="text-slate-500"> · {t("loanReturn.returnedQuantity")} {d.returnedQuantity}</ITText>
                {pending > 0 && <ITText as="span" className="font-semibold text-[color:var(--color-warning)]"> · {t("loanReturn.pending")} {pending}</ITText>}
              </ITText>
            );
          })}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "status",
      label: t("loans.colStatus"),
      width: 130,
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: (Object.keys(STATUS_COLOR) as Loan["status"][]).map((id) => ({ id, name: t(`loanStatus.${id}`) })),
      },
      render: (p: Loan) => <ITChip size="sm" color={STATUS_COLOR[p.status]}>{t(`loanStatus.${p.status}`)}</ITChip>,
    },
    {
      type: "string",
      key: "action",
      label: "",
      width: 160,
      render: (p: Loan) => (
        <ITFlex gap={1.5}>
          <ITButton variant="outlined" color="primary" size="lg" onClick={() => navigate(`/inventory/loans/${p.id}`)}>
            <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
          </ITButton>
          <ITButton variant="outlined" color="secondary" size="lg" onClick={() => void downloadLetter(p.id)} title={t("loans.custodyLetterPdf")}>
            <FaFilePdf className="text-red-600" size={13} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  const newButton = (
    <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/loans/new")}>
      <ITFlex align="center" gap={1}>
        <FaPlus size={12} />
        <ITText className="font-bold text-[11px]">{t("loans.new")}</ITText>
      </ITFlex>
    </ITButton>
  );

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("loans.title")}
      description={t("loans.description")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title") }]}
      backAction={() => goBack("/inventory")}
      actions={newButton}
    >
      {failed ? (
        <LangostinState
          kind="error"
          description={t("common:errors.load")}
          action={
            <ITButton variant="outlined" color="primary" onClick={load}>
              <ITText className="font-bold text-[11px]">{t("ui.retry")}</ITText>
            </ITButton>
          }
        />
      ) : loans === null ? (
        <LangostinState kind="loading" />
      ) : loans.length === 0 ? (
        <LangostinState kind="empty" title={t("loans.empty")} description={t("loans.emptyHint")} action={newButton} />
      ) : (
        <>
          <ListSummaryStrip items={summary} activeId={filter} onSelect={(id) => setFilter(id as Filter)} />
          <ITDataTable showViewToggle={false}
            columns={columns as any}
            fetchData={fetchData as any}
            reloadTrigger={filter}
            onRowClick={(row) => navigate(`/inventory/loans/${(row as unknown as Loan).id}`)}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50, 100]}
            layout="fixed"
            density="compact"
            rowHeight={50}
            virtualized
            virtualizedMaxHeight={460}
          />
        </>
      )}
    </ITPage>
  );
}