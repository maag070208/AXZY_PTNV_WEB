import { ITDialog, ITFlex, ITRadioGroup, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { PermissionCatalog } from "@entities/permission";
import { roleLabel, type PermissionScope } from "@entities/user";

interface RoleScopeDialogProps {
  isOpen: boolean;
  role: string | null;
  permission: PermissionCatalog | null;
  value: PermissionScope;
  onChange: (scope: PermissionScope) => void;
  onClose: () => void;
}

const EXAMPLES = {
  NONE: "scopeExample.NONE",
  OWN: "scopeExample.OWN",
  AREA: "scopeExample.AREA",
  ALL: "scopeExample.ALL",
} as const satisfies Record<PermissionScope, string>;

/**
 * Permite ajustar, en palabras simples, **sobre qué datos** aplica un permiso
 * ya marcado (Propio / Área / Todo). Solo se abre para los permisos que admiten
 * alcance; el resto son sí/no.
 */
export default function RoleScopeDialog({
  isOpen,
  role,
  permission,
  value,
  onChange,
  onClose,
}: RoleScopeDialogProps) {
  const { t } = useTranslation("roles");
  if (!permission) return null;

  const available: PermissionScope[] = [
    ...new Set<PermissionScope>(["NONE", ...permission.scopes]),
  ];

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={t("scopeDialog.title", { permission: permission.name })}
    >
      <ITFlex direction="column" gap={4}>
        <ITText className="text-xs leading-relaxed text-slate-600">
          {t("scopeDialog.intro", { role: roleLabel(role ?? "") })}
        </ITText>

        <ITRadioGroup
          name={`scope_${permission.key}_${role ?? ""}`}
          value={value}
          onChange={(next) => onChange(next as PermissionScope)}
          options={available.map((scope) => ({
            value: scope,
            label: (
              <ITFlex direction="column" gap={0}>
                <ITText className="text-xs font-bold text-slate-800">
                  {t(`scopePlain.${scope}`)}
                </ITText>
                <ITText className="text-[10px] text-slate-500">
                  {t(EXAMPLES[scope])}
                </ITText>
              </ITFlex>
            ),
          }))}
        />

        <ITText className="text-[10px] italic text-slate-400">
          {t("scopeDialog.hint")}
        </ITText>
      </ITFlex>
    </ITDialog>
  );
}
