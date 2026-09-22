import { useCallback, useEffect, useState } from "react";
import { i18n } from "@shared/i18n";
import { personalApi } from "@entities/personal";
import type {
  PersonalProfile,
  PersonalProfileUpdateInput,
  EmployeeDiscount,
  EmployeeDocument,
  TipoDocumento,
  Genero,
  TipoSangre,
} from "@entities/personal";
import { usersApi } from "@entities/user";

export const useEmployeeDetail = (id: string | undefined) => {
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<TipoDocumento[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [tiposSangre, setTiposSangre] = useState<TipoSangre[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [uploadingDocTypeId, setUploadingDocTypeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, docs, types, gens, bloods] = await Promise.all([
        personalApi.get(id),
        personalApi.documents(id),
        personalApi.documentTypes(),
        personalApi.generos(),
        personalApi.tiposSangre(),
      ]);
      setProfile(p);
      setDocuments(docs);
      setDocumentTypes(types);
      setGeneros(gens);
      setTiposSangre(bloods);
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.loadError"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadPhoto = async (file: File) => {
    if (!id) return;
    setError(null);
    try {
      const { fotoUrl } = await personalApi.uploadPhoto(id, file);
      setProfile((p) => (p ? { ...p, fotoUrl } : p));
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.photoUploadError"));
    }
  };

  const uploadDocument = async (tipoDocumentoId: string, file: File): Promise<boolean> => {
    if (!id) return false;
    setError(null);
    try {
      const doc = await personalApi.uploadDocument(id, tipoDocumentoId, file);
      setDocuments((current) => [doc, ...current]);
      return true;
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.documentUploadError"));
      return false;
    }
  };

  const removeDocument = async (docId: string) => {
    if (!id) return;
    setError(null);
    try {
      await personalApi.removeDocument(id, docId);
      setDocuments((current) => current.filter((d) => d.id !== docId));
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.documentDeleteError"));
    }
  };

  const saveProfile = async (data: PersonalProfileUpdateInput, discounts: EmployeeDiscount[]) => {
    if (!id) return false;
    setSaving(true);
    setError(null);
    try {
      await personalApi.updateProfile(id, data);
      const updated = await personalApi.setDiscounts(id, discounts);
      setProfile(updated);
      setEditOpen(false);
      return true;
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.saveError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async (reason: string) => {
    if (!id) return;
    setError(null);
    try {
      await usersApi.deactivate(id, { reason, notifyUser: true });
      setProfile((p) =>
        p
          ? {
              ...p,
              active: false,
              deactivatedAt: new Date().toISOString(),
              deactivationReason: reason,
            }
          : p
      );
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.deactivateError"));
    } finally {
      setDeactivateOpen(false);
    }
  };

  const reactivate = async () => {
    if (!id) return;
    setError(null);
    try {
      await usersApi.update(id, { active: true });
      setProfile((p) => (p ? { ...p, active: true } : p));
    } catch (e: any) {
      setError(e.message ?? i18n.t("employees:detail.reactivateError"));
    }
  };

  return {
    profile,
    documents,
    documentTypes,
    generos,
    tiposSangre,
    loading,
    saving,
    error,
    setError,
    editOpen,
    setEditOpen,
    deactivateOpen,
    setDeactivateOpen,
    uploadingDocTypeId,
    setUploadingDocTypeId,
    uploadPhoto,
    uploadDocument,
    removeDocument,
    saveProfile,
    confirmDeactivate,
    reactivate,
  };
};
