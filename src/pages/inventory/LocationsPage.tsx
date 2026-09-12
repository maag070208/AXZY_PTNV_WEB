import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITInput,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
} from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaEdit, FaEye, FaMapMarkerAlt, FaPlus, FaTrash } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "@core/store/store";
import { locationsApi, type Location, formatLocation } from "@entities/location";
import { deviceApi as devicesApi, type Device } from "@entities/device";

export default function LocationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["inventory", "common"]);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locToDelete, setLocToDelete] = useState<Location | null>(null);
  const [form, setForm] = useState({ lugar: "", subLugar: "", numero: "", descripcion: "" });
  const [saving, setSaving] = useState(false);

  const [showDevicesDialog, setShowDevicesDialog] = useState(false);
  const [devicesLocation, setDevicesLocation] = useState<Location | null>(null);
  const [locationDevices, setLocationDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await locationsApi.list();
      setLocations(data);
      setTotal(data.length);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      return {
        data: locations as unknown as Record<string, unknown>[],
        total,
      };
    },
    [locations, total]
  );

  const handleSave = async () => {
    if (!form.lugar && !form.subLugar && !form.numero) {
      setToast({ message: t("messages.completeAtLeastOne"), type: "error" });
      return;
    }
    setSaving(true);
    try {
      if (editingLoc) {
        await locationsApi.update(editingLoc.id, form);
        setToast({ message: t("messages.updated"), type: "success" });
      } else {
        await locationsApi.create(form);
        setToast({ message: t("messages.created"), type: "success" });
      }
      setShowForm(false);
      setEditingLoc(null);
      setForm({ lugar: "", subLugar: "", numero: "", descripcion: "" });
      fetchLocations();
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorSaving"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!locToDelete) return;
    try {
      await locationsApi.remove(locToDelete.id);
      setLocToDelete(null);
      setToast({ message: t("messages.deleted"), type: "success" });
      fetchLocations();
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorDeleting"), type: "error" });
    }
  };

  const openEdit = (loc: Location) => {
    setEditingLoc(loc);
    setForm({
      lugar: loc.lugar ?? "",
      subLugar: loc.subLugar ?? "",
      numero: loc.numero ?? "",
      descripcion: loc.descripcion ?? "",
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditingLoc(null);
    setForm({ lugar: "", subLugar: "", numero: "", descripcion: "" });
    setShowForm(true);
  };

  const openDevicesDialog = async (loc: Location) => {
    setDevicesLocation(loc);
    setShowDevicesDialog(true);
    setLoadingDevices(true);
    try {
      const res = await devicesApi.list({});
      const filtered = res.data.filter((d) => d.locationId === loc.id);
      setLocationDevices(filtered);
    } catch {
      setLocationDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        type: "string" as const,
        key: "ubicacion",
        label: t("locations.colUbicacion"),
        sortable: false,
        filter: true,
        render: (row: Location) => (
          <ITFlex align="center" gap={2}>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <FaMapMarkerAlt size={12} className="text-blue-500" />
            </div>
            <ITText className="text-[12px] font-bold text-slate-800">
              {formatLocation(row)}
            </ITText>
          </ITFlex>
        ),
      },
      {
        type: "string" as const,
        key: "descripcion",
        label: t("locations.colDescripcion"),
        sortable: false,
        render: (row: Location) => (
          <ITText className="text-[11px] text-slate-500">
            {row.descripcion || "—"}
          </ITText>
        ),
      },
      {
        type: "string" as const,
        key: "lugar",
        label: t("locations.colLugar"),
        sortable: false,
        filter: true,
        render: (row: Location) =>
          row.lugar ? (
            <ITBadget color="primary" size="small">{row.lugar}</ITBadget>
          ) : (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          ),
      },
      {
        type: "string" as const,
        key: "subLugar",
        label: t("locations.colSubLugar"),
        sortable: false,
        render: (row: Location) =>
          row.subLugar ? (
            <ITBadget color="info" size="small">{row.subLugar}</ITBadget>
          ) : (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          ),
      },
      {
        type: "string" as const,
        key: "numero",
        label: t("locations.colNumero"),
        sortable: false,
        render: (row: Location) =>
          row.numero ? (
            <ITBadget color="secondary" size="small">#{row.numero}</ITBadget>
          ) : (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          ),
      },
      {
        type: "string" as const,
        key: "devices",
        label: t("locations.colDevices"),
        sortable: false,
        render: (row: Location) => (
          <ITFlex align="center" gap={1}>
            <ITText className="text-[12px] font-bold text-slate-700">
              {row._count?.devices ?? 0}
            </ITText>
          </ITFlex>
        ),
      },
      {
        type: "actions" as const,
        key: "actions",
        label: "",
        align: "right" as const,
        render: (row: Location) => (
          <ITFlex gap={1}>
            <ITButton
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => openDevicesDialog(row)}
              title={t("locations.viewDevices")}
            >
              <FaEye size={12} />
            </ITButton>
            {isAdmin && (
              <>
                <ITButton
                  size="small"
                  variant="outlined"
                  onClick={() => openEdit(row)}
                  title={t("locations.edit")}
                >
                  <FaEdit size={12} />
                </ITButton>
                <ITButton
                  size="small"
                  variant="outlined"
                  color="danger"
                  onClick={() => setLocToDelete(row)}
                  title={t("locations.remove")}
                >
                  <FaTrash size={12} />
                </ITButton>
              </>
            )}
          </ITFlex>
        ),
      },
    ],
    [isAdmin, t]
  );

  const renderCard = useCallback(
    (row: Location) => (
      <ITCard className="p-4">
        <ITStack direction="column" spacing={2}>
          <ITFlex align="center" justify="between">
            <ITFlex align="center" gap={2}>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FaMapMarkerAlt size={12} className="text-blue-500" />
              </div>
              <ITText className="font-bold text-slate-800">{formatLocation(row)}</ITText>
            </ITFlex>
            <ITFlex gap={1}>
              <ITButton size="small" variant="outlined" color="secondary" onClick={() => openDevicesDialog(row)} title={t("locations.viewDevices")}>
                <FaEye size={12} />
              </ITButton>
              {isAdmin && (
                <>
                  <ITButton size="small" variant="outlined" onClick={() => openEdit(row)}>
                    <FaEdit size={12} />
                  </ITButton>
                  <ITButton size="small" variant="outlined" color="danger" onClick={() => setLocToDelete(row)}>
                    <FaTrash size={12} />
                  </ITButton>
                </>
              )}
            </ITFlex>
          </ITFlex>
          {row.descripcion && (
            <ITText className="text-[11px] text-slate-500">{row.descripcion}</ITText>
          )}
          <ITFlex align="center" gap={1}>
            <ITText className="text-[11px] text-slate-400">{t("locations.deviceCount", { count: row._count?.devices ?? 0 })}</ITText>
          </ITFlex>
          <ITFlex gap={1} wrap="wrap">
            {row.lugar && <ITBadget color="primary" size="small">{row.lugar}</ITBadget>}
            {row.subLugar && <ITBadget color="info" size="small">{row.subLugar}</ITBadget>}
            {row.numero && <ITBadget color="secondary" size="small">#{row.numero}</ITBadget>}
          </ITFlex>
        </ITStack>
      </ITCard>
    ),
    [isAdmin, t]
  );

  if (loading) {
    return (
      <ITPage title={t("locations.title")} loading>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("locations.title")}
      description={t("locations.description", { count: locations.length })}
      icon={<FaMapMarkerAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("index.title"), onClick: () => navigate("/inventario") },
        { label: t("locations.title") },
      ]}
      actions={
        isAdmin ? (
          <ITButton variant="filled" color="primary" onClick={openNew}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("locations.newLocation")}</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDataTable
        columns={columns as any}
        fetchData={fetchTableData as any}
        renderCard={renderCard as any}
        defaultItemsPerPage={20}
        size="sm"
      />

      <ITDialog isOpen={showForm} onClose={() => setShowForm(false)} title={editingLoc ? t("locations.editDialog") : t("locations.newDialog")}>
        <ITFlex direction="column" gap={3}>
          <ITInput
            name="lugar"
            label={t("locations.lugar")}
            value={form.lugar}
            onChange={(e) => setForm((f) => ({ ...f, lugar: e.target.value }))}
            placeholder={t("locations.lugarPlaceholder")}
          />
          <ITInput
            name="subLugar"
            label={t("locations.subLugar")}
            value={form.subLugar}
            onChange={(e) => setForm((f) => ({ ...f, subLugar: e.target.value }))}
            placeholder={t("locations.subLugarPlaceholder")}
          />
          <ITInput
            name="numero"
            label={t("locations.numero")}
            value={form.numero}
            onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
            placeholder={t("locations.numeroPlaceholder")}
          />
          <ITInput
            name="descripcion"
            label={t("locations.descripcion")}
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder={t("locations.descripcionPlaceholder")}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" onClick={() => setShowForm(false)}>{t("common:actions.cancel")}</ITButton>
            <ITButton variant="filled" color="primary" onClick={handleSave} disabled={saving}>
              <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("common:actions.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!locToDelete}
        onClose={() => setLocToDelete(null)}
        onConfirm={handleDelete}
        title={t("locations.deleteTitle")}
        message={t("locations.deleteMessage", { loc: locToDelete ? formatLocation(locToDelete) : "" })}
        confirmLabel={t("locations.remove")}
        cancelLabel={t("common:actions.cancel")}
        variant="danger"
      />

      <ITDialog
        isOpen={showDevicesDialog}
        onClose={() => setShowDevicesDialog(false)}
        title={t("locations.devicesIn", { loc: devicesLocation ? formatLocation(devicesLocation) : "" })}
      >
        {loadingDevices ? (
          <ITFlex justify="center" align="center" className="py-8">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        ) : locationDevices.length === 0 ? (
          <ITFlex direction="column" align="center" gap={2} className="py-8">
            <FaMapMarkerAlt size={32} className="text-slate-300" />
            <ITText className="text-slate-500 text-sm">{t("locations.noDevices")}</ITText>
          </ITFlex>
        ) : (
          <ITStack direction="column" spacing={2}>
            {locationDevices.map((dev) => (
              <ITCard
                key={dev.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setShowDevicesDialog(false);
                  navigate(`/dispositivos/${dev.id}`);
                }}
              >
                <ITFlex align="center" justify="between">
                  <ITFlex direction="column" gap={0.5}>
                    <ITText className="text-[12px] font-bold text-slate-800">
                      {dev.controlActivos}
                    </ITText>
                    <ITText className="text-[11px] text-slate-500">
                      {dev.descripcion} · {dev.marca} {dev.modelo}
                    </ITText>
                  </ITFlex>
                  <ITFlex align="center" gap={1}>
                    <ITBadget
                      color={dev.estado === "DISPONIBLE" ? "success" : dev.estado === "ASIGNADO" ? "warning" : "gray"}
                      size="small"
                    >
                      {dev.estado}
                    </ITBadget>
                    <FaArrowRight size={12} className="text-slate-400" />
                  </ITFlex>
                </ITFlex>
              </ITCard>
            ))}
          </ITStack>
        )}
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
    </ITPage>
  );
}