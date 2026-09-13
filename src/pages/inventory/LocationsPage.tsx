import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaMapMarkerAlt, FaPlus } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RootState } from "@app/store";
import { LocationsTable, useLocationsCrud } from "@features/location/locations-list";

export default function LocationsPage() {
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["locations", "common"]);
  const user = useSelector((s: RootState) => s.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const crud = useLocationsCrud();

  return (
    <ITPage
      title={tt("list.title")}
      description={tt("list.description")}
      backAction={() => navigate(-1)}
      icon={<FaMapMarkerAlt size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("list.breadcrumb") },
      ]}
      actions={
        isAdmin ? (
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => crud.setCreateOpen(true)}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{tt("list.new")}</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      {crud.error && (
        <ITAlert variant="error" dismissible onDismiss={() => crud.setError(null)}>
          {crud.error}
        </ITAlert>
      )}

      <LocationsTable
        fetchData={crud.fetchTableData}
        reloadKey={crud.reloadKey}
        isAdmin={isAdmin}
        onView={(loc) => navigate(`/inventario/ubicaciones/${loc.id}`)}
        onEdit={crud.openEdit}
        onDelete={crud.setLocToDelete}
      />

      <ITDialog
        isOpen={crud.createOpen}
        onClose={() => crud.setCreateOpen(false)}
        className="it-dialog-panel"
        title={tt("list.new")}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="newLugar"
            value={crud.newForm.lugar}
            onChange={(e) => crud.setNewForm((f) => ({ ...f, lugar: e.target.value }))}
            placeholder={tt("list.newPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && crud.handleCreate()}
            autoFocus
          />
          <ITInput
            name="newDesc"
            value={crud.newForm.descripcion}
            onChange={(e) => crud.setNewForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder={tt("list.newDescPlaceholder")}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => crud.setCreateOpen(false)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={crud.handleCreate}
              disabled={!crud.newForm.lugar.trim()}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">{tt("list.create")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={!!crud.locToEdit}
        onClose={() => crud.setLocToEdit(null)}
        className="it-dialog-panel"
        title={tt("list.editTitle")}
      >
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="editLugar"
            value={crud.editForm.lugar}
            onChange={(e) => crud.setEditForm((f) => ({ ...f, lugar: e.target.value }))}
            placeholder={tt("list.editPlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && crud.handleUpdate()}
            autoFocus
          />
          <ITInput
            name="editDesc"
            value={crud.editForm.descripcion}
            onChange={(e) => crud.setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder={tt("list.editDescPlaceholder")}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => crud.setLocToEdit(null)}>
              {tt("common:actions.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={crud.handleUpdate}
              disabled={!crud.editForm.lugar.trim()}
            >
              <ITText className="font-bold text-[11px]">{tt("common:actions.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!crud.locToDelete}
        onClose={() => crud.setLocToDelete(null)}
        onConfirm={crud.confirmDelete}
        title={crud.locToDelete?.active === false ? tt("list.deleteForever") : tt("list.delete")}
        message={
          crud.locToDelete?.active === false
            ? tt("list.deleteForeverMsg", { name: crud.locToDelete?.lugar })
            : tt("list.deleteActive", { name: crud.locToDelete?.lugar })
        }
        confirmLabel={crud.locToDelete?.active === false ? tt("list.deleteForever") : tt("common:actions.delete")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}