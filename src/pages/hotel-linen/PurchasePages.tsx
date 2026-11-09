import { useState } from "react";
import { ITButton, ITPage } from "@axzydev/axzy_ui_system";
import { FaPlus, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { PurchasesBoard } from "@features/hotel-linen/purchases";
import { useGoBack } from "@shared/lib/useGoBack";

export function LinenPurchasesPage() {
  const { t } = useTranslation("hotel-linen-purchase");
  const { t: tc } = useTranslation("common");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canCreate = useCan("hotel_purchase.create");
  const [newSignal, setNewSignal] = useState(0);
  return (
    <ITPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaShoppingCart size={20} />}
      breadcrumbs={[{ label: tc("breadcrumbs.home"), onClick: () => navigate("/") }, { label: tc("nav.linen") }, { label: t("title") }]}
      backAction={() => goBack("/")}
      actions={
        canCreate ? <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("orders.new")} onClick={() => setNewSignal((n) => n + 1)} /> : undefined
      }
    >
      <PurchasesBoard newSignal={newSignal} />
    </ITPage>
  );
}
