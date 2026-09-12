import { ITPage, ITStack } from "@axzydev/axzy_ui_system";
import { FaHouseUser } from "react-icons/fa";
import {
  useHomeDashboard,
  DashboardModulesGrid,
} from "@features/home/dashboard";

export default function HomePage() {
  const fx = useHomeDashboard();

  return (
    <ITPage
      title="Inicio"
      description="Panel de control de Cartas Responsivas · Puerto Nuevo Hotel y Villas"
      icon={<FaHouseUser size={20} />}
      maxWidth="6xl"
    >
      <ITStack direction="column" spacing={6}>
        <DashboardModulesGrid fx={fx} />
      </ITStack>
    </ITPage>
  );
}