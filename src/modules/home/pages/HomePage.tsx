import { ITCard, ITFlex, ITGrid, ITPage, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaBuilding,
  FaChartBar,
  FaFileSignature,
  FaHouseUser,
  FaLaptop,
  FaBoxes,
  FaTicketAlt,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@core/store/store";
import { cartasApi } from "@core/api/cartas.api";
import { devicesApi } from "@core/api/devices.api";
import { departmentsApi } from "@core/api/departments.api";
import { usersApi } from "@core/api/auth.api";
import { ticketsApi } from "@core/api/tickets.api";

interface HomeModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  count?: number;
}

type Counts = Record<string, number>;

export default function HomePage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const [counts, setCounts] = useState<Counts>({});

  const isAdmin = user?.role === "ADMIN" || user?.role === "GERENTE";
  const isJefeArea = user?.role === "JEFE_DE_AREA";
  const canManage = isAdmin || isJefeArea;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const jobs: Array<[string, Promise<{ total: number }>]> = [];
      if (canManage || user?.role === "EMPLEADO") {
        jobs.push(["cartas", cartasApi.table({ page: 1, limit: 1, filters: {} })]);
        jobs.push(["tickets", ticketsApi.table({ page: 1, limit: 1, filters: {} })]);
      }
      if (canManage) {
        jobs.push(["empleados", usersApi.table({ page: 1, limit: 1, filters: { role: "EMPLEADO" } })]);
      }
      if (isAdmin) {
        jobs.push(["dispositivos", devicesApi.table({ page: 1, limit: 1, filters: {} })]);
        jobs.push(["departamentos", departmentsApi.table({ page: 1, limit: 1, filters: {} })]);
        jobs.push(["usuarios", usersApi.table({ page: 1, limit: 1, filters: {} })]);
      }
      const results = await Promise.allSettled(jobs.map(([, p]) => p));
      if (cancelled) return;
      const next: Counts = {};
      jobs.forEach(([key], i) => {
        const r = results[i];
        if (r.status === "fulfilled") next[key] = r.value.total;
      });
      setCounts(next);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [canManage, isAdmin, user?.role]);

  const modules: HomeModule[] = [
    // EMPLEADO: solo cartas y tickets
    ...(!canManage && user?.role === "EMPLEADO"
      ? [
          {
            id: "cartas",
            title: "Mis Cartas",
            description: "Cartas responsivas asignadas a ti",
            icon: <FaFileSignature size={22} />,
            to: "/cartas",
            count: counts.cartas,
          },
          {
            id: "tickets",
            title: "Mis Tickets",
            description: "Tickets que has creado o te fueron asignados",
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
            title: "Cartas Responsivas",
            description: "Genera y administra cartas responsivas del departamento de Mantenimiento",
            icon: <FaFileSignature size={22} />,
            to: "/cartas",
            count: counts.cartas,
          },
          {
            id: "tickets",
            title: "Tickets",
            description: "Gestiona tickets de soporte y mantenimiento",
            icon: <FaTicketAlt size={22} />,
            to: "/tickets",
            count: counts.tickets,
          },
          {
            id: "reportes",
            title: "Reportes",
            description: "Consulta entregas y devoluciones de equipo por periodo",
            icon: <FaChartBar size={22} />,
            to: "/reportes",
            count: undefined,
          },
          {
            id: "empleados",
            title: "Empleados",
            description: "Catálogo de empleados que reciben equipo",
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
            title: "Dispositivos",
            description: "Control de activos y estados de cada equipo",
            icon: <FaLaptop size={22} />,
            to: "/dispositivos",
            count: counts.dispositivos,
          },
          {
            id: "inventario",
            title: "Inventario",
            description: "Movimientos, kardex y ubicaciones de equipos",
            icon: <FaBoxes size={22} />,
            to: "/inventario",
          },
          {
            id: "departamentos",
            title: "Departamentos",
            description: "Estructura organizacional y subáreas",
            icon: <FaBuilding size={22} />,
            to: "/departamentos",
            count: counts.departamentos,
          },
          {
            id: "usuarios",
            title: "Usuarios",
            description: "Administración de accesos al sistema",
            icon: <FaUserShield size={22} />,
            to: "/usuarios",
            count: counts.usuarios,
          },
        ]
      : []),
  ];

  return (
    <ITPage
      title="Inicio"
      description="Panel de control de Cartas Responsivas · Puerto Nuevo Hotel y Villas"
      icon={<FaHouseUser size={20} />}
      maxWidth="6xl"
    >
      <ITStack direction="column" spacing={6}>
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
      </ITStack>
    </ITPage>
  );
}