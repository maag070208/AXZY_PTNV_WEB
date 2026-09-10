import { ITPage, ITTabs } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaChartBar, FaHandHolding } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AsignadosTab from "../components/AsignadosTab";
import DevicesTab from "../components/DevicesTab";

export default function ReportesPage() {
  const navigate = useNavigate();

  return (
    <ITPage
      title="Reportes"
      description="Consulta asignaciones e inventario de dispositivos"
      backAction={() => navigate(-1)}
      icon={<FaChartBar size={20} />}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Reportes" },
      ]}
    >
      <ITTabs
        variant="line"
        items={[
          {
            id: "asignados",
            label: "Asignados",
            icon: <FaHandHolding size={13} />,
            content: <AsignadosTab />,
          },
          {
            id: "dispositivos",
            label: "Dispositivos",
            icon: <FaBoxOpen size={13} />,
            content: <DevicesTab />,
          },
        ]}
      />
    </ITPage>
  );
}
