import { FileTypeEnum, ITButton, ITDialog, ITDropfile, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { LuCamera, LuFileText, LuPlay, LuUpload } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { ticketsApi, type TicketAttachment } from "@entities/ticket";
import { DialogHeader } from "@shared/ui/dialog-header";

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
  const { t: tt } = useTranslation("tickets");
  const [broken, setBroken] = useState(false);
  const isImage = item.mimeType.startsWith("image/");
  const isVideo = item.mimeType.startsWith("video/");
  const iconSize = size >= 64 ? 20 : 15;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      title={item.originalName}
      className="group relative block shrink-0 overflow-hidden rounded-2xl bg-slate-100 transition-all hover:-translate-y-0.5"
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
            <ITText as="span" className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--it-card-bg)] text-slate-800">
              <LuPlay size={10} className="ml-0.5" />
            </ITText>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-slate-400">
          <LuFileText size={iconSize} />
          <ITText as="span" className="w-full truncate px-0.5 text-center text-[9px] font-bold leading-none">
            {item.originalName.split(".").pop()?.toUpperCase() ?? tt("attachments.fallbackExt")}
          </ITText>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
    </a>
  );
}

export default function TicketAttachments({ ticketId, assignmentId, canUpload, compact = false }: Props) {
  const { t: tt } = useTranslation("tickets");
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
      setError(e.message ?? tt("attachments.loadError"));
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
      setError(e.message ?? tt("attachments.uploadError"));
      return false;
    } finally {
      // ITDropfile resets its selected file after submit.
    }
  };

  const thumbSize = compact ? 48 : 68;

  return (
    <div className={compact ? "mt-2" : "pt-2"}>
      <ITFlex justify="between" align="center" gap={2}>
        <ITFlex align="center" gap={1.5}>
          <ITText as="span" className="flex items-center text-slate-400">{assignmentId ? <LuCamera size={14} /> : <LuFileText size={14} />}</ITText>
          <ITText className="text-[12px] font-semibold text-slate-500">
            {assignmentId ? tt("attachments.evidenceTitle", { count: items.length }) : tt("attachments.photosTitle", { count: items.length })}
          </ITText>
        </ITFlex>
        {canUpload && (
          <ITButton variant="outlined" size="lg" color="secondary" onClick={() => setUploadOpen(true)}>
            <ITText className="text-[11px] font-bold">{tt("attachments.uploadButton")}</ITText>
          </ITButton>
        )}
      </ITFlex>

      {loading ? <ITText className="text-[11px] text-slate-400 mt-2">{tt("attachments.loading")}</ITText> : null}
      {error ? <ITText className="mt-2 text-[12px] text-[color:var(--color-danger)]">{error}</ITText> : null}
      {!loading && items.length === 0 && !error ? (
        <ITText className="mt-1.5 text-[12px] text-slate-400">{tt("attachments.empty")}</ITText>
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
        className="max-w-xl"
      >
        <DialogHeader
          icon={<LuUpload size={20} />}
          title={assignmentId ? tt("attachments.uploadEvidence") : tt("attachments.uploadTicketFiles")}
          subtitle={tt("attachments.uploadHint")}
        />
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
