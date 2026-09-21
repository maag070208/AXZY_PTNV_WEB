import { useTranslation } from "react-i18next";
import type { Prestamo } from "@entities/inventario";
import { formatFecha } from "@shared/utils/dates";
import { LOGO_PUERTO_NUEVO_BASE64 } from "@shared/assets/logoPuertoNuevo";

/**
 * Vista previa HTML de la carta responsiva (sin PDFViewer para evitar
 * re-renderizados/parpadeos al escribir en vivo).
 */
export default function CartaResponsivaHtml({ prestamo }: { prestamo: Prestamo }) {
  const { t: tt } = useTranslation("cartas");

  const fechaTxt = formatFecha(prestamo.fecha) || tt("doc.dateLetters");
  const primerDetalle = prestamo.detalles?.[0] ?? null;
  const departamentoNombre = (prestamo.departamento?.name || "Sistemas").replace(/^Departamento de /i, "");

  const responsableName = prestamo.responsable?.name ?? "";
  const observableTxt = prestamo.departamento?.name
    ? `${prestamo.departamento.name}${prestamo.subarea ? ` — ${prestamo.subarea.name}` : ""}`
    : "";
  const responsableTxt = observableTxt || responsableName || "";

  const totalPiezas = prestamo.detalles.length
    ? prestamo.detalles.reduce((sum, d) => sum + d.cantidad, 0)
    : 0;
  const piezas = `${totalPiezas} ${totalPiezas === 1 ? "pieza" : "piezas"}`;
  const descripcionConCantidad =
    (primerDetalle?.dispositivo?.nombre || "CONTROL DE TV") + (totalPiezas > 0 ? ` (${piezas})` : "");
  const documentoOficial = "SIS-001";
  const activoFijo = primerDetalle?.unidades?.[0]?.unidadFisica?.activoFijo ?? "TBE-0001";
  const numeroSerie = primerDetalle?.unidades?.[0]?.unidadFisica?.numeroSerie;
  const nombreEquipo = primerDetalle?.unidades?.[0]?.unidadFisica?.nombreEquipo;

  const compromisos = [
    tt("doc.compromiso1"),
    tt("doc.compromiso2"),
    tt("doc.compromiso3"),
    tt("doc.compromiso4"),
    tt("doc.compromiso5"),
  ];

  const recursoRows: Array<{ label: string; value: string }> = [
    { label: tt("doc.descripcionGeneral"), value: descripcionConCantidad },
    { label: tt("doc.marca"), value: primerDetalle?.dispositivo?.marca || "STEREN" },
    { label: tt("doc.modelo"), value: primerDetalle?.dispositivo?.modelo || "RM-115" },
  ];
  if (numeroSerie) recursoRows.push({ label: tt("doc.numeroSerie"), value: numeroSerie });
  if (nombreEquipo) recursoRows.push({ label: tt("doc.nombreEquipo"), value: nombreEquipo });
  recursoRows.push({ label: tt("doc.controlActivos"), value: activoFijo });
  recursoRows.push({ label: tt("doc.area"), value: "MANTENIMIENTO" });

  return (
    <div className="mx-auto max-w-[210mm] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex aspect-[612/792] flex-col rounded-md border border-slate-300 bg-white text-[10px] leading-[1.35] text-black">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-300 p-3 pt-4">
          <img src={LOGO_PUERTO_NUEVO_BASE64} alt="Puerto Nuevo" className="h-16 w-16 object-contain" />
          <div className="w-52 border border-black">
            <div className="flex items-end px-1.5 py-1">
              <span className="w-[74px] font-bold">{tt("doc.date")}</span>
              <span className="flex-1 border-b border-black text-center">{fechaTxt}</span>
            </div>
            <div className="flex items-end px-1.5 py-1">
              <span className="w-[74px] font-bold">
                {prestamo.departamentoId ? tt("doc.departamento") : tt("doc.employeeNo")}
              </span>
              <span className="flex-1 border-b border-black text-center">
                {prestamo.departamentoId ? responsableTxt : prestamo.responsable?.numeroEmpleado || "N/A"}
              </span>
            </div>
            <div className="flex items-end px-1.5 py-1">
              <span className="w-12 font-bold">{tt("doc.page")}</span>
              <span className="flex-1 border-b border-black text-center">
                {tt("doc.pageOf", { current: 1, total: 1 })}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de título */}
        <div className="border-b border-slate-300 bg-[#b4c6e7] px-2 py-1.5 text-center font-bold">
          {tt("doc.barraFolio")}
        </div>

        {/* Cuerpo principal */}
        <div className="p-3">
          <p className="text-justify">
            {tt("doc.para1a")} <strong>{tt("doc.recursoTic")}</strong> {tt("doc.para1b")}{" "}
            <strong>{"Puerto Nuevo Hotel y Villas."}</strong> {tt("doc.para1c")}
          </p>

          <ul className="my-1 ml-6 list-disc space-y-0.5">
            {compromisos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <p className="mt-1 font-bold">{tt("doc.recursoTitulo")}</p>
          <div className="mt-0.5">
            {recursoRows.map((r) => (
              <div key={r.label} className="flex items-end">
                <span className="w-[96px] shrink-0">{r.label}</span>
                <span className="flex-1 border-b border-black pl-1 font-bold uppercase">{r.value || " "}</span>
              </div>
            ))}
          </div>

          <p className="mt-2 text-justify">
            {tt("doc.para2a")}{" "}
            <strong>
              {tt("doc.reglamentoDepartamento")} {departamentoNombre}
            </strong>{" "}
            {tt("doc.para2b")} <strong>{tt("doc.estrictamenteProhibido")}</strong> {tt("doc.para2c")}{" "}
            <strong>{tt("doc.reglamentoInterior")}</strong>
          </p>
        </div>

        {/* Seguimiento */}
        <div className="m-3 border border-slate-300">
          <div className="border-b border-slate-300 bg-[#d9d9d9] px-2 py-1 font-bold">
            {tt("doc.seguimientoBarra")}
          </div>
          <div className="p-3">
            <div className="flex items-end pb-1">
              <span className="w-32 shrink-0">{tt("doc.fechaDevolucion")}</span>
              <span className="h-2 flex-1 border-b border-black" />
            </div>
            <div className="flex items-end pb-1">
              <span className="w-32 shrink-0">{tt("doc.nombreResguarda")}</span>
              <span className="h-2 flex-1 border-b border-black" />
            </div>
            <div className="flex items-end pb-1">
              <span className="w-32 shrink-0">{tt("doc.condicionesDevuelve")}</span>
              <span className="h-2 flex-1 border-b border-black" />
            </div>
            <div className="h-2 border-b border-black" />
            <div className="h-2 border-b border-black" />
            <p className="pt-1">
              <strong>{tt("doc.notaRh1")}</strong> {tt("doc.notaRh2")}
            </p>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-auto flex justify-around px-6 pb-6 pt-8 text-center">
          <div className="w-28">
            <div className="border-t border-black" />
            <p className="font-bold">{responsableTxt || " "}</p>
            <p>{tt("doc.firmaResponsable")}</p>
          </div>
          <div className="w-28">
            <div className="border-t border-black" />
            <p className="font-bold">{" "}</p>
            <p>{tt("doc.firmaJefeArea")}</p>
          </div>
          <div className="w-28">
            <div className="border-t border-black" />
            <p className="font-bold">{"Departamento de Sistemas"}</p>
            <p>{tt("doc.firmaEntrega")}</p>
          </div>
        </div>
      </div>

      <p className="pb-1 pt-2 text-center text-[10px] text-slate-400">{documentoOficial}</p>
    </div>
  );
}