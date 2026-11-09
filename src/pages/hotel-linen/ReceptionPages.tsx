import { useState, type ReactNode } from "react";
import { ITPage } from "@axzydev/axzy_ui_system";
import { FaHandHolding, FaPlusSquare, FaTools } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoansView, ShiftClosesBoard } from "@features/hotel-linen/loans";
import { ExtrasView } from "@features/hotel-linen/extras";
import { EquipmentView } from "@features/hotel-linen/equipment";
import { useCosign } from "@features/hotel-linen/cosign";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

interface ShellProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

function Shell({ title, description, icon, children }: ShellProps) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={title}
      description={description}
      icon={icon}
      breadcrumbs={[{ label: t("breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("nav.linen") }, { label: title }]}
      backAction={() => goBack("/")}
    >
      {children}
    </ITPage>
  );
}

/** Préstamo de toallas por punto, corte de turno y su historial. */
export function LinenLoansPage() {
  const { t } = useTranslation("hotel-linen-reception");
  const cosign = useCosign();
  const [closes, setCloses] = useState(0);
  return (
    <Shell title={t("pages.loans.title")} description={t("pages.loans.description")} icon={<FaHandHolding size={20} />}>
      <div className="flex flex-col gap-4">
        <LoansView requestCosign={cosign.request} onClosed={() => setCloses((n) => n + 1)} />
        <ShiftClosesBoard reloadSignal={closes} />
      </div>
      {cosign.dialog}
    </Shell>
  );
}

/** Adicionales a habitación: Recepción registra, la supervisora entrega y recolecta. */
export function LinenExtrasPage() {
  const { t } = useTranslation("hotel-linen-reception");
  const cosign = useCosign();
  return (
    <Shell title={t("pages.extras.title")} description={t("pages.extras.description")} icon={<FaPlusSquare size={20} />}>
      <ExtrasView requestCosign={cosign.request} />
      {cosign.dialog}
    </Shell>
  );
}

/** Equipos por etiqueta y sus préstamos a habitación. */
export function LinenEquipmentPage() {
  const { t } = useTranslation("hotel-linen-reception");
  const cosign = useCosign();
  return (
    <Shell title={t("pages.equipment.title")} description={t("pages.equipment.description")} icon={<FaTools size={20} />}>
      <EquipmentView requestCosign={cosign.request} />
      {cosign.dialog}
    </Shell>
  );
}
