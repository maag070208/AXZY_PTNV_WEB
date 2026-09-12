import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITLoader,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaLayerGroup } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GenerateCartasResult } from "@entities/carta";
import type { DeviceType } from "@entities/device-type";

interface Props {
  types: DeviceType[];
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
  typeId: string;
  onTypeIdChange: (v: string) => void;
  generating: boolean;
  onGenerate: () => void;
  result: GenerateCartasResult | null;
}

export default function GenerarCartasForm({
  types,
  loading,
  error,
  onDismissError,
  typeId,
  onTypeIdChange,
  generating,
  onGenerate,
  result,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation("cartas");

  return (
    <>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={onDismissError}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        {loading ? (
          <ITFlex justify="center" className="py-8">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        ) : (
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={7}>
              <ITSelect
                name="typeId"
                label={t("generate.type")}
                options={types.map((t) => ({
                  value: t.id,
                  label: `${t.name} · ${t.code}`,
                }))}
                value={typeId}
                onChange={(e) => onTypeIdChange(e.target.value)}
                disabled={types.length === 0}
              />
            </ITGrid>

            <ITGrid item xs={12}>
              <ITFlex justify="end" gap={2}>
                <ITButton variant="outlined" onClick={() => navigate("/cartas")}>
                  {t("generate.cancel")}
                </ITButton>
                <ITButton
                  variant="filled"
                  color="primary"
                  onClick={onGenerate}
                  disabled={generating || !typeId}
                >
                  <ITFlex align="center" gap={1}>
                    <FaLayerGroup size={12} />
                    <ITText className="font-bold text-[11px]">
                      {generating ? t("generate.generating") : t("generate.generate")}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITGrid>
          </ITGrid>
        )}
      </ITCard>

      {result && (
        <ITCard className="p-6 mt-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
          <ITFlex direction="column" gap={3}>
            <ITAlert variant="success" title={t("generate.generated")}>
              {t("generate.generatedOfType", { name: result.tipo.name })}
            </ITAlert>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {t("generate.folioGenerated")}
              </ITText>
              <ITFlex wrap="wrap" gap={2}>
                <ITBadget color="primary" size="small">
                  {result.carta.consecutivo}
                </ITBadget>
              </ITFlex>
            </ITFlex>
            <ITFlex justify="end" gap={2}>
              <ITButton variant="filled" color="primary" onClick={() => navigate("/cartas")}>
                <ITFlex align="center" gap={1}>
                  <FaFileSignature size={12} />
                  <ITText className="font-bold text-[11px]">{t("generate.goToList")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITCard>
      )}
    </>
  );
}