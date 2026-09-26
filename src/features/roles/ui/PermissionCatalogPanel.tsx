import { useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCheckbox,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITText,
  ITTextarea,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaPowerOff, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PermisoCatalogo } from "@entities/permiso";
import type { Alcance } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { useCatalogoPermisos } from "@features/roles";

const ALCANCE_ORDER: Alcance[] = ["NINGUNO", "PROPIO", "AREA", "TODO"];
const CLAVE_REGEX = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

interface FormState {
  clave: string;
  modulo: string;
  nombre: string;
  descripcion: string;
  alcances: Alcance[];
  sensible: boolean;
  orden: string;
}

const emptyForm = (): FormState => ({
  clave: "",
  modulo: "",
  nombre: "",
  descripcion: "",
  alcances: ["TODO"],
  sensible: false,
  orden: "0",
});

const fromPermiso = (permiso: PermisoCatalogo): FormState => ({
  clave: permiso.clave,
  modulo: permiso.modulo,
  nombre: permiso.nombre,
  descripcion: permiso.descripcion ?? "",
  alcances: [...permiso.alcances],
  sensible: permiso.sensible,
  orden: String(permiso.orden),
});

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function CatalogoPermisosPanel() {
  const { t } = useTranslation(["roles", "common"]);
  const { list, reloadKey, create, update, toggleActivo, saving, error, setError } =
    useCatalogoPermisos();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PermisoCatalogo | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchData = useMemo(
    () => makeClientTableFetch<PermisoCatalogo>(list),
    [list]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (permiso: PermisoCatalogo) => {
    setEditing(permiso);
    setForm(fromPermiso(permiso));
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const toggleAlcance = (alcance: Alcance, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      alcances: checked
        ? ALCANCE_ORDER.filter(
            (a) => a === alcance || prev.alcances.includes(a)
          )
        : prev.alcances.filter((a) => a !== alcance),
    }));
  };

  const validate = (): string | null => {
    if (!editing && !CLAVE_REGEX.test(form.clave.trim())) {
      return t("catalog.errors.clave");
    }
    if (!form.modulo.trim()) return t("catalog.errors.modulo");
    if (!form.nombre.trim()) return t("catalog.errors.nombre");
    if (form.alcances.length === 0) return t("catalog.errors.alcances");
    const orden = Number(form.orden);
    if (!Number.isInteger(orden) || orden < 0) return t("catalog.errors.orden");
    return null;
  };

  const handleSave = async () => {
    const validation = validate();
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    const orden = Number(form.orden);
    try {
      if (editing) {
        await update(editing.clave, {
          modulo: form.modulo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() ? form.descripcion.trim() : null,
          alcances: form.alcances,
          sensible: form.sensible,
          orden,
        });
        setToast({ message: t("catalog.updated"), type: "success" });
      } else {
        await create({
          clave: form.clave.trim(),
          modulo: form.modulo.trim(),
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          alcances: form.alcances,
          sensible: form.sensible,
          orden,
        });
        setToast({ message: t("catalog.created"), type: "success" });
      }
      closeForm();
    } catch {
      // El hook ya expone el mensaje del API en `error`.
      setToast({ message: t("catalog.saveError"), type: "error" });
    }
  };

  const handleToggle = async (permiso: PermisoCatalogo) => {
    try {
      await toggleActivo(permiso);
      setToast({
        message: permiso.activo
          ? t("catalog.deactivated")
          : t("catalog.activated"),
        type: "success",
      });
    } catch {
      setToast({ message: t("catalog.saveError"), type: "error" });
    }
  };

  const columns: any[] = [
    {
      type: "string",
      key: "clave",
      label: t("catalog.columns.clave"),
      filter: true,
      render: (permiso: PermisoCatalogo) => (
        <ITText className="font-mono text-[11px] text-slate-700">
          {permiso.clave}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "modulo",
      label: t("catalog.columns.modulo"),
      filter: true,
      render: (permiso: PermisoCatalogo) => (
        <ITText className="text-[11px] text-slate-600">{permiso.modulo}</ITText>
      ),
    },
    {
      type: "string",
      key: "nombre",
      label: t("catalog.columns.nombre"),
      filter: true,
      render: (permiso: PermisoCatalogo) => (
        <ITText className="text-[11px] font-bold text-slate-800">
          {permiso.nombre}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "alcances",
      label: t("catalog.columns.alcances"),
      render: (permiso: PermisoCatalogo) => (
        <ITFlex align="center" gap={1} wrap="wrap">
          {permiso.alcances.map((alcance) => (
            <ITBadget key={alcance} color="primary" variant="outlined" size="sm">
              {t(`alcance.${alcance}`)}
            </ITBadget>
          ))}
        </ITFlex>
      ),
    },
    {
      type: "boolean",
      key: "sensible",
      label: t("catalog.columns.sensible"),
      render: (permiso: PermisoCatalogo) =>
        permiso.sensible ? (
          <ITBadget color="warning" size="sm">
            {t("catalog.sensible")}
          </ITBadget>
        ) : (
          <ITText className="text-[11px] text-slate-300">—</ITText>
        ),
    },
    {
      type: "number",
      key: "orden",
      label: t("catalog.columns.orden"),
      render: (permiso: PermisoCatalogo) => (
        <ITText className="text-[11px] text-slate-500">{permiso.orden}</ITText>
      ),
    },
    {
      type: "boolean",
      key: "activo",
      label: t("catalog.columns.activo"),
      render: (permiso: PermisoCatalogo) =>
        permiso.activo ? (
          <ITBadget color="success" size="sm">
            {t("catalog.active")}
          </ITBadget>
        ) : (
          <ITBadget color="danger" size="sm">
            {t("catalog.inactive")}
          </ITBadget>
        ),
    },
    {
      type: "string",
      key: "acciones",
      label: "",
      render: (permiso: PermisoCatalogo) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            variant="outlined"
            color="primary"
            size="sm"
            onClick={() => openEdit(permiso)}
            title={t("common:actions.edit")}
          >
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            color={permiso.activo ? "secondary" : "success"}
            size="sm"
            onClick={() => handleToggle(permiso)}
            disabled={saving}
            title={permiso.activo ? t("catalog.deactivate") : t("catalog.activate")}
          >
            {permiso.activo ? <FaPowerOff size={12} /> : <FaTrashRestore size={12} />}
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <ITFlex direction="column" gap={1}>
          <ITText className="text-sm font-bold text-slate-800">
            {t("catalog.title")}
          </ITText>
          <ITText className="text-xs text-slate-500">
            {t("catalog.subtitle")}
          </ITText>
        </ITFlex>
        <ITButton variant="filled" color="primary" onClick={openCreate}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={11} />
            <ITText className="font-bold text-[11px]">
              {t("catalog.new")}
            </ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        size="lg"
      />

      <ITDialog
        isOpen={showForm}
        onClose={closeForm}
        title={editing ? t("catalog.editTitle") : t("catalog.createTitle")}
        useFormHeader
      >
        <ITFlex direction="column" gap={4}>
          {formError && (
            <ITAlert variant="error" dismissible onDismiss={() => setFormError(null)}>
              {formError}
            </ITAlert>
          )}

          <ITInput
            name="clave"
            label={t("catalog.fields.clave")}
            placeholder="modulo.accion"
            value={form.clave}
            disabled={!!editing}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, clave: event.target.value }))
            }
          />

          <ITInput
            name="modulo"
            label={t("catalog.fields.modulo")}
            value={form.modulo}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, modulo: event.target.value }))
            }
          />

          <ITInput
            name="nombre"
            label={t("catalog.fields.nombre")}
            value={form.nombre}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, nombre: event.target.value }))
            }
          />

          <ITTextarea
            name="descripcion"
            label={t("catalog.fields.descripcion")}
            value={form.descripcion}
            rows={3}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, descripcion: value }))
            }
          />

          <ITFlex direction="column" gap={2}>
            <ITText className="text-[11px] font-bold text-slate-700">
              {t("catalog.fields.alcances")}
            </ITText>
            <ITFlex align="center" gap={4} wrap="wrap">
              {ALCANCE_ORDER.map((alcance) => (
                <ITCheckbox
                  key={alcance}
                  name={`alcance_${alcance}`}
                  checked={form.alcances.includes(alcance)}
                  onChange={(checked) => toggleAlcance(alcance, checked)}
                  label={t(`alcance.${alcance}`)}
                />
              ))}
            </ITFlex>
          </ITFlex>

          <ITFlex align="center" gap={4} wrap="wrap">
            <ITCheckbox
              name="sensible"
              checked={form.sensible}
              onChange={(checked) =>
                setForm((prev) => ({ ...prev, sensible: checked }))
              }
              label={t("catalog.fields.sensible")}
            />

            <ITInput
              name="orden"
              type="number"
              label={t("catalog.fields.orden")}
              value={form.orden}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, orden: event.target.value }))
              }
            />
          </ITFlex>

          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={closeForm}>
              <ITText className="font-bold text-[11px]">
                {t("common:actions.cancel")}
              </ITText>
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleSave}
              disabled={saving}
            >
              <ITText className="font-bold text-[11px]">
                {saving ? t("catalog.saving") : t("common:actions.save")}
              </ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

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
