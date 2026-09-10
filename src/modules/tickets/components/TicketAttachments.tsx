import { FileTypeEnum, ITButton, ITDialog, ITDropfile, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCamera, FaFileAlt, FaFilePdf, FaPlay } from "react-icons/fa";
import { ticketsApi, type TicketAttachment } from "@core/api/tickets.api";

type Props = {
  ticketId: string;
  assignmentId?: string;
  canUpload: boolean;
  compact?: boolean;
};

// Miniatura uniforme para cualquier tipo de archivo: imagen, video (con
// badge de play) o documento (icono + extensión). Si la imagen/video no
// carga (URL vencida, red lenta, etc.) cae a un tile de icono en vez de
// mostrar el "broken image" feo del navegador con el alt desbordado.
function AttachmentThumb({ item, size }: { item: TicketAttachment; size: number }) {
  const [broken, setBroken] = useState(false);
  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const isPdf = item.mimeType === "application/pdf";
  const iconSize = size >= 64 ? 20 : 15;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      title={item.originalName}
      className="group relative block shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
      style={{ width: size, height: size }}
    >
      {isImage && !broken ? (
        <img
          src={item.url}
          alt={item.originalName}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : isVideo && !broken ? (
        <>
          <video
            src={item.url}
            muted
            preload="metadata"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover bg-slate-900"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow">
              <FaPlay size={8} className="ml-0.5" />
            </span>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-slate-400">
          {isPdf ? <FaFilePdf size={iconSize} /> : <FaFileAlt size={iconSize} />}
          <span className="w-full truncate px-0.5 text-center text-[8px] font-bold leading-none">
            {item.originalName.split(".").pop()?.toUpperCase() ?? "ARCHIVO"}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5" />
    </a>
  );
}

export default function TicketAttachments({ ticketId, assignmentId, canUpload, compact = false }: Props) {
  const [items, setItems] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dropfileKey, setDropfileKey] = useState(0);

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

  const upload = async (file: File): Promise<boolean> => {
    setError(null);
    try {
      const item = assignmentId
        ? await ticketsApi.uploadAssignmentAttachment(ticketId, assignmentId, file)
        : await ticketsApi.uploadAttachment(ticketId, file);
      setItems((current) => [item, ...current]);
      return true;
    } catch (e: any) {
      setError(e.message ?? "No se pudo subir el archivo");
      return false;
    } finally {
      // ITDropfile resets its selected file after submit.
    }
  };

  const thumbSize = compact ? 48 : 68;

  return (
    <div className={compact ? "mt-2" : "rounded-xl border border-slate-200 bg-slate-50 p-3.5"}>
      <ITFlex justify="between" align="center" gap={2}>
        <ITFlex align="center" gap={1.5}>
          {assignmentId ? <FaCamera size={11} className="text-emerald-600" /> : <FaFileAlt size={11} className="text-blue-600" />}
          <ITText className="text-[12px] font-bold text-slate-500">
            {assignmentId ? "Evidencia" : "Fotos del ticket"} ({items.length})
          </ITText>
        </ITFlex>
        {canUpload && (
          <ITButton variant="outlined" size="small" color="secondary" onClick={() => setUploadOpen(true)}>
            <ITText className="text-[11px] font-bold">Subir archivos</ITText>
          </ITButton>
        )}
      </ITFlex>

      {loading ? <ITText className="text-[11px] text-slate-400 mt-2">Cargando...</ITText> : null}
      {error ? <ITText className="text-[11px] text-red-600 mt-2">{error}</ITText> : null}
      {!loading && items.length === 0 && !error ? (
        <div className="mt-2.5 rounded-lg border border-dashed border-slate-300 py-3 text-center">
          <ITText className="text-[11px] text-slate-400">Sin archivos</ITText>
        </div>
      ) : null}

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {items.map((item) => (
            <AttachmentThumb key={item.id} item={item} size={thumbSize} />
          ))}
        </div>
      )}

      <ITDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={assignmentId ? "Subir evidencia" : "Subir archivos del ticket"}
        className="max-w-xl"
      >
        <ITDropfile
          key={dropfileKey}
          onFileSelect={() => {}}
          onSubmit={async (file) => {
            const uploaded = await upload(file);
            if (uploaded) {
              setUploadOpen(false);
              setDropfileKey((current) => current + 1);
            }
          }}
          acceptedFileTypes={[
            FileTypeEnum.PNG,
            FileTypeEnum.JPG,
            FileTypeEnum.JPEG,
            FileTypeEnum.PDF,
            FileTypeEnum.MP4,
            FileTypeEnum.MOV,
            FileTypeEnum.AVI,
            FileTypeEnum.MKV,
            FileTypeEnum.VIDEO_3GPP,
            FileTypeEnum.WEBM,
          ]}
          showStatusBadge
        />
      </ITDialog>
    </div>
  );
}
