import { useMemo, useState, type ReactNode } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDialog,
  ITFlex,
  ITInput,
  ITLoader,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import {
  FaArrowLeft,
  FaCheck,
  FaEye,
  FaIdBadge,
  FaInfoCircle,
  FaLock,
  FaQuestionCircle,
  FaSearch,
  FaSlidersH,
  FaUndo,
  FaUser,
  FaUserCog,
  FaUsers,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@app/store";
import { roleLabel, meThunk, type PermissionScope } from "@entities/user";
import {
  APP_SCREENS,
  isScreenVisible,
  isScreenVisibleInGroup,
  screenLeaves,
  type PermissionCatalog,
} from "@entities/permission";
import type { RolesAdminState } from "@features/roles";
import RolesHelpDialog from "./RolesHelpDialog";
import RoleScopeDialog from "./RoleScopeDialog";

const ADMIN_LOCKED_CELL = "roles.manage";

/** Icono y color con que se pinta cada rol. */
const ROLE_VISUALS: Record<string, { icon: ReactNode; className: string }> = {
  ADMIN: { icon: <FaUserShield size={18} />, className: "bg-primary-100 text-primary-600" },
  MANAGER: { icon: <FaUserTie size={18} />, className: "bg-info-50 text-info-600" },
  AREA_HEAD: { icon: <FaUserCog size={18} />, className: "bg-warning-100 text-warning-600" },
  EMPLOYEE: { icon: <FaUser size={18} />, className: "bg-slate-100 text-slate-600" },
  HUMAN_RESOURCES: { icon: <FaUsers size={18} />, className: "bg-success-100 text-success-600" },
  GUARD: { icon: <FaIdBadge size={18} />, className: "bg-danger-100 text-danger-600" },
};

interface ToastState {
  message: string;
  type: "success" | "error";
}

interface RoleAccessPanelProps {
  admin: RolesAdminState;
}

/**
 * Pantalla "Accesos": tarjetas por rol y, al entrar a una, el editor de lo que
 * ese rol puede hacer y de las pantallas que ve. Sin tablas.
 */
export default function RoleAccessPanel({ admin }: RoleAccessPanelProps) {
  const { t } = useTranslation(["roles", "common"]);
  const { t: tc } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const {
    data,
    draft,
    permissionsByRole,
    changes,
    dirty,
    loading,
    saving,
    error,
    saveError,
    setScope,
    toggle,
    save,
    discard,
  } = admin;

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [scopeCell, setScopeCell] = useState<{
    role: string;
    permission: PermissionCatalog;
  } | null>(null);

  const leaves = useMemo(() => screenLeaves(), []);

  const scopeOf = (role: string, permission: string): PermissionScope =>
    draft[`${permission}|${role}`] ?? "NONE";

  const isScoped = (permission: PermissionCatalog): boolean =>
    permission.scopes.some((scope) => scope === "OWN" || scope === "AREA");

  const permissionCount = (role: string): number =>
    Object.keys(permissionsByRole[role] ?? {}).length;

  /** Pantallas (hojas) que ve un rol según el borrador. */
  const screensOf = (role: string): ReturnType<typeof screenLeaves> =>
    leaves.filter((leaf) =>
      isScreenVisibleInGroup(permissionsByRole[role], leaf.screen, leaf.parent, role)
    );

  const modules = useMemo<Array<[string, PermissionCatalog[]]>>(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    const matches = (permission: PermissionCatalog) =>
      !needle ||
      permission.name.toLowerCase().includes(needle) ||
      permission.key.toLowerCase().includes(needle) ||
      permission.module.toLowerCase().includes(needle);

    const map = new Map<string, PermissionCatalog[]>();
    for (const permission of data.catalog) {
      if (!matches(permission)) continue;
      const list = map.get(permission.module) ?? [];
      list.push(permission);
      map.set(permission.module, list);
    }
    return [...map.entries()];
  }, [data, query]);

  const previewItems = useMemo(() => {
    if (!selectedRole) return [];
    return APP_SCREENS.filter((screen) =>
      isScreenVisible(permissionsByRole[selectedRole], screen, selectedRole)
    );
  }, [selectedRole, permissionsByRole]);

  const handleSave = async () => {
    const ok = await save();
    if (!ok) return;
    // Refresca la propia sesión: si el ADMIN se cambió su rol, su menú cambia ya.
    void dispatch(meThunk());
    setToast({ message: t("matrix.saved"), type: "success" });
  };

  const handleDiscard = () => {
    discard();
    setToast(null);
  };

  if (loading) {
    return (
      <ITFlex align="center" justify="center" className="py-16">
        <ITLoader />
      </ITFlex>
    );
  }

  if (error || !data) {
    return (
      <ITAlert variant="error" dismissible onDismiss={() => undefined}>
        {error ?? t("errors.load")}
      </ITAlert>
    );
  }

  const hasInactive = data.catalog.some((permission) => !permission.active);

  const helpButton = (
    <ITButton
      variant="outlined"
      color="secondary"
      size="sm"
      onClick={() => setHelpOpen(true)}
      title={t("help.open")}
    >
      <ITFlex align="center" gap={1}>
        <FaQuestionCircle size={12} />
        <ITText className="font-bold text-[11px]">{t("help.open")}</ITText>
      </ITFlex>
    </ITButton>
  );

  const changeBadge = (
    <ITBadget
      color={dirty ? "warning" : "gray"}
      variant={dirty ? "filled" : "outlined"}
      size="lg"
    >
      {t("matrix.changeCount", { count: changes.length })}
    </ITBadget>
  );

  const saveActions = (
    <ITFlex align="center" gap={2}>
      <ITButton
        variant="outlined"
        color="secondary"
        onClick={handleDiscard}
        disabled={!dirty || saving}
      >
        <ITFlex align="center" gap={1}>
          <FaUndo size={12} />
          <ITText className="font-bold text-[11px]">{t("matrix.discard")}</ITText>
        </ITFlex>
      </ITButton>
      <ITButton
        variant="filled"
        color="primary"
        onClick={handleSave}
        disabled={!dirty || saving}
      >
        <ITFlex align="center" gap={1}>
          <FaCheck size={12} />
          <ITText className="font-bold text-[11px]">
            {saving ? t("matrix.saving") : t("matrix.save")}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  /* ---------------------------------- Lista ---------------------------------- */
  if (!selectedRole) {
    return (
      <ITFlex direction="column" gap={4}>
        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
          <ITFlex direction="column" gap={1}>
            <ITFlex align="center" gap={2}>
              <ITText className="text-sm font-bold text-slate-800">
                {t("access.title")}
              </ITText>
              {helpButton}
            </ITFlex>
            <ITText className="text-xs text-slate-500">{t("access.subtitle")}</ITText>
          </ITFlex>
          <ITFlex align="center" gap={2}>
            {changeBadge}
            {saveActions}
          </ITFlex>
        </ITFlex>

        {saveError && (
          <ITAlert variant="error" dismissible onDismiss={() => undefined}>
            {saveError}
          </ITAlert>
        )}
        {hasInactive && (
          <ITAlert variant="warning" icon={<FaInfoCircle />}>
            {t("matrix.inactiveWarning")}
          </ITAlert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.roles.map((role) => {
            const visual = ROLE_VISUALS[role] ?? {
              icon: <FaUser size={18} />,
              className: "bg-slate-100 text-slate-600",
            };
            return (
              <ITCard
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setQuery("");
                }}
                className="border border-slate-200"
              >
                <ITFlex direction="column" gap={3}>
                  <ITFlex align="center" gap={3}>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.className}`}
                    >
                      {visual.icon}
                    </span>
                    <ITText className="text-sm font-bold text-slate-800">
                      {roleLabel(role)}
                    </ITText>
                  </ITFlex>
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <ITBadget color="primary" variant="outlined" size="sm">
                      {t("access.roleSummary", {
                        permissions: permissionCount(role),
                        screens: screensOf(role).length,
                      })}
                    </ITBadget>
                  </ITFlex>
                  <ITFlex align="center" gap={1} className="text-primary-600">
                    <FaSlidersH size={10} />
                    <ITText className="text-[11px] font-bold">
                      {t("access.edit")}
                    </ITText>
                  </ITFlex>
                </ITFlex>
              </ITCard>
            );
          })}
        </div>

        <RoleScopeDialog
          isOpen={scopeCell !== null}
          role={scopeCell?.role ?? null}
          permission={scopeCell?.permission ?? null}
          value={scopeCell ? scopeOf(scopeCell.role, scopeCell.permission.key) : "NONE"}
          onChange={(scope) => {
            if (scopeCell) setScope(scopeCell.role, scopeCell.permission.key, scope);
          }}
          onClose={() => setScopeCell(null)}
        />

        <RolesHelpDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

        {toast && (
          <ITToast
            message={toast.message}
            type={toast.type}
            position="bottom-center"
            duration={2500}
            onClose={() => setToast(null)}
          />
        )}
      </ITFlex>
    );
  }

  /* ---------------------------------- Detalle --------------------------------- */
  const visual = ROLE_VISUALS[selectedRole] ?? {
    icon: <FaUser size={18} />,
    className: "bg-slate-100 text-slate-600",
  };
  const roleScreens = screensOf(selectedRole);

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <ITFlex align="center" gap={3} wrap="wrap">
          <ITButton
            variant="outlined"
            color="secondary"
            size="sm"
            onClick={() => setSelectedRole(null)}
          >
            <ITFlex align="center" gap={1}>
              <FaArrowLeft size={11} />
              <ITText className="font-bold text-[11px]">{t("access.back")}</ITText>
            </ITFlex>
          </ITButton>
          <ITFlex align="center" gap={2}>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${visual.className}`}
            >
              {visual.icon}
            </span>
            <ITFlex direction="column" gap={0}>
              <ITText className="text-sm font-bold text-slate-800">
                {roleLabel(selectedRole)}
              </ITText>
              <ITText className="text-[11px] text-slate-500">
                {t("access.roleSummary", {
                  permissions: permissionCount(selectedRole),
                  screens: roleScreens.length,
                })}
              </ITText>
            </ITFlex>
          </ITFlex>
        </ITFlex>

        <ITFlex align="center" gap={2}>
          {helpButton}
          {changeBadge}
          {saveActions}
        </ITFlex>
      </ITFlex>

      <ITText className="text-xs text-slate-500">{t("access.detailSubtitle")}</ITText>

      {saveError && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {saveError}
        </ITAlert>
      )}
      {hasInactive && (
        <ITAlert variant="warning" icon={<FaInfoCircle />}>
          {t("matrix.inactiveWarning")}
        </ITAlert>
      )}

      {/* Pantallas que ve este rol */}
      <ITCard className="border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" justify="between" gap={2} wrap="wrap">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {t("access.screensTitle")}
            </ITText>
            <ITButton
              variant="outlined"
              color="primary"
              size="sm"
              onClick={() => setPreviewOpen(true)}
            >
              <ITFlex align="center" gap={1}>
                <FaEye size={11} />
                <ITText className="font-bold text-[11px]">{t("access.preview")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
          {roleScreens.length === 0 ? (
            <ITText className="text-xs italic text-slate-400">
              {t("access.screensEmpty")}
            </ITText>
          ) : (
            <ITFlex align="center" gap={2} wrap="wrap">
              {roleScreens.map((leaf) => (
                <ITBadget
                  key={leaf.screen.id}
                  color="success"
                  variant="outlined"
                  size="sm"
                >
                  {tc(leaf.screen.labelKey)}
                </ITBadget>
              ))}
            </ITFlex>
          )}
        </ITFlex>
      </ITCard>

      {/* Permisos por módulo, en tarjetas */}
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {t("access.permissionsTitle")}
        </ITText>
        <div className="w-full max-w-xs">
          <ITInput
            name="role_permission_search"
            size="sm"
            placeholder={t("matrix.searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            iconLeft={<FaSearch size={12} />}
          />
        </div>
      </ITFlex>

      {modules.length === 0 ? (
        <ITText className="py-8 text-center text-xs italic text-slate-400">
          {t("matrix.noResults")}
        </ITText>
      ) : (
        modules.map(([module, permissions]) => (
          <ITCard key={module} className="!p-0 overflow-hidden border border-slate-200">
            <ITFlex
              align="center"
              justify="between"
              gap={2}
              className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5"
            >
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                {module}
              </ITText>
              <ITText className="text-[10px] font-bold text-slate-400">
                {t("matrix.permissionCount", { count: permissions.length })}
              </ITText>
            </ITFlex>
            <div>
              {permissions.map((permission, index) => {
                const value = scopeOf(selectedRole, permission.key);
                const checked = value !== "NONE";
                const locked = selectedRole === "ADMIN" && permission.key === ADMIN_LOCKED_CELL;
                return (
                  <ITFlex
                    key={permission.key}
                    align="center"
                    justify="between"
                    gap={3}
                    className={`px-4 py-2.5 ${
                      index % 2 === 1 ? "bg-slate-50/40" : ""
                    } ${permission.active ? "" : "opacity-60"}`}
                  >
                    <ITCheckbox
                      className="flex-1"
                      name={`acc_${permission.key}_${selectedRole}`}
                      checked={checked}
                      disabled={!permission.active || saving || locked}
                      onChange={() => toggle(selectedRole, permission.key)}
                      label={
                        <ITFlex direction="column" gap={0}>
                          <ITFlex align="center" gap={2} wrap="wrap">
                            <ITText className="text-[12px] font-bold text-slate-800">
                              {permission.name}
                            </ITText>
                            {permission.sensitive && (
                              <ITBadget color="warning" size="sm">
                                <ITFlex align="center" gap={1}>
                                  <FaLock size={8} />
                                  {t("matrix.sensitive")}
                                </ITFlex>
                              </ITBadget>
                            )}
                            {isScoped(permission) && (
                              <ITBadget color="info" variant="outlined" size="sm">
                                {t("matrix.scoped")}
                              </ITBadget>
                            )}
                            {!permission.active && (
                              <ITBadget color="danger" size="sm">
                                {t("matrix.inactive")}
                              </ITBadget>
                            )}
                          </ITFlex>
                          <ITText className="font-mono text-[10px] text-slate-400">
                            {permission.key}
                          </ITText>
                        </ITFlex>
                      }
                    />
                    {isScoped(permission) && checked && (
                      <button
                        type="button"
                        onClick={() =>
                          setScopeCell({ role: selectedRole, permission })
                        }
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:border-primary-400 hover:text-primary-600"
                        title={t("matrix.changeScope")}
                      >
                        <FaSlidersH size={8} />
                        {t(`scopePlain.${value}`)}
                      </button>
                    )}
                  </ITFlex>
                );
              })}
            </div>
          </ITCard>
        ))
      )}

      <RoleScopeDialog
        isOpen={scopeCell !== null}
        role={scopeCell?.role ?? null}
        permission={scopeCell?.permission ?? null}
        value={scopeCell ? scopeOf(scopeCell.role, scopeCell.permission.key) : "NONE"}
        onChange={(scope) => {
          if (scopeCell) setScope(scopeCell.role, scopeCell.permission.key, scope);
        }}
        onClose={() => setScopeCell(null)}
      />

      {/* Vista previa del menú del rol */}
      <ITDialog
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t("access.previewTitle", { role: roleLabel(selectedRole) })}
      >
        <ITFlex direction="column" gap={2} className="max-h-[60vh] overflow-y-auto pr-1">
          {previewItems.length === 0 ? (
            <ITText className="py-6 text-center text-xs italic text-slate-400">
              {t("access.previewEmpty")}
            </ITText>
          ) : (
            previewItems.map((screen) => (
              <ITFlex key={screen.id} direction="column" gap={1}>
                <ITFlex align="center" gap={2}>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                  <ITText className="text-xs font-bold text-slate-800">
                    {tc(screen.labelKey)}
                  </ITText>
                </ITFlex>
                {screen.children
                  ?.filter((child) =>
                    isScreenVisible(permissionsByRole[selectedRole], child, selectedRole)
                  )
                  .map((child) => (
                    <ITFlex key={child.id} align="center" gap={2} className="pl-5">
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <ITText className="text-[11px] text-slate-600">
                        {tc(child.labelKey)}
                      </ITText>
                    </ITFlex>
                  ))}
              </ITFlex>
            ))
          )}
        </ITFlex>
      </ITDialog>

      <RolesHelpDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
