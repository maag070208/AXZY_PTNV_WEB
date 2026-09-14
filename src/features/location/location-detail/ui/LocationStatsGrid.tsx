import { ITGrid } from "@axzydev/axzy_ui_system";
import { FaBoxes, FaFileSignature, FaMapMarkerAlt, FaSitemap } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { StatCard } from "@shared/ui/stat-card";
import type { Location } from "@entities/location";

export default function LocationStatsGrid({ loc }: { loc: Location }) {
  const { t } = useTranslation(["locations"]);
  const withCarta = (loc.devices ?? []).filter((d) => (d.cartaItems ?? []).length > 0).length;

  return (
    <ITGrid container columns={12} spacing={4}>
      <ITGrid item xs={12} sm={6} md={3}>
        <StatCard
          size="lg"
          icon={<FaBoxes size={20} className="text-white" />}
          circleClass="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200"
          value={loc._count?.devices ?? 0}
          label={t("detail.devices")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={3}>
        <StatCard
          size="lg"
          icon={<FaFileSignature size={20} className="text-white" />}
          circleClass="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200"
          value={withCarta}
          label={t("detail.withCarta")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={3}>
        <StatCard
          size="lg"
          icon={<FaMapMarkerAlt size={20} className="text-white" />}
          circleClass="bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-200"
          value={loc._count?.cartas ?? 0}
          label={t("detail.cartas")}
        />
      </ITGrid>
      <ITGrid item xs={12} sm={6} md={3}>
        <StatCard
          size="lg"
          icon={<FaSitemap size={20} className="text-white" />}
          circleClass="bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-200"
          value={loc.sublugares?.length ?? 0}
          label={t("detail.areas")}
        />
      </ITGrid>
    </ITGrid>
  );
}