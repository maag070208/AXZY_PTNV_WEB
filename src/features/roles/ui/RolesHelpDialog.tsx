import { ITBadget, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";

interface ScopeRow {
  key: string;
  label: string;
  example: string;
  color: "gray" | "info" | "warning";
}

interface RolesHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Ayuda de la pantalla de roles: qué es un permiso, qué significan los alcances
 * de datos (en palabras simples) y a quién aplica un cambio.
 */
export default function RolesHelpDialog({ isOpen, onClose }: RolesHelpDialogProps) {
  const { t } = useTranslation("roles");

  const scopes: ScopeRow[] = [
    { key: "OWN", label: t("scopePlain.OWN"), example: t("help.scopeOwnExample"), color: "gray" },
    { key: "AREA", label: t("scopePlain.AREA"), example: t("help.scopeAreaExample"), color: "info" },
    { key: "ALL", label: t("scopePlain.ALL"), example: t("help.scopeAllExample"), color: "warning" },
  ];

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={t("help.title")}>
      <ITFlex direction="column" gap={4} className="max-h-[70vh] overflow-y-auto pr-1">
        <ITText className="text-xs leading-relaxed text-slate-600">
          {t("help.intro")}
        </ITText>

        <ITFlex direction="column" gap={1}>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t("help.howTitle")}
          </ITText>
          <ITText className="text-xs leading-relaxed text-slate-600">
            {t("help.howBody")}
          </ITText>
        </ITFlex>

        <ITFlex direction="column" gap={2}>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t("help.scopeTitle")}
          </ITText>
          <ITText className="text-xs leading-relaxed text-slate-600">
            {t("help.scopeIntro")}
          </ITText>
          <ITFlex direction="column" gap={2}>
            {scopes.map((scope) => (
              <ITFlex key={scope.key} align="start" gap={2}>
                <ITBadget color={scope.color} variant="outlined" size="sm">
                  {scope.label}
                </ITBadget>
                <ITText className="text-xs leading-relaxed text-slate-600">
                  {scope.example}
                </ITText>
              </ITFlex>
            ))}
          </ITFlex>
          <ITText className="text-xs leading-relaxed text-slate-600">
            {t("help.scopeNote")}
          </ITText>
        </ITFlex>

        <ITFlex direction="column" gap={1}>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t("help.appliesTitle")}
          </ITText>
          <ITText className="text-xs leading-relaxed text-slate-600">
            {t("help.appliesBody")}
          </ITText>
        </ITFlex>

        <ITFlex direction="column" gap={1}>
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t("help.catalogTitle")}
          </ITText>
          <ITText className="text-xs leading-relaxed text-slate-600">
            {t("help.catalogBody")}
          </ITText>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
