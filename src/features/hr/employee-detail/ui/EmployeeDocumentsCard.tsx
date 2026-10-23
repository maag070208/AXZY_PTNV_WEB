import { useMemo, useState } from "react";
import { ITDropfile, ITProgress, FileTypeEnum } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaFileAlt, FaFilePdf, FaHourglassHalf, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { EmployeeDocument, DocumentType } from "@entities/hr";

interface Props {
  documentTypes: DocumentType[];
  documents: EmployeeDocument[];
  onUpload: (typeId: string, file: File) => Promise<boolean>;
  onRemove: (docId: string) => void;
}

export default function EmployeeDocumentsCard({
  documentTypes,
  documents,
  onUpload,
  onRemove,
}: Props) {
  const { t: tt } = useTranslation(["employees", "common"]);
  // Cada tipo reinicia su propio dropfile al terminar una subida, sin tocar los demás.
  const [dropKeys, setDropKeys] = useState<Record<string, number>>({});

  const byType = useMemo(() => {
    const map = new Map<string, EmployeeDocument[]>();
    for (const doc of documents) {
      const list = map.get(doc.documentTypeId) ?? [];
      list.push(doc);
      map.set(doc.documentTypeId, list);
    }
    return map;
  }, [documents]);

  const requiredCount = documentTypes.length;
  const uploadedTypes = documentTypes.filter((t) => (byType.get(t.id)?.length ?? 0) > 0);
  const uploadedCount = uploadedTypes.length;
  const pendingCount = Math.max(requiredCount - uploadedCount, 0);
  const percent = requiredCount > 0 ? Math.round((uploadedCount / requiredCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[240px] flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{tt("detail.documentsTitle")}</p>
          <p className="mt-1 text-3xl font-black text-slate-900">
            {uploadedCount}
            <span className="text-lg font-semibold text-slate-400"> / {requiredCount}</span>
          </p>
          <ITProgress value={percent} color={percent === 100 ? "success" : "primary"} size="lg" className="mt-3" />
        </div>
        <dl className="grid grid-cols-3 gap-6 text-center">
          <div>
            <dd className="text-2xl font-black text-emerald-600">{uploadedCount}</dd>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tt("detail.uploaded")}</dt>
          </div>
          <div>
            <dd className="text-2xl font-black text-amber-600">{pendingCount}</dd>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tt("detail.pending")}</dt>
          </div>
          <div>
            <dd className="text-2xl font-black text-slate-700">{documents.length}</dd>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{tt("detail.filesLabel")}</dt>
          </div>
        </dl>
      </section>

      {documentTypes.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">{tt("detail.noDocumentTypes")}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documentTypes.map((type) => {
          const files = byType.get(type.id) ?? [];
          const covered = files.length > 0;
          return (
            <article
              key={type.id}
              className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${covered ? "border-emerald-200" : "border-dashed border-slate-300"}`}
            >
              <header className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${covered ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  {covered ? <FaCheckCircle size={15} /> : <FaHourglassHalf size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-slate-900">{type.name}</h3>
                  <p className={`text-xs font-medium ${covered ? "text-emerald-600" : "text-amber-600"}`}>
                    {covered ? tt("detail.uploaded") : tt("detail.pendingOne")}
                  </p>
                </div>
              </header>

              {files.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1">
                  {files.map((file) => (
                    <li key={file.id} className="group flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <a href={file.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-slate-700 hover:text-blue-600">
                        {file.mimeType === "application/pdf" ? (
                          <FaFilePdf size={12} className="shrink-0 text-red-500" />
                        ) : (
                          <FaFileAlt size={12} className="shrink-0 text-slate-400" />
                        )}
                        <span className="truncate text-xs font-medium group-hover:underline">{file.originalName}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemove(file.id)}
                        title={tt("common:actions.delete")}
                        className="shrink-0 rounded-full p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <FaTimes size={11} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <ITDropfile
                  key={`${type.id}-${dropKeys[type.id] ?? 0}`}
                  autoUpload
                  showStatusBadge={false}
                  onFileSelect={() => undefined}
                  onSubmit={async (file) => {
                    const ok = await onUpload(type.id, file);
                    // Un fallo se lanza para que el dropfile muestre el estado de error.
                    if (!ok) throw new Error("document upload failed");
                    setDropKeys((k) => ({ ...k, [type.id]: (k[type.id] ?? 0) + 1 }));
                  }}
                  acceptedFileTypes={[FileTypeEnum.PNG, FileTypeEnum.JPG, FileTypeEnum.JPEG, FileTypeEnum.PDF]}
                />
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
