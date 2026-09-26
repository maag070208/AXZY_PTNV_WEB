import { useEffect } from "react";
import { ITPage } from "@axzydev/axzy_ui_system";
import { FaSlidersH } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { CatalogTabs } from "@widgets/catalog/tabs";

export default function CatalogPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["catalog", "common"]);
  const canAdminCatalogs = useCan("catalogs.manage");

  useEffect(() => {
    if (!canAdminCatalogs) navigate("/", { replace: true });
  }, [canAdminCatalogs, navigate]);

  if (!canAdminCatalogs) return null;

  return (
    <ITPage
      title={tt("title")}
      description={tt("description")}
      backAction={() => navigate(-1)}
      icon={<FaSlidersH size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("title") },
      ]}
    >
      <CatalogTabs />
    </ITPage>
  );
}