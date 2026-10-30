import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITChip, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { FaFileSignature, FaUndoAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type LoanReturn } from "@entities/inventory";
import { useGoBack } from "@shared/lib/useGoBack";

export default function ReturnsPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<LoanReturn>(() => inventoryApi.returns(), {
        loan: { value: (d) => d.loan?.number },
        assigned: { value: (d) => d.loan?.custodian?.name ?? d.loan?.department?.name },
        item: {
          value: (d) =>
            d.items.flatMap((x) => [
              x.device?.name,
              x.device?.brand,
              x.device?.model,
              t(`loanReturn.conditionLabels.${x.condition}`),
            ]),
        },
      }),
    [t]
  );

  const columns: any[] = [
    {
      type: "string",
      key: "number",
      label: t("loanReturn.colNumber"),
      width: 150,
      sortable: false,
      filter: true,
      render: (d: LoanReturn) => <ITText className="text-[11px] font-bold text-slate-800">{d.number}</ITText>,
    },
    {
      type: "string",
      key: "loan",
      label: t("loanReturn.colLoan"),
      width: 160,
      filter: true,
      sortable: false,
      render: (d: LoanReturn) => (
        <ITButton
          variant="text"
          color="primary"
          size="lg"
          onClick={() => navigate(`/inventory/loans/${d.loanId}`)}
        >
          <ITFlex align="center" gap={1}>
            <FaFileSignature size={11} />
            <ITText className="font-bold text-[11px] underline">{d.loan?.number ?? "—"}</ITText>
          </ITFlex>
        </ITButton>
      ),
    },
    {
      type: "string",
      key: "assigned",
      label: t("loanReturn.colAssigned"),
      width: 200,
      filter: true,
      sortable: false,
      render: (d: LoanReturn) => {
        const name = d.loan?.custodian?.name ?? d.loan?.department?.name ?? "—";
        return (
          <ITFlex align="center" gap={2} className="min-w-0">
            {d.loan?.custodian?.name && <ProfileAvatar name={name} size="xs" />}
            <ITText className="truncate text-[11px] text-slate-600">{name}</ITText>
          </ITFlex>
        );
      },
    },
    {
      type: "date",
      key: "date",
      label: t("loanReturn.colDate"),
      width: 190,
      sortable: false,
      filter: "date-range",
      dateFilterOptions: { maxDate: new Date() },
      render: (d: LoanReturn) => <ITText className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(d.date)}</ITText>,
    },
    {
      type: "string",
      key: "item",
      label: t("loanReturn.colItem"),
      width: 300,
      filter: true,
      render: (d: LoanReturn) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {d.items.map((x) => (
            <ITFlex key={x.id} align="center" gap={1.5} className="min-w-0">
              <ITText className="text-[11px] text-slate-600 truncate">{x.device?.name ?? "—"}</ITText>
              <ITChip size="sm" color="gray">×{x.quantity}</ITChip>
              <ITChip
                size="sm"
                color={x.condition === "GOOD" ? "success" : x.condition === "FAIR" ? "info" : x.condition === "POOR" ? "warning" : "danger"}
              >
                {t(`loanReturn.conditionLabels.${x.condition}`)}
              </ITChip>
            </ITFlex>
          ))}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "action",
      label: "",
      width: 140,
      render: (d: LoanReturn) => (
        <ITButton variant="outlined" color="secondary" size="lg" onClick={() => navigate(`/inventory/loans/${d.loanId}`)}>
          <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
        </ITButton>
      ),
    },
  ];

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("loanReturn.title")}
      description={t("loanReturn.description")}
      icon={<FaUndoAlt size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loanReturn.title") }]}
      backAction={() => goBack("/inventory")}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/returns/new")}>
          <ITFlex align="center" gap={1}>
            <FaUndoAlt size={12} />
            <ITText className="font-bold text-[11px]">{t("loanReturn.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        size="lg"
        onRowClick={(row) => navigate(`/inventory/loans/${(row as unknown as LoanReturn).loanId}`)}
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={50}
        virtualized
        virtualizedMaxHeight={460}
      />
    </ITPage>
  );
}