import { useEffect } from "react";
import { ITPage } from "@axzydev/axzy_ui_system";
import { FaSlidersH } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { CatalogTabs } from "@widgets/catalog/tabs";

export default function CatalogPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["catalog", "common"]);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin, navigate]);

  if (!isAdmin) return null;

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