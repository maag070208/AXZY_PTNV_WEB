import {
  ITButton,
  ITBadget,
  ITFlex,
  ITInput,
  ITPage,
  ITSelect,
  ITTextarea,
  ITText,
  ITToast,
  ITDropfile,
  FileTypeEnum,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaSave,
  FaTicketAlt,
  FaPaperclip,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import { createTicketThunk } from "@core/store/tickets/tickets.slice";
import { ticketsApi } from "@core/api/tickets.api";

const PRIORITIES = [
  { value: "BAJA", label: "Baja", badgeColor: "gray" as const },
  { value: "MEDIA", label: "Media", badgeColor: "warning" as const },
  { value: "ALTA", label: "Alta", badgeColor: "danger" as const },
  { value: "URGENTE", label: "Urgente", badgeColor: "danger" as const },
];

const CATEGORIES = [
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "EQUIPO", label: "Equipo" },
  { value: "SISTEMA", label: "Sistema" },
  { value: "OTRO", label: "Otro" },
];

const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function NewTicketPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dropfileKey, setDropfileKey] = useState(0);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    priority: "MEDIA",
    category: "OTRO",
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setToastType("error");
      setToast("Título y descripción son requeridos");
      return;
    }
    setSaving(true);
    try {
      const action = await dispatch(
        createTicketThunk({
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          priority: form.priority,
          category: form.category,
        })
      );
      if (createTicketThunk.fulfilled.match(action)) {
        const ticket = action.payload;
        for (const file of files) await ticketsApi.uploadAttachment(ticket.id, file, "FOTO");
        setToastType("success");
        setToast("Ticket creado correctamente");
        setTimeout(() => navigate("/tickets"), 1000);
      } else {
        setToastType("error");
        setToast("Error al crear ticket");
      }
    } catch {
      setToastType("error");
      setToast("Error al crear ticket");
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.titulo.trim().length > 0 && form.descripcion.trim().length > 0;

  if (currentUser?.role === "EMPLEADO") {
    return <Navigate to="/tickets" replace />;
  }

  return (
    <ITPage
      title="Nuevo Ticket"
      description="Crear una nueva solicitud o reporte"
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={[
        { label: "Tickets", onClick: () => navigate("/tickets") },
        { label: "Nuevo ticket" },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          onClick={handleSave}
          disabled={saving || !isValid}
        >
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">
              {saving ? "Guardando…" : "Crear ticket"}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white px-6 py-7 sm:px-8 sm:py-9 shadow-xl shadow-slate-200/40">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-50" />
            <div className="relative max-w-2xl mt-2">
              <ITFlex align="center" gap={2} className="mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FaTicketAlt size={14} /></span>
                <ITText className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Solicitud de soporte</ITText>
              </ITFlex>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">Cuéntanos qué sucede.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Mientras más contexto compartas, más rápido podrá atenderlo el equipo correcto.</p>
              <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
                <ITText className="mr-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Urgencia</ITText>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleField("priority", p.value)}
                    className={`rounded-full transition-all cursor-pointer ${form.priority === p.value ? "ring-2 ring-blue-200 ring-offset-1" : "opacity-75 hover:opacity-100"}`}
                  >
                    <ITBadget color={p.badgeColor} size="small">{p.label}</ITBadget>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-100 bg-white p-5 sm:p-7 shadow-xl shadow-slate-200/35">
            <ITFlex align="center" gap={3} className="mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-600">01</span>
              <div>
                <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Información del problema</ITText>
                <ITText className="text-[10px] text-slate-400">Datos principales de tu solicitud</ITText>
              </div>
            </ITFlex>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.6fr)_minmax(190px,0.7fr)]">
                <ITInput name="titulo" label="Título" value={form.titulo} onChange={(e) => handleField("titulo", e.target.value)} placeholder="Ej. La impresora de recepción no responde" required />
                <ITSelect name="category" label="Categoría" options={CATEGORIES} value={form.category} onChange={(e) => handleField("category", e.target.value)} />
              </div>
              <ITTextarea name="descripcion" label="Descripción" value={form.descripcion} onChange={(v) => handleField("descripcion", v)} placeholder="Qué ocurrió, dónde ocurrió y qué necesitas…" rows={7}  />
              <ITText className="-mt-4 block text-right text-[9px] text-slate-400">{form.descripcion.length} / 2000</ITText>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-5">
          <section className="rounded-[28px] border border-slate-100 bg-white p-5 sm:p-6 shadow-xl shadow-slate-200/35">
            <ITFlex align="center" gap={3} className="mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FaPaperclip size={13} /></span>
              <div><ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">Evidencias</ITText><ITText className="text-[10px] text-slate-400">Imágenes o PDF del problema</ITText></div>
            </ITFlex>
            <ITDropfile
              key={dropfileKey}
              onFileSelect={() => {}}
              onSubmit={(file) => {
                setFiles((current) => [...current, file]);
                setDropfileKey((current) => current + 1);
              }}
              acceptedFileTypes={[FileTypeEnum.PNG, FileTypeEnum.JPG, FileTypeEnum.JPEG, FileTypeEnum.PDF]}
              showStatusBadge
              containerClassName="!mt-0"
            />
            {files.length > 0 && <ITFlex direction="column" gap={2} className="mt-4">{files.map((file, index) => <ITFlex key={`${file.name}-${index}`} justify="between" align="center" gap={2} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"><ITFlex align="center" gap={2} className="min-w-0"><FaPaperclip className="shrink-0 text-slate-400" size={11} /><ITText className="truncate text-[10px] font-bold text-slate-600">{file.name}</ITText><ITText className="shrink-0 text-[9px] text-slate-400">{formatBytes(file.size)}</ITText></ITFlex><button type="button" className="shrink-0 text-[10px] font-bold text-red-500 hover:text-red-700" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}>Quitar</button></ITFlex>)}</ITFlex>}
          </section>

        </aside>
      </div>

      {toast && (
        <ITToast
          message={toast}
          type={toastType}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}
