import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaTicketAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { STATUS_BADGE, PRIORITY_BADGE } from "@entities/ticket";
import type { Department } from "@entities/department";

interface Props {
  dept: Department;
}

function AsideSection({
  icon,
  iconBg,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-5">
      <ITFlex justify="between" align="center" gap={2} className="mb-4">
        <ITFlex align="center" gap={2}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500 truncate">
            {title}
          </ITText>
        </ITFlex>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-black shrink-0">
          {count}
        </span>
      </ITFlex>
      {children}
    </div>
  );
}

export default function DepartmentDetailAside({ dept }: Props) {
  const { t: tt } = useTranslation(["departments", "tickets", "common"]);
  const navigate = useNavigate();

  const tickets = dept.tickets ?? [];
  const custodyLetters = dept.custodyLetters ?? [];

  return (
    <div className="w-full min-w-0 flex flex-col gap-5 md:sticky md:top-24">
      <AsideSection
        icon={<FaTicketAlt size={12} className="text-white" />}
        iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
        title={tt("detail.ticketsTitle")}
        count={dept.ticketsTotal ?? tickets.length}
      >
        {tickets.length === 0 ? (
          <ITText className="text-[12px] font-bold text-slate-400">
            {tt("detail.noTickets")}
          </ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tickets/${t.id}`)}
                className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 p-2.5 transition-colors"
              >
                <ITFlex justify="between" align="start" gap={2}>
                  <ITText className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2 flex-1">
                    {t.title}
                  </ITText>
                  <ITBadget color={STATUS_BADGE[t.status]?.color as any} size="lg">
                    {tt(`tickets:statusLabels.${t.status}`)}
                  </ITBadget>
                </ITFlex>
                <ITFlex justify="between" align="center" gap={2} className="mt-1.5">
                  <ITBadget color={PRIORITY_BADGE[t.priority]?.color as any} size="lg">
                    {tt(`tickets:priorityLabels.${t.priority}`)}
                  </ITBadget>
                  <ITText className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDate(t.createdAt)}
                  </ITText>
                </ITFlex>
              </div>
            ))}
          </ITFlex>
        )}
      </AsideSection>

      <AsideSection
        icon={<FaFileSignature size={12} className="text-white" />}
        iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        title={tt("detail.custodyLettersTitle")}
        count={dept.custodyLettersTotal ?? custodyLetters.length}
      >
        {custodyLetters.length === 0 ? (
          <ITText className="text-[12px] font-bold text-slate-400">
            {tt("detail.noCustodyLetters")}
          </ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {custodyLetters.map((c) => {
              const returned = !!c.returnDate;
              const custodian = c.custodian?.name ?? c.supervisor?.name;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/inventory/loans/${c.id}`)}
                  className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 p-2.5 transition-colors"
                >
                  <ITFlex justify="between" align="center" gap={2}>
                    <ITText className="font-mono font-bold text-[11px] text-blue-600">
                      {c.consecutive}
                    </ITText>
                    <ITBadget color={returned ? "gray" : "success"} size="lg">
                      {returned ? tt("detail.custodyLetterReturned") : tt("detail.custodyLetterActive")}
                    </ITBadget>
                  </ITFlex>
                  <ITFlex justify="between" align="center" gap={2} className="mt-1.5">
                    <ITText className="text-[10px] text-slate-500 truncate">
                      {custodian ?? "—"}
                    </ITText>
                    <ITText className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDate(c.date)}
                    </ITText>
                  </ITFlex>
                </div>
              );
            })}
          </ITFlex>
        )}
      </AsideSection>
    </div>
  );
}
