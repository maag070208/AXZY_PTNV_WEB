import { ITPage } from "@axzydev/axzy_ui_system";
import { FaLaptopCode } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { Langostin } from "@shared/ui/langostin";
import { LangostinGallery } from "@features/langostin/gallery";

/**
 * Galería de Langostin: la mascota, sus 36 animaciones y los 8 escenarios
 * donde vive (los fondos se dibujan en canvas, sin imágenes).
 */
export default function LangostinPage() {
  const { t: tt } = useTranslation(["langostin", "common"]);

  return (
    <ITPage
      className="m-0! p-0! px-8! min-w-full!"
      noPadding
      title={tt("title")}
      description={tt("description")}
      icon={<FaLaptopCode size={20} />}
      maxWidth="7xl"
      actions={<Langostin anim="wave" size={30} />}
    >
      <LangostinGallery />
    </ITPage>
  );
}
