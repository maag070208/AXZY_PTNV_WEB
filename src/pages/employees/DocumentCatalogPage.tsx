import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaFileAlt, FaPlus, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { personalApi, type TipoDocumento } from "@entities/personal";

export default function DocumentCatalogPage() {
  const { t: tt } = useTranslation(["employees", "common"]);
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<TipoDocumento | null>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<TipoDocumento | null>(null);

  const fetchData = useMemo(
    () => makeClientTableFetch<TipoDocumento>(() => personalApi.documentTypes(true)),
    [reloadKey]
  );

  const abrirNuevo = () => {
    setEditando(null);
    setNombre("");
    setShowForm((v) => !v);
  };

  const abrirEdicion = (tipo: TipoDocumento) => {
    setEditando(tipo);
    setNombre(tipo.nombre);
    setShowForm(true);
  };

  const cerrar = () => {
    setShowForm(false);
    setEditando(null);
  };

  const save = async () => {
    if (!nombre.trim()) return;
    setError(null);
    try {
      if (editando) {
        await personalApi.updateDocumentType(editando.id, { nombre: nombre.trim() });
      } else {
        await personalApi.createDocumentType(nombre.trim());
      }
      cerrar();
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? tt("catalog.saveError"));
    }
  };

  const toggleActive = async (tipo: TipoDocumento) => {
    setError(null);
    try {
      await personalApi.updateDocumentType(tipo.id, { activo: !tipo.activo });
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? tt("catalog.saveError"));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setError(null);
    try {
      await personalApi.removeDocumentType(toDelete.id);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? tt("catalog.deleteError"));
    } finally {
      setToDelete(null);
    }
  };

  const columns: any[] = [
    {
      type: "string",
      key: "nombre",
      label: tt("catalog.name"),
      filter: true,
      sortable: false,
      render: (tipo: TipoDocumento) => <ITText className="text-[11px] font-bold text-slate-800">{tipo.nombre}</ITText>,
    },
    {
      type: "boolean",
      key: "activo",
      label: tt("catalog.status"),
      sortable: false,
      render: (tipo: TipoDocumento) =>
        tipo.activo ? (
          <ITBadget color="success" size="lg">{tt("catalog.active")}</ITBadget>
        ) : (
          <ITBadget color="danger" size="lg">{tt("catalog.inactive")}</ITBadget>
        ),
    },
    {
      type: "string",
      key: "accion",
      label: "",
      render: (tipo: TipoDocumento) => (
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="primary" size="lg" onClick={() => abrirEdicion(tipo)}>
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            color={tipo.activo ? "secondary" : "success"}
            size="lg"
            onClick={() => toggleActive(tipo)}
            title={tipo.activo ? tt("catalog.deactivate") : tt("catalog.activate")}
          >
            {tipo.activo ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
          </ITButton>
          {!tipo.activo && (
            <ITButton
              variant="outlined"
              color="error"
              size="lg"
              onClick={() => setToDelete(tipo)}
              title={tt("catalog.deleteForever")}
            >
              <FaTrash size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title={tt("catalog.title")}
      description={tt("catalog.description")}
      icon={<FaFileAlt size={20} />}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: tt("common:nav.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb"), onClick: () => navigate("/empleados") },
        { label: tt("catalog.title") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={abrirNuevo}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{tt("catalog.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {showForm && (
        <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
          <ITText className="text-sm font-bold text-slate-800">
            {editando ? tt("catalog.edit") : tt("catalog.new")}
          </ITText>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={6}>
              <ITInput
                name="nombre"
                label={tt("catalog.name")}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                autoFocus
              />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITFlex align="end" gap={2} className="h-full">
                <ITButton variant="outlined" color="secondary" onClick={cerrar} className="mt-1">
                  <ITText className="font-bold text-[11px]">{tt("common:actions.cancel")}</ITText>
                </ITButton>
                <ITButton variant="filled" color="primary" onClick={save} disabled={!nombre.trim()} className="mt-1">
                  <ITText className="font-bold text-[11px]">{tt("common:actions.save")}</ITText>
                </ITButton>
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITFlex>
      )}

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={20}
        itemsPerPageOptions={[10, 20, 50]}
        size="lg"
      />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={tt("catalog.deleteForever")}
        message={tt("catalog.deleteForeverConfirm", { name: toDelete?.nombre })}
        confirmLabel={tt("catalog.deleteForever")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}
