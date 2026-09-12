import {
  ITButton,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaFileSignature } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppDispatch, RootState } from "@core/store/store";
import { resetDraft } from "@entities/carta";
import { CartasTable } from "@widgets/carta/cartas-table";

export default function CartasListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation(["cartas", "common"]);
  const authUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = authUser?.role === "ADMIN" || authUser?.role === "GERENTE";

  const handleNew = () => {
    dispatch(resetDraft());
    navigate("/cartas/nueva");
  };

  return (
    <ITPage
      title={isAdmin ? t("list.title") : t("list.titleMine")}
      backAction={() => navigate(-1)}
      description={t("list.description")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: isAdmin ? t("list.breadcrumb") : t("list.breadcrumbMine") },
      ]}
      actions={
        isAdmin ? (
          <ITFlex gap={2}>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleNew}
            >
              <ITFlex align="center" gap={1}>
                <FaFileSignature size={14} />
                <ITText className="font-bold text-[11px]">{t("list.new")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        ) : undefined
      }
    >
      <CartasTable />
    </ITPage>
  );
}