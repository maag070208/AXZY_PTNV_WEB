import { useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITLoader,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaInfoCircle, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PermisoCatalogo } from "@entities/permiso";
import type { Alcance } from "@entities/user";
import { useRolesAdmin } from "@features/roles";

const ALCANCE_ORDER: Alcance[] = ["NINGUNO", "PROPIO", "AREA", "TODO"];

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function MatrizRolesPanel() {
  const { t } = useTranslation(["roles", "common"]);
  const {
    data,
    draft,
    changes,
    dirty,
    loading,
    saving,
    error,
    saveError,
    setAlcance,
    save,
    discard,
  } = useRolesAdmin();
  const [toast, setToast] = useState<ToastState | null>(null);

  const modules = useMemo<Array<[string, PermisoCatalogo[]]>>(() => {
    if (!data) return [];
    const map = new Map<string, PermisoCatalogo[]>();
    for (const permiso of data.catalogo) {
      const list = map.get(permiso.modulo) ?? [];
      list.push(permiso);
      map.set(permiso.modulo, list);
    }
    return [...map.entries()];
  }, [data]);

  const hasInactive = data?.catalogo.some((permiso) => !permiso.activo) ?? false;

  const optionsFor = (permiso: PermisoCatalogo) => {
    const allowed = new Set<Alcance>(["NINGUNO", ...permiso.alcances]);
    return ALCANCE_ORDER.filter((alcance) => allowed.has(alcance)).map(
      (alcance) => ({ value: alcance, label: t(`alcance.${alcance}`) })
    );
  };

  const roleLabel = (rol: string) =>
    t(`role.${rol}`, { defaultValue: rol.replace(/_/g, " ") });

  const handleSave = async () => {
    const ok = await save();
    if (ok) setToast({ message: t("matrix.saved"), type: "success" });
  };

  const handleDiscard = () => {
    discard();
    setToast(null);
  };

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <ITFlex direction="column" gap={1}>
          <ITText className="text-sm font-bold text-slate-800">
            {t("matrix.title")}
          </ITText>
          <ITText className="text-xs text-slate-500">
            {t("matrix.subtitle")}
          </ITText>
        </ITFlex>

        <ITFlex align="center" gap={2}>
          <ITBadget
            color={dirty ? "warning" : "gray"}
            variant={dirty ? "filled" : "outlined"}
            size="lg"
          >
            {t("matrix.changeCount", { count: changes.length })}
          </ITBadget>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={handleDiscard}
            disabled={!dirty || saving}
          >
            <ITFlex align="center" gap={1}>
              <FaUndo size={12} />
              <ITText className="font-bold text-[11px]">
                {t("matrix.discard")}
              </ITText>
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
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {error}
        </ITAlert>
      )}
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

      {loading ? (
        <ITFlex align="center" justify="center" className="py-16">
          <ITLoader />
        </ITFlex>
      ) : !data || data.catalogo.length === 0 ? (
        <ITText className="py-10 text-center text-xs italic text-slate-400">
          {t("matrix.empty")}
        </ITText>
      ) : (
        <ITFlex direction="column" gap={4}>
          {modules.map(([modulo, permisos]) => (
            <ITCard
              key={modulo}
              className="!p-0 overflow-hidden border border-slate-200"
            >
              <ITFlex
                align="center"
                gap={2}
                className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5"
              >
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  {modulo}
                </ITText>
              </ITFlex>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5">
                        {t("matrix.permission")}
                      </th>
                      {data.roles.map((rol) => (
                        <th key={rol} className="px-3 py-2.5 text-center">
                          {roleLabel(rol)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permisos.map((permiso, index) => (
                      <tr
                        key={permiso.clave}
                        className={`border-b border-slate-100 ${
                          index % 2 === 1 ? "bg-slate-50/40" : ""
                        } ${permiso.activo ? "" : "opacity-60"}`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-3 py-2 align-middle">
                          <ITFlex direction="column" gap={1}>
                            <ITFlex align="center" gap={2} wrap="wrap">
                              <ITText className="text-[12px] font-bold text-slate-800">
                                {permiso.nombre}
                              </ITText>
                              {permiso.sensible && (
                                <ITBadget color="warning" size="sm">
                                  {t("matrix.sensitive")}
                                </ITBadget>
                              )}
                              {!permiso.activo && (
                                <ITBadget color="danger" size="sm">
                                  {t("matrix.inactive")}
                                </ITBadget>
                              )}
                            </ITFlex>
                            <ITText className="font-mono text-[10px] text-slate-400">
                              {permiso.clave}
                            </ITText>
                          </ITFlex>
                        </td>
                        {data.roles.map((rol) => {
                          const key = `${permiso.clave}|${rol}`;
                          return (
                            <td
                              key={rol}
                              className="px-3 py-2 align-middle"
                            >
                              <ITSelect
                                name={`matriz_${permiso.clave}_${rol}`}
                                size="sm"
                                options={optionsFor(permiso)}
                                value={draft[key] ?? "NINGUNO"}
                                disabled={!permiso.activo || saving}
                                onChange={(event) =>
                                  setAlcance(
                                    rol,
                                    permiso.clave,
                                    event.target.value as Alcance
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ITCard>
          ))}
        </ITFlex>
      )}

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
