import { ITPage } from "@axzydev/axzy_ui_system";
import { FaFileSignature } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGenerarCartas,
  GenerarCartasForm,
} from "@features/carta/generar-cartas";

export default function GenerarCartasPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("cartas");
  const {
    types,
    loading,
    error,
    setError,
    typeId,
    setTypeId,
    generating,
    handleGenerate,
    result,
  } = useGenerarCartas();

  return (
    <ITPage
      title={t("generate.title")}
      description={t("generate.description")}
      backAction={() => navigate(-1)}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: "Cartas", onClick: () => navigate("/cartas") },
        { label: t("generate.breadcrumb") },
      ]}
    >
      <GenerarCartasForm
        types={types}
        loading={loading}
        error={error}
        onDismissError={() => setError(null)}
        typeId={typeId}
        onTypeIdChange={setTypeId}
        generating={generating}
        onGenerate={handleGenerate}
        result={result}
      />
    </ITPage>
  );
}