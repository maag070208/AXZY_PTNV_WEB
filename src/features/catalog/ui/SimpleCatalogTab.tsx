import { useEffect, useMemo, useRef, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";

interface SimpleCatalogTabProps<T extends { id: string; name: string; active: boolean }> {
  list: (includeInactive?: boolean) => Promise<T[]>;
  create: (name: string) => Promise<T>;
  update: (id: string, data: { name?: string; active?: boolean }) => Promise<T>;
  remove: (id: string) => Promise<{ soft: boolean; data: T }>;
  /** Incrementar para abrir el formulario de alta desde fuera (p.ej. botón del aside). */
  openCreateSignal?: number;
}

export default function SimpleCatalogTab<T extends { id: string; name: string; active: boolean }>({
  list,
  create,
  update,
  remove,
  openCreateSignal,
}: SimpleCatalogTabProps<T>) {
  const { t } = useTranslation(["catalog", "common"]);
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<T | null>(null);

  const lastSignal = useRef(openCreateSignal);
  useEffect(() => {
    if (openCreateSignal === lastSignal.current) return;
    lastSignal.current = openCreateSignal;
    setEditing(null);
    setName("");
    setShowForm(true);
  }, [openCreateSignal]);

  const fetchData = useMemo(
    () => makeClientTableFetch<T>(() => list(true)),
    [reloadKey]
  );

  const openEdit = (item: T) => {
    setEditing(item);
    setName(item.name);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  const save = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      if (editing) {
        await update(editing.id, { name: name.trim() });
      } else {
        await create(name.trim());
      }
      close();
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? t("saveError"));
    }
  };

  const toggleActive = async (item: T) => {
    setError(null);
    try {
      await update(item.id, { active: !item.active });
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? t("saveError"));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setError(null);
    try {
      await remove(toDelete.id);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? t("deleteError"));
    } finally {
      setToDelete(null);
    }
  };

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: t("name"),
      filter: true,
      sortable: false,
      render: (item: T) => <ITText className="text-[11px] font-bold text-slate-800">{item.name}</ITText>,
    },
    {
      type: "boolean",  
      key: "active",
      label: t("status"),
      sortable: false,
      render: (item: T) =>
        item.active ? (
          <ITBadget color="success" size="lg">{t("active")}</ITBadget>
        ) : (
          <ITBadget color="danger" size="lg">{t("inactive")}</ITBadget>
        ),
    },
    {
      type: "string",
      key: "action",
      label: "",
      render: (item: T) => (
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="primary" size="lg" onClick={() => openEdit(item)}>
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            color={item.active ? "secondary" : "success"}
            size="lg"
            onClick={() => toggleActive(item)}
            title={item.active ? t("deactivate") : t("activate")}
          >
            {item.active ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
          </ITButton>
          {!item.active && (
            <ITButton
              variant="outlined"
              color="error"
              size="lg"
              onClick={() => setToDelete(item)}
              title={t("deleteForever")}
            >
              <FaTrash size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDialog
        isOpen={showForm}
        onClose={close}
        title={editing ? t("edit") : t("new")}
        useFormHeader
      >
        <ITFlex direction="column" gap={4}>
          <ITInput
            name="name"
            label={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={close}>
              <ITText className="font-bold text-[11px]">{t("common:actions.cancel")}</ITText>
            </ITButton>
            <ITButton variant="filled" color="primary" onClick={save} disabled={!name.trim()}>
              <ITText className="font-bold text-[11px]">{t("common:actions.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        size="lg"
      />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={t("deleteForever")}
        message={t("deleteForeverConfirm", { name: toDelete?.name })}
        confirmLabel={t("deleteForever")}
        cancelLabel={t("common:actions.cancel")}
        variant="danger"
      />
    </>
  );
}