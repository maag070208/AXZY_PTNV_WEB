import {
  ITButton,
  ITFlex,
  ITInput,
  ITPage,
  ITStack,
  ITTextarea,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaBan,
  FaExclamationTriangle,
  FaFire,
  FaInfoCircle,
  FaSave,
  FaTicketAlt,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  fetchTicketById,
  updateTicketThunk,
  clearCurrent,
} from "@core/store/tickets/tickets.slice";

const PRIORITIES = [
  { value: "BAJA", label: "Baja", icon: <FaInfoCircle size={11} />, color: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200", activeColor: "bg-slate-600 text-white border-slate-600" },
  { value: "MEDIA", label: "Media", icon: <FaExclamationTriangle size={11} />, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", activeColor: "bg-amber-500 text-white border-amber-500" },
  { value: "ALTA", label: "Alta", icon: <FaFire size={11} />, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", activeColor: "bg-orange-500 text-white border-orange-500" },
  { value: "URGENTE", label: "Urgente", icon: <FaBan size={11} />, color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100", activeColor: "bg-red-500 text-white border-red-500" },
];

export default function EditTicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const ticket = useSelector((s: RootState) => s.tickets.current);
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isAdmin = currentUser?.role === "ADMIN";

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    priority: "MEDIA",
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/tickets");
      return;
    }
    if (id) {
      dispatch(fetchTicketById(id)).finally(() => setLoading(false));
    }
    return () => { dispatch(clearCurrent()); };
  }, [id, dispatch, isAdmin, navigate]);

  useEffect(() => {
    if (ticket) {
      setForm({
        titulo: ticket.titulo,
        descripcion: ticket.descripcion,
        priority: ticket.priority,
      });
    }
  }, [ticket]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !id) {
      setToastType("error");
      setToast("Título y descripción son requeridos");
      return;
    }
    setSaving(true);
    try {
      const action = await dispatch(
        updateTicketThunk({
          id,
          data: {
            titulo: form.titulo.trim(),
            descripcion: form.descripcion.trim(),
            priority: form.priority,
          },
        })
      );
      if (updateTicketThunk.fulfilled.match(action)) {
        setToastType("success");
        setToast("Ticket actualizado correctamente");
        setTimeout(() => navigate(`/tickets/${id}`), 1000);
      } else {
        setToastType("error");
        setToast("Error al actualizar ticket");
      }
    } catch {
      setToastType("error");
      setToast("Error al actualizar ticket");
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.titulo.trim().length > 0 && form.descripcion.trim().length > 0;

  if (loading) {
    return (
      <ITPage
        title="Editar Ticket"
        backAction={() => navigate(-1)}
        icon={<FaTicketAlt size={20} />}
        breadcrumbs={[
          { label: "Tickets", onClick: () => navigate("/tickets") },
          { label: "Editar" },
        ]}
      >
        <ITText className="text-slate-400">Cargando...</ITText>
      </ITPage>
    );
  }

  if (!ticket) {
    return (
      <ITPage
        title="Editar Ticket"
        backAction={() => navigate(-1)}
        icon={<FaTicketAlt size={20} />}
        breadcrumbs={[
          { label: "Tickets", onClick: () => navigate("/tickets") },
          { label: "No encontrado" },
        ]}
      >
        <ITText className="text-slate-400">Ticket no encontrado</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage
      title="Editar Ticket"
      description="Modificar ticket existente"
      backAction={() => navigate(-1)}
      icon={<FaTicketAlt size={20} />}
      breadcrumbs={[
        { label: "Tickets", onClick: () => navigate("/tickets") },
        { label: ticket.titulo },
        { label: "Editar" },
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
              {saving ? "Guardando..." : "Guardar cambios"}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex justify="center">
        <ITStack direction="column" spacing={5} className="w-full">
          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
            <ITStack direction="column" spacing={5} className="w-full">
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Información del ticket
              </ITText>

              <ITInput
                name="titulo"
                label="Título"
                value={form.titulo}
                onChange={(e) => handleField("titulo", e.target.value)}
                placeholder="Ej. Fuga de agua en oficina 302"
              />

              <ITFlex direction="column" gap={1}>
                <ITTextarea
                  name="descripcion"
                  label="Descripción"
                  value={form.descripcion}
                  onChange={(v) => handleField("descripcion", v)}
                  placeholder="Describe el problema o solicitud con el mayor detalle posible…"
                  rows={6}
                />
                <ITText className="text-[9px] text-slate-400 text-right">
                  {form.descripcion.length} / 2000
                </ITText>
              </ITFlex>
            </ITStack>
          </ITFlex>

          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
            <ITStack direction="column" spacing={4} className="w-full">
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Prioridad
              </ITText>

              <ITFlex gap={2} wrap="wrap">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleField("priority", p.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                      form.priority === p.value ? p.activeColor : p.color
                    }`}
                  >
                    {p.icon}
                    {p.label}
                  </button>
                ))}
              </ITFlex>
            </ITStack>
          </ITFlex>
        </ITStack>
      </ITFlex>

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