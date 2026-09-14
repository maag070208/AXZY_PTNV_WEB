import { formatFecha } from "@shared/utils/dates";
import { useTranslation } from "react-i18next";
import type { CartaResponsiva } from "@entities/carta";
interface Props {
  carta: CartaResponsiva;
  pageIndex?: number;
  totalPages?: number;
}

export default function CartaPreview({
  carta,
  pageIndex = 1,
  totalPages = 1,
}: Props) {
  const { t: tt } = useTranslation("cartas");
  const fechaTxt = formatFecha(carta.fecha) || tt("doc.dateLetters");
  const item = carta.items?.[0] ?? null;
  const departamentoNombre = (carta.departamento || "Sistemas").replace(
    /^Departamento de /i,
    ""
  );

  const fmtUbicacion = (u?: CartaResponsiva["ubicacion"]): string => {
    if (!u) return "";
    return u.lugar;
  };
  // En modo ubicación la carta se asigna a un lugar, no a un empleado.
  const responsableTxt =
    fmtUbicacion(carta.ubicacion) || carta.responsable?.name || "";
  const encargadoName = carta.encargado?.name ?? "";
  const deliveryBy = carta.deliveryBy || "Departamento de Sistemas";

  return (
    <div id="carta-render-target" style={styles.hoja}>
      {/* 1. Encabezado superior (Logo y tabla de metadatos) */}
      <div style={styles.topHeader}>
        <div style={styles.logoBox}>
          <img
            src="/logo-puerto-nuevo.png"
            alt="Logo Puerto Nuevo Hotel & Villas"
            style={styles.logoImg}
          />
        </div>
        <div style={styles.metaBox}>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>{tt("doc.date")}</span>
            <span style={styles.metaVal}>{fechaTxt}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>
              {carta.ubicacion ? tt("doc.ubicacion") : tt("doc.employeeNo")}
            </span>
            <span style={styles.metaVal}>
              {carta.ubicacion
                ? responsableTxt
                : carta.numeroEmpleado || "N/A"}
            </span>
          </div>
          <div style={{ ...styles.metaRow, marginBottom: 0 }}>
            <span style={styles.metaLabel}>{tt("doc.page")}</span>
            <span style={styles.metaVal}>
              {tt("doc.pageOf", { current: pageIndex, total: totalPages })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de título con folio */}
      <div style={styles.barraFolio}>
        {tt("doc.barraFolio")}
      </div>

      {/* 3. Bloque de contenido principal */}
      <div style={styles.bloquePrincipal}>
        <p style={styles.parrafo}>
          {tt("doc.para1a")}{" "}
          <strong>{tt("doc.recursoTic")}</strong>{" "}
          {tt("doc.para1b")}{" "}
          <strong>{carta.empresa || "Puerto Nuevo Hotel y Villas.,"}</strong>
          {tt("doc.para1c")}
        </p>

        <ul style={styles.compromisos}>
          <li>{tt("doc.compromiso1")}</li>
          <li>{tt("doc.compromiso2")}</li>
          <li>{tt("doc.compromiso3")}</li>
          <li>{tt("doc.compromiso4")}</li>
          <li>{tt("doc.compromiso5")}</li>
        </ul>

        <div>
          <strong style={{ display: "block", marginBottom: 6 }}>{tt("doc.recursoTitulo")}</strong>

          <div style={styles.recursoLista}>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.descripcionGeneral")}</span>
              <span style={styles.recVal}>
                {item?.descripcion || ""}
              </span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.marca")}</span>
              <span style={styles.recVal}>{item?.marca || ""}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.modelo")}</span>
              <span style={styles.recVal}>{item?.modelo || ""}</span>
            </div>
            {item?.device?.type?.fieldConfig?.numeroSerie?.enabled && <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.numeroSerie")}</span>
              <span style={styles.recVal}>{item?.numeroSerie || "N/A"}</span>
            </div>}
            {item?.device?.type?.fieldConfig?.nombreEquipo?.enabled && <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.nombreEquipo")}</span>
              <span style={styles.recVal}>{item?.nombreEquipo || "N/A"}</span>
            </div>}
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.controlActivos")}</span>
              <span style={styles.recVal}>{item?.controlActivos || ""}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>{tt("doc.area")}</span>
              <span style={styles.recVal}>{item?.area || ""}</span>
            </div>
          </div>
        </div>

        <p style={{ ...styles.parrafo, marginTop: 12 }}>
          {tt("doc.para2a")}{" "}
          <strong>{tt("doc.reglamentoDepartamento")} {departamentoNombre}</strong>{" "}
          {tt("doc.para2b")} <strong>{tt("doc.estrictamenteProhibido")}</strong>{" "}
          {tt("doc.para2c")}{" "}
          <strong>{tt("doc.reglamentoInterior")}</strong>
        </p>

        {/* Diagonal de anulación de espacio en blanco */}
        <div style={styles.espacioDiagonal}>
          <svg
            style={styles.diagonalSvg}
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <line
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              stroke="#000"
              strokeWidth="0.5"
            />
          </svg>
        </div>
      </div>

      {/* 4. Bloque de Seguimiento en caso de retorno */}
      <div style={styles.bloqueSeguimiento}>
        <div style={styles.barraSeguimiento}>
          {tt("doc.seguimientoBarra")}
        </div>

        <div style={styles.seguimientoContenido}>
          <div style={styles.lineaCampo}>
            <span style={styles.segLabel}>{tt("doc.fechaDevolucion")}</span>
            <span style={styles.segLine}></span>
          </div>
          <div style={styles.lineaCampo}>
            <span style={styles.segLabel}>{tt("doc.nombreResguarda")}</span>
            <span style={styles.segLine}></span>
          </div>
          <div style={styles.lineaCampo}>
            <span style={styles.segLabel}>{tt("doc.condicionesDevuelve")}</span>
            <span style={styles.segLine}></span>
          </div>
          <div style={styles.lineaVacia}></div>
          <div style={styles.lineaVacia}></div>

          <div style={styles.notaRh}>
            <strong>{tt("doc.notaRh1")}</strong> {tt("doc.notaRh2")}
          </div>
        </div>
      </div>

      {/* 5. Firmas */}
      <div style={styles.firmas}>
        <div style={styles.firmaBox}>
          <div style={styles.lineaFirma}></div>
          <span style={styles.firmaNombre}>{responsableTxt}</span>
          <span style={styles.firmaLabel}>{tt("doc.firmaResponsable")}</span>
        </div>
        <div style={styles.firmaBox}>
          <div style={styles.lineaFirma}></div>
          <span style={styles.firmaNombre}>{encargadoName}</span>
          <span style={styles.firmaLabel}>{tt("doc.firmaJefeArea")}</span>
        </div>
        <div style={styles.firmaBox}>
          <div style={styles.lineaFirma}></div>
          <span style={styles.firmaNombre}>{deliveryBy}</span>
          <span style={styles.firmaLabel}>{tt("doc.firmaEntrega")}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hoja: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "30px 40px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "11px",
    color: "#000",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  logoBox: {
    display: "flex",
    alignItems: "center",
  },
  logoImg: {
    maxWidth: "80px",
    height: "auto",
  },
  metaBox: {
    border: "1px solid #000",
    width: "255px",
    padding: "4px 8px",
    boxSizing: "border-box",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "4px",
  },
  metaLabel: {
    fontWeight: "bold",
    width: "110px",
    fontSize: "11px",
  },
  metaVal: {
    flex: 1,
    textAlign: "center",
    borderBottom: "1px solid #000",
    fontWeight: 500,
    fontSize: "11px",
    minHeight: "14px",
  },
  barraFolio: {
    backgroundColor: "#b4c6e7",
    border: "1px solid #000",
    fontWeight: "bold",
    padding: "4px 8px",
    fontSize: "11.5px",
    boxSizing: "border-box",
  },
  bloquePrincipal: {
    border: "1px solid #000",
    borderTop: "none",
    padding: "10px 14px 0 14px",
    position: "relative",
    boxSizing: "border-box",
  },
  parrafo: {
    margin: "0 0 6px 0",
    textAlign: "justify",
    lineHeight: "1.35",
  },
  compromisos: {
    margin: "4px 0 10px 15px",
    paddingLeft: "15px",
    lineHeight: "1.35",
  },
  recursoLista: {
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  recursoRow: {
    display: "flex",
    alignItems: "flex-end",
  },
  recLabel: {
    width: "145px",
    fontSize: "11px",
  },
  recVal: {
    flex: 1,
    borderBottom: "1px solid #000",
    fontWeight: "bold",
    paddingLeft: "6px",
    textTransform: "uppercase",
    fontSize: "11px",
  },
  espacioDiagonal: {
    height: "95px",
    position: "relative",
    marginLeft: "-14px",
    marginRight: "-14px",
    marginTop: "8px",
  },
  diagonalSvg: {
    width: "100%",
    height: "100%",
    display: "block",
  },
  bloqueSeguimiento: {
    border: "1px solid #000",
    marginTop: "10px",
    boxSizing: "border-box",
  },
  barraSeguimiento: {
    backgroundColor: "#d9d9d9",
    borderBottom: "1px solid #000",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: 500,
  },
  seguimientoContenido: {
    padding: "8px 14px",
  },
  lineaCampo: {
    display: "flex",
    alignItems: "flex-end",
    marginBottom: "6px",
  },
  segLabel: {
    marginRight: "8px",
    whiteSpace: "nowrap",
    fontSize: "11px",
  },
  segLine: {
    flex: 1,
    borderBottom: "1px solid #000",
    height: "12px",
  },
  lineaVacia: {
    borderBottom: "1px solid #000",
    height: "14px",
    marginBottom: "6px",
  },
  notaRh: {
    marginTop: "8px",
    fontSize: "10.5px",
  },
  firmas: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "40px",
    marginBottom: "12px",
  },
  firmaBox: {
    width: "150px",
    textAlign: "center",
    fontSize: "11px",
  },
  firmaNombre: {
    display: "block",
    fontWeight: "bold",
    fontSize: "9px",
    textTransform: "uppercase",
    lineHeight: "1.3",
  },
  firmaLabel: {
    display: "block",
    fontSize: "8.5px",
    lineHeight: "1.3",
    marginTop: "1px",
  },
  lineaFirma: {
    borderTop: "1.5px solid #000",
    marginBottom: "4px",
  },
};