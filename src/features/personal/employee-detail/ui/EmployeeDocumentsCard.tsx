import { useMemo, useState } from "react";
import {
  ITBadget,
  ITButton,
  ITDialog,
  ITDropfile,
  ITFlex,
  ITProgress,
  ITText,
  FileTypeEnum,
} from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaFileAlt, FaFilePdf, FaFileUpload, FaHourglassHalf, FaPaperclip, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { EmployeeDocument, TipoDocumento } from "@entities/personal";
import { StatCard } from "@shared/ui/stat-card";

interface Props {
  documentTypes: TipoDocumento[];
  documents: EmployeeDocument[];
  uploadingDocTypeId: string | null;
  onOpenUpload: (typeId: string) => void;
  onCloseUpload: () => void;
  onUpload: (typeId: string, file: File) => Promise<boolean>;
  onRemove: (docId: string) => void;
}

export default function EmployeeDocumentsCard({
  documentTypes,
  documents,
  uploadingDocTypeId,
  onOpenUpload,
  onCloseUpload,
  onUpload,
  onRemove,
}: Props) {
  const { t: tt } = useTranslation(["employees", "common"]);
  const [dropfileKey, setDropfileKey] = useState(0);

  const byType = useMemo(() => {
    const map = new Map<string, EmployeeDocument[]>();
    for (const doc of documents) {
      const list = map.get(doc.tipoDocumentoId) ?? [];
      list.push(doc);
      map.set(doc.tipoDocumentoId, list);
    }
    return map;
  }, [documents]);

  const requiredCount = documentTypes.length;
  const uploadedTypes = documentTypes.filter((t) => (byType.get(t.id)?.length ?? 0) > 0);
  const uploadedCount = uploadedTypes.length;
  const pendingCount = Math.max(requiredCount - uploadedCount, 0);
  const percent = requiredCount > 0 ? Math.round((uploadedCount / requiredCount) * 100) : 0;

  const uploadingType = documentTypes.find((t) => t.id === uploadingDocTypeId);

  return (
    <div className="w-full min-w-0 bg-white mt-2 rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-5 sm:p-6">
      <ITFlex justify="between" align="center" gap={2} className="mb-4 flex-wrap">
        <ITFlex align="center" gap={1.5}>
          <FaPaperclip size={10} className="text-slate-400" />
          <ITText className="text-[11px] font-bold text-slate-400">
            {tt("detail.totalFiles", { count: documents.length })}
          </ITText>
        </ITFlex>
      </ITFlex>

      <ITFlex gap={3} className="mb-4 flex-wrap">
        <StatCard
          icon={<FaPaperclip size={14} className="text-blue-600" />}
          circleClass="bg-blue-50"
          value={requiredCount}
          label={tt("detail.requiredTypes")}
        />
        <StatCard
          icon={<FaCheckCircle size={14} className="text-emerald-600" />}
          circleClass="bg-emerald-50"
          value={uploadedCount}
          label={tt("detail.uploadedUnique")}
        />
        <StatCard
          icon={<FaHourglassHalf size={14} className="text-orange-600" />}
          circleClass="bg-orange-50"
          value={pendingCount}
          label={tt("detail.pending")}
        />
      </ITFlex>

      <ITProgress value={percent} color={percent === 100 ? "success" : "primary"} size="lg" className="mb-4" />

      <div className="max-h-[420px] overflow-y-auto pr-1 space-y-1.5">
        {documentTypes.length === 0 && (
          <ITText className="text-[11px] text-slate-400 text-center py-4">{tt("detail.noDocumentTypes")}</ITText>
        )}
        {documentTypes.map((type) => {
          const files = byType.get(type.id) ?? [];
          const covered = files.length > 0;
          return (
            <div
              key={type.id}
              className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
            >
              <ITFlex justify="between" align="center" gap={2}>
                <ITText className="text-[11px] font-bold text-slate-700">{type.nombre}</ITText>
                <ITFlex align="center" gap={2}>
                  <ITBadget color={covered ? "success" : "warning"} size="lg">
                    {covered ? tt("detail.uploaded") : tt("detail.pendingOne")}
                  </ITBadget>
                  <ITButton variant="outlined" size="lg" color="secondary" onClick={() => onOpenUpload(type.id)}>
                    <FaFileUpload size={11} />
                  </ITButton>
                </ITFlex>
              </ITFlex>

              {files.length > 0 && (
                <ITFlex direction="column" gap={1} className="mt-2">
                  {files.map((file) => (
                    <ITFlex key={file.id} justify="between" align="center" gap={2}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 min-w-0 text-blue-600 hover:underline"
                      >
                        {file.mimeType === "application/pdf" ? (
                          <FaFilePdf size={10} className="shrink-0" />
                        ) : (
                          <FaFileAlt size={10} className="shrink-0" />
                        )}
                        <span className="truncate text-[10px] font-bold">{file.originalName}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemove(file.id)}
                        title={tt("common:actions.delete")}
                        className="shrink-0 text-slate-300 hover:text-red-500"
                      >
                        <FaTimes size={11} />
                      </button>
                    </ITFlex>
                  ))}
                </ITFlex>
              )}
            </div>
          );
        })}
      </div>

      <ITDialog
        isOpen={!!uploadingDocTypeId}
        onClose={onCloseUpload}
        title={uploadingType ? tt("detail.uploadFor", { tipo: uploadingType.nombre }) : ""}
        className="max-w-xl"
      >
        <ITDropfile
          key={dropfileKey}
          onFileSelect={() => {}}
          onSubmit={async (file) => {
            if (!uploadingDocTypeId) return;
            const ok = await onUpload(uploadingDocTypeId, file);
            if (ok) {
              setDropfileKey((k) => k + 1);
              onCloseUpload();
            }
          }}
          acceptedFileTypes={[FileTypeEnum.PNG, FileTypeEnum.JPG, FileTypeEnum.JPEG, FileTypeEnum.PDF]}
          showStatusBadge
        />
      </ITDialog>
    </div>
  );
}
