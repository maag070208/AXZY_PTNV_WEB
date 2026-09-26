import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaFileSignature, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type Loan } from "@entities/inventory";
import { downloadCustodyLetterPdf } from "@widgets/custody-letter";

const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  ACTIVE: "success",
  PARTIAL: "warning",
  RETURNED: "gray",
  CANCELLED: "danger",
};

export default function LoansPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Record<string, unknown>>(async () => {
        const list = await inventoryApi.loans();
        return list as unknown as Record<string, unknown>[];
      }),
    []
  );

  useEffect(() => {
    // Precarga (para el conteo en cabecera, si hiciera falta).
  }, []);

  const columns: any[] = [
    {
      type: "string",
      key: "number",
      label: t("loans.colNumber"),
      sortable: false,
      filter: true,
      render: (p: Loan) => <ITText className="text-[11px] font-bold text-slate-800">{p.number}</ITText>,
    },
    {
      type: "string",
      key: "custodian",
      label: t("loans.colCustodian"),
      filter: true,
      render: (p: Loan) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {p.custodian ? (
            <>
              <ITBadget color="success" size="lg">{t("loans.toEmployee")}</ITBadget>
              <ITText className="text-[11px] text-slate-600">{p.custodian.name}</ITText>
            </>
          ) : p.department ? (
            <>
              <ITBadget color="info" size="lg">{t("loans.toDepartment")}</ITBadget>
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
      sortable: false,
      render: (p: Loan) => <ITText className="text-[11px] text-slate-500">{formatDate(p.date)}</ITText>,
    },
    {
      type: "string",
      key: "item",
      label: t("loans.colItem"),
      render: (p: Loan) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {p.items.map((d) => {
            const pending = d.quantity - d.returnedQuantity;
            return (
              <ITText key={d.id} className="text-[10px] leading-tight">
                <span className="font-bold text-slate-700">{d.device?.name}</span> <span className="text-slate-400">×{d.quantity}</span>
                <span className="text-emerald-600"> · {t("loanReturn.returnedQuantity")} {d.returnedQuantity}</span>
                {pending > 0 && <span className="text-amber-600"> · {t("loanReturn.pending")} {pending}</span>}
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
      render: (p: Loan) => <ITBadget color={STATUS_COLOR[p.status]} size="lg">{p.status}</ITBadget>,
    },
    {
      type: "string",
      key: "action",
      label: "",
      render: (p: Loan) => (
        <ITFlex gap={1.5}>
          <ITButton variant="outlined" color="primary" size="lg" onClick={() => navigate(`/inventory/loans/${p.id}`)}>
            <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
          </ITButton>
          <ITButton variant="outlined" color="secondary" size="lg" onClick={() => downloadCustodyLetterPdf(p)} title={t("loans.custodyLetterPdf")}>
            <FaFilePdf className="text-red-600" size={13} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title={t("loans.title")}
      description={t("loans.description")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title") }]}
      backAction={() => navigate("/inventory")}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/loans/new")}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("loans.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        size="lg"
      />
    </ITPage>
  );
}