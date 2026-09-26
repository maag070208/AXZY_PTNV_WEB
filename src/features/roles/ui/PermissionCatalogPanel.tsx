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
import type { PermissionCatalog } from "@entities/permission";
import type { PermissionScope } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { usePermissionCatalog } from "@features/roles";

const SCOPE_ORDER: PermissionScope[] = ["NONE", "OWN", "AREA", "ALL"];
const KEY_REGEX = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

interface FormState {
  key: string;
  module: string;
  name: string;
  description: string;
  scopes: PermissionScope[];
  sensitive: boolean;
  sortOrder: string;
}

const emptyForm = (): FormState => ({
  key: "",
  module: "",
  name: "",
  description: "",
  scopes: ["ALL"],
  sensitive: false,
  sortOrder: "0",
});

const fromPermission = (permission: PermissionCatalog): FormState => ({
  key: permission.key,
  module: permission.module,
  name: permission.name,
  description: permission.description ?? "",
  scopes: [...permission.scopes],
  sensitive: permission.sensitive,
  sortOrder: String(permission.sortOrder),
});

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function PermissionCatalogPanel() {
  const { t } = useTranslation(["roles", "common"]);
  const { list, reloadKey, create, update, toggleActive, saving, error, setError } =
    usePermissionCatalog();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PermissionCatalog | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const fetchData = useMemo(
    () => makeClientTableFetch<PermissionCatalog>(list),
    [list]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (permission: PermissionCatalog) => {
    setEditing(permission);
    setForm(fromPermission(permission));
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const toggleScope = (scope: PermissionScope, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      scopes: checked
        ? SCOPE_ORDER.filter(
            (a) => a === scope || prev.scopes.includes(a)
          )
        : prev.scopes.filter((a) => a !== scope),
    }));
  };

  const validate = (): string | null => {
    if (!editing && !KEY_REGEX.test(form.key.trim())) {
      return t("catalog.errors.key");
    }
    if (!form.module.trim()) return t("catalog.errors.module");
    if (!form.name.trim()) return t("catalog.errors.name");
    if (form.scopes.length === 0) return t("catalog.errors.scopes");
    const sortOrder = Number(form.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) return t("catalog.errors.sortOrder");
    return null;
  };

  const handleSave = async () => {
    const validation = validate();
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    const sortOrder = Number(form.sortOrder);
    try {
      if (editing) {
        await update(editing.key, {
          module: form.module.trim(),
          name: form.name.trim(),
          description: form.description.trim() ? form.description.trim() : null,
          scopes: form.scopes,
          sensitive: form.sensitive,
          sortOrder,
        });
        setToast({ message: t("catalog.updated"), type: "success" });
      } else {
        await create({
          key: form.key.trim(),
          module: form.module.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          scopes: form.scopes,
          sensitive: form.sensitive,
          sortOrder,
        });
        setToast({ message: t("catalog.created"), type: "success" });
      }
      closeForm();
    } catch {
      // El hook ya expone el mensaje del API en `error`.
      setToast({ message: t("catalog.saveError"), type: "error" });
    }
  };

  const handleToggle = async (permission: PermissionCatalog) => {
    try {
      await toggleActive(permission);
      setToast({
        message: permission.active
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
      key: "key",
      label: t("catalog.columns.key"),
      filter: true,
      render: (permission: PermissionCatalog) => (
        <ITText className="font-mono text-[11px] text-slate-700">
          {permission.key}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "module",
      label: t("catalog.columns.module"),
      filter: true,
      render: (permission: PermissionCatalog) => (
        <ITText className="text-[11px] text-slate-600">{permission.module}</ITText>
      ),
    },
    {
      type: "string",
      key: "name",
      label: t("catalog.columns.name"),
      filter: true,
      render: (permission: PermissionCatalog) => (
        <ITText className="text-[11px] font-bold text-slate-800">
          {permission.name}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "scopes",
      label: t("catalog.columns.scopes"),
      render: (permission: PermissionCatalog) => (
        <ITFlex align="center" gap={1} wrap="wrap">
          {permission.scopes.map((scope) => (
            <ITBadget key={scope} color="primary" variant="outlined" size="sm">
              {t(`scope.${scope}`)}
            </ITBadget>
          ))}
        </ITFlex>
      ),
    },
    {
      type: "boolean",
      key: "sensitive",
      label: t("catalog.columns.sensitive"),
      render: (permission: PermissionCatalog) =>
        permission.sensitive ? (
          <ITBadget color="warning" size="sm">
            {t("catalog.sensitive")}
          </ITBadget>
        ) : (
          <ITText className="text-[11px] text-slate-300">—</ITText>
        ),
    },
    {
      type: "number",
      key: "sortOrder",
      label: t("catalog.columns.sortOrder"),
      render: (permission: PermissionCatalog) => (
        <ITText className="text-[11px] text-slate-500">{permission.sortOrder}</ITText>
      ),
    },
    {
      type: "boolean",
      key: "active",
      label: t("catalog.columns.active"),
      render: (permission: PermissionCatalog) =>
        permission.active ? (
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
      key: "actions",
      label: "",
      render: (permission: PermissionCatalog) => (
        <ITFlex align="center" gap={2}>
          <ITButton
            variant="outlined"
            color="primary"
            size="sm"
            onClick={() => openEdit(permission)}
            title={t("common:actions.edit")}
          >
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            color={permission.active ? "secondary" : "success"}
            size="sm"
            onClick={() => handleToggle(permission)}
            disabled={saving}
            title={permission.active ? t("catalog.deactivate") : t("catalog.activate")}
          >
            {permission.active ? <FaPowerOff size={12} /> : <FaTrashRestore size={12} />}
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
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
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
            name="key"
            label={t("catalog.fields.key")}
            placeholder="module.action"
            value={form.key}
            disabled={!!editing}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, key: event.target.value }))
            }
          />

          <ITInput
            name="module"
            label={t("catalog.fields.module")}
            value={form.module}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, module: event.target.value }))
            }
          />

          <ITInput
            name="name"
            label={t("catalog.fields.name")}
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />

          <ITTextarea
            name="description"
            label={t("catalog.fields.description")}
            value={form.description}
            rows={3}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, description: value }))
            }
          />

          <ITFlex direction="column" gap={2}>
            <ITText className="text-[11px] font-bold text-slate-700">
              {t("catalog.fields.scopes")}
            </ITText>
            <ITFlex align="center" gap={4} wrap="wrap">
              {SCOPE_ORDER.map((scope) => (
                <ITCheckbox
                  key={scope}
                  name={`scope_${scope}`}
                  checked={form.scopes.includes(scope)}
                  onChange={(checked) => toggleScope(scope, checked)}
                  label={t(`scope.${scope}`)}
                />
              ))}
            </ITFlex>
          </ITFlex>

          <ITFlex align="center" gap={4} wrap="wrap">
            <ITCheckbox
              name="sensitive"
              checked={form.sensitive}
              onChange={(checked) =>
                setForm((prev) => ({ ...prev, sensitive: checked }))
              }
              label={t("catalog.fields.sensitive")}
            />

            <ITInput
              name="sortOrder"
              type="number"
              label={t("catalog.fields.sortOrder")}
              value={form.sortOrder}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
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
