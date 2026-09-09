import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useRef, useState } from "react";
import { FaCamera, FaFileAlt, FaUpload } from "react-icons/fa";
import { ticketsApi, type TicketAttachment } from "@core/api/tickets.api";

type Props = {
  ticketId: string;
  assignmentId?: string;
  canUpload: boolean;
  compact?: boolean;
};

export default function TicketAttachments({ ticketId, assignmentId, canUpload, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = assignmentId
        ? await ticketsApi.assignmentAttachments(ticketId, assignmentId)
        : await ticketsApi.attachments(ticketId);
      setItems(data);
    } catch (e: any) {
      setError(e.message ?? "No se pudieron cargar los archivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, assignmentId]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const item = assignmentId
        ? await ticketsApi.uploadAssignmentAttachment(ticketId, assignmentId, file)
        : await ticketsApi.uploadAttachment(ticketId, file);
      setItems((current) => [item, ...current]);
    } catch (e: any) {
      setError(e.message ?? "No se pudo subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={compact ? "mt-2" : "rounded-lg border border-slate-200 bg-slate-50 p-3"}>
      <ITFlex justify="between" align="center" gap={2}>
        <ITFlex align="center" gap={1.5}>
          {assignmentId ? <FaCamera size={11} className="text-emerald-600" /> : <FaFileAlt size={11} className="text-blue-600" />}
          <ITText className="text-[12px] font-medium text-slate-500">
            {assignmentId ? "Evidencia" : "Fotos del ticket"} ({items.length})
          </ITText>
        </ITFlex>
        {canUpload && (
          <>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/3gpp,video/webm" className="hidden" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            <ITButton variant="outlined" size="small" color="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <ITFlex align="center" gap={1}><FaUpload size={10} /><ITText className="text-[11px]">{uploading ? "Subiendo..." : "Subir"}</ITText></ITFlex>
            </ITButton>
          </>
        )}
      </ITFlex>
      {loading ? <ITText className="text-[11px] text-slate-400 mt-2">Cargando...</ITText> : null}
      {error ? <ITText className="text-[11px] text-red-600 mt-2">{error}</ITText> : null}
      {!loading && items.length === 0 && !error ? <ITText className="text-[11px] text-slate-400 mt-2">Sin archivos</ITText> : null}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {items.map((item) => {
            if (item.mimeType.startsWith("image/")) {
              return (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.originalName}>
                  <img src={item.url} alt={item.originalName} className="w-14 h-14 rounded-md object-cover border border-slate-200 hover:ring-2 hover:ring-blue-400" />
                </a>
              );
            }
            if (item.mimeType.startsWith("video/")) {
              return (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.originalName} className="relative block">
                  <video src={item.url} muted preload="metadata" className="w-14 h-14 rounded-md object-cover border border-slate-200 hover:ring-2 hover:ring-blue-400 bg-black" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-[9px]">▶</span>
                  </span>
                </a>
              );
            }
            return (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 underline max-w-40 truncate">{item.originalName}</a>
            );
          })}
        </div>
      )}
    </div>
  );
}