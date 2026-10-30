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
import { CatalogStatStrip } from "@shared/ui/catalog-stat-strip";
import { RowAction } from "@shared/ui/row-action";

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
    () => makeClientTableFetch<T>(() => list(true), { active: { match: "equals" } }),
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
      width: 300,
      filter: true,
      sortable: false,
      render: (item: T) => <ITText className="text-[11px] font-bold text-slate-800">{item.name}</ITText>,
    },
    {
      type: "catalog",
      key: "active",
      label: t("status"),
      width: 130,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "true", name: t("active") },
          { id: "false", name: t("inactive") },
        ],
      },
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
      width: 140,
      render: (item: T) => (
        <ITFlex align="center" gap={1.5}>
          <RowAction icon={<FaEdit size={11} />} label={t("edit")} tone="primary" onClick={() => openEdit(item)} />
          <RowAction
            icon={item.active ? <FaTrash size={11} /> : <FaTrashRestore size={11} />}
            label={item.active ? t("deactivate") : t("activate")}
            tone={item.active ? "secondary" : "success"}
            onClick={() => toggleActive(item)}
          />
          {!item.active && (
            <RowAction icon={<FaTrash size={11} />} label={t("deleteForever")} tone="error" onClick={() => setToDelete(item)} />
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

      <CatalogStatStrip load={() => list(true)} reloadKey={reloadKey} />

      <ITDataTable showViewToggle={false}
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={50}
        virtualized
        virtualizedMaxHeight={460}
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