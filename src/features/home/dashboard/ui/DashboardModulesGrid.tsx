import { ITCard, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBoxes,
  FaBuilding,
  FaChartBar,
  FaFileSignature,
  FaLaptop,
  FaTasks,
  FaTicketAlt,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { UseHomeDashboard } from "../model/useHomeDashboard";

interface HomeModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  count?: number;
}

export default function DashboardModulesGrid({ fx }: { fx: UseHomeDashboard }) {
  const navigate = useNavigate();
  const { t, user, canManage, isAdmin, counts } = fx;

  const modules: HomeModule[] = [
    // EMPLEADO: solo cartas y tickets
    ...(!canManage && user?.role === "EMPLEADO"
      ? [
          {
            id: "misTareas",
            title: t("modules.misTareasTitle"),
            description: t("modules.misTareasDescription"),
            icon: <FaTasks size={22} />,
            to: "/tickets/mis-tareas",
          },
          {
            id: "misCartas",
            title: t("modules.misCartasTitle"),
            description: t("modules.misCartasDescription"),
            icon: <FaFileSignature size={22} />,
            to: "/cartas",
            count: counts.cartas,
          },
          {
            id: "misTickets",
            title: t("modules.misTicketsTitle"),
            description: t("modules.misTicketsDescription"),
            icon: <FaTicketAlt size={22} />,
            to: "/tickets",
            count: counts.tickets,
          },
        ]
      : []),
    // ADMIN/GERENTE/JEFE_DE_AREA: cartas, tickets, reportes, empleados
    ...(canManage
      ? [
          {
            id: "cartas",
            title: t("modules.cartasTitle"),
            description: t("modules.cartasDescription"),
            icon: <FaFileSignature size={22} />,
            to: "/cartas",
            count: counts.cartas,
          },
          {
            id: "tickets",
            title: t("modules.ticketsTitle"),
            description: t("modules.ticketsDescription"),
            icon: <FaTicketAlt size={22} />,
            to: "/tickets",
            count: counts.tickets,
          },
          {
            id: "reportes",
            title: t("modules.reportesTitle"),
            description: t("modules.reportesDescription"),
            icon: <FaChartBar size={22} />,
            to: "/reportes",
            count: undefined,
          },
          {
            id: "empleados",
            title: t("modules.empleadosTitle"),
            description: t("modules.empleadosDescription"),
            icon: <FaUserTie size={22} />,
            to: "/empleados",
            count: counts.empleados,
          },
        ]
      : []),
    // Solo ADMIN: dispositivos, departamentos, usuarios
    ...(isAdmin
      ? [
          {
            id: "dispositivos",
            title: t("modules.dispositivosTitle"),
            description: t("modules.dispositivosDescription"),
            icon: <FaLaptop size={22} />,
            to: "/dispositivos",
            count: counts.dispositivos,
          },
          {
            id: "inventario",
            title: t("modules.inventarioTitle"),
            description: t("modules.inventarioDescription"),
            icon: <FaBoxes size={22} />,
            to: "/inventario",
          },
          {
            id: "departamentos",
            title: t("modules.departamentosTitle"),
            description: t("modules.departamentosDescription"),
            icon: <FaBuilding size={22} />,
            to: "/departamentos",
            count: counts.departamentos,
          },
          {
            id: "usuarios",
            title: t("modules.usuariosTitle"),
            description: t("modules.usuariosDescription"),
            icon: <FaUserShield size={22} />,
            to: "/usuarios",
            count: counts.usuarios,
          },
        ]
      : []),
  ];

  return (
    <ITGrid container columns={12} spacing={3}>
      {modules.map((m) => (
        <ITGrid item key={m.id} xs={12} md={6} lg={4}>
          <ITCard onClick={() => navigate(m.to)} className="!p-4">
            <ITFlex align="center" gap={3}>
              <ITFlex
                align="center"
                justify="center"
                className="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600"
              >
                {m.icon}
              </ITFlex>
              <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
                <ITText className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                  {m.title}
                </ITText>
                <ITText className="text-[10px] font-bold text-slate-400 leading-tight line-clamp-2">
                  {m.description}
                </ITText>
              </ITFlex>
              {m.count !== undefined && (
                <ITText className="text-lg font-black text-emerald-600 leading-none shrink-0">
                  {m.count}
                </ITText>
              )}
            </ITFlex>
          </ITCard>
        </ITGrid>
      ))}
    </ITGrid>
  );
}