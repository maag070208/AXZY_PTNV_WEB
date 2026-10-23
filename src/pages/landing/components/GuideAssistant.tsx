import { useEffect, useRef, useState } from "react";
import { FaArrowRight, FaCheckCircle, FaPaperPlane, FaTimes } from "react-icons/fa";
import Langostin from "@shared/ui/langostin/Langostin";

type Area = {
  tab: string;
  label: string;
  hint: string;
  reply: string;
};

const AREAS: Area[] = [
  {
    tab: "tickets",
    label: "Tickets y tareas",
    hint: "Solicitudes entre áreas",
    reply:
      "Empieza por Tickets: cada solicitud queda con responsable, tareas, fechas y evidencia. Es la forma más rápida de sacar las peticiones de WhatsApp.",
  },
  {
    tab: "inventario",
    label: "Inventario y cartas",
    hint: "Equipo de Sistemas",
    reply:
      "Empieza por Inventario: activo fijo por pieza, carta responsiva en PDF, devoluciones con condición y auditoría automática. Sabrás quién tiene qué y en qué estado.",
  },
  {
    tab: "personas",
    label: "Personas y asistencia",
    hint: "Expedientes, relojes y horarios",
    reply:
      "Empieza por Personas: expediente digital, documentos obligatorios, checadas del reloj y pre nómina. RH deja de perseguir carpetas y hojas de cálculo.",
  },
  {
    tab: "cocina",
    label: "Cocina y compras",
    hint: "Almacén, lotes y proveedores",
    reply:
      "Empieza por Cocina: artículos con mínimo y máximo, lotes con caducidad, consumo FEFO y el ciclo completo de orden, recepción y factura.",
  },
  {
    tab: "seguridad",
    label: "Roles y permisos",
    hint: "Quién puede hacer qué",
    reply:
      "Empieza por Roles: defines quién ve y hace qué, con alcance propio, área o todo. El servidor valida cada acción y todo queda en bitácora.",
  },
];

type GuideAssistantProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExplore: (moduleId: string) => void;
  contactEmail: string;
};

/**
 * Asistente de recorrido. No cotiza ni pide datos: ayuda a elegir por dónde
 * empezar y lleva a la persona al módulo correspondiente.
 */
const GuideAssistant = ({ open, onOpenChange, onExplore, contactEmail }: GuideAssistantProps) => {
  const [chosen, setChosen] = useState<Area | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [chosen, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const choose = (area: Area) => setChosen(area);
  const reset = () => setChosen(null);

  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(
    chosen ? `Demostración · ${chosen.label}` : "Demostración · Sistema de Operación",
  )}&body=${encodeURIComponent(
    `Hola, me interesa conocer el sistema de operación de Puerto Nuevo.\n\nÁrea de interés: ${
      chosen?.label ?? "Toda la operación"
    }.\n\nGracias.`,
  )}`;

  return (
    <>
      {open && (
        <aside className="lp-guide-panel" role="dialog" aria-label="Langostin, bot de ayuda">
          <header className="lp-guide-head">
            <span className="lp-guide-avatar">
              <Langostin anim="wave" size={30} />
            </span>
            <div>
              <strong>Langostin</strong>
              <span>
                <i /> Bot de ayuda · en línea
              </span>
            </div>
            <button type="button" aria-label="Cerrar a Langostin" onClick={() => onOpenChange(false)}>
              <FaTimes />
            </button>
          </header>

          <div className="lp-guide-log" ref={logRef} aria-live="polite">
            <div className="lp-guide-msg is-guide">
              <span className="lp-guide-mini">
                <Langostin anim="idle" size={18} animated={false} />
              </span>
              <p>Hola, soy Langostin, el bot de ayuda de Puerto Nuevo. ¿Qué área quieres ordenar primero?</p>
            </div>

            {chosen && (
              <>
                <div className="lp-guide-msg is-me">
                  <p>{chosen.label}</p>
                </div>
                <div className="lp-guide-msg is-guide">
                  <span className="lp-guide-mini">
                    <Langostin anim="point" size={18} />
                  </span>
                  <p>{chosen.reply}</p>
                </div>

                <div className="lp-guide-result">
                  <span className="lp-guide-result-label">
                    <FaCheckCircle /> Te conviene empezar por
                  </span>
                  <strong>{chosen.label}</strong>
                  <small>{chosen.hint}</small>
                  <button
                    type="button"
                    className="lp-guide-go"
                    onClick={() => {
                      onExplore(chosen.tab);
                      onOpenChange(false);
                    }}
                  >
                    Ver el módulo <FaArrowRight />
                  </button>
                </div>
              </>
            )}

            {!chosen && (
              <div className="lp-guide-options">
                {AREAS.map((area) => (
                  <button key={area.tab} type="button" onClick={() => choose(area)}>
                    <span>{area.label}</span>
                    <small>{area.hint}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <footer className="lp-guide-foot">
            <a href={mailto} className="lp-guide-mail">
              <FaPaperPlane /> Solicitar una demostración
            </a>
            {chosen ? (
              <button type="button" className="lp-guide-reset" onClick={reset}>
                Volver a empezar
              </button>
            ) : (
              <span>Langostin te lleva a la pantalla que necesitas.</span>
            )}
          </footer>
        </aside>
      )}

      <button
        type="button"
        className={`lp-guide-toggle${open ? " is-open" : ""}`}
        aria-label={open ? "Cerrar a Langostin" : "Abrir a Langostin, el bot de ayuda"}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className="lp-guide-toggle-avatar">
          <Langostin anim={open ? "idle" : "wave"} size={30} />
        </span>
        <span>{open ? "Cerrar" : "Langostin"}</span>
      </button>
    </>
  );
};

export default GuideAssistant;
