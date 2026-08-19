import { formatFecha, type CartaResponsiva } from "@core/store/cartas/types";
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
  const fechaTxt = formatFecha(carta.fecha) || "DD MES AAAA";
  const item = carta.items?.[0] ?? null;
  const departamentoNombre = (carta.departamento || "Sistemas").replace(
    /^Departamento de /i,
    ""
  );

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
            <span style={styles.metaLabel}>Fecha:</span>
            <span style={styles.metaVal}>{fechaTxt}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>No. de empleado:</span>
            <span style={styles.metaVal}>{carta.numeroEmpleado || "N/A"}</span>
          </div>
          <div style={{ ...styles.metaRow, marginBottom: 0 }}>
            <span style={styles.metaLabel}>Página:</span>
            <span style={styles.metaVal}>
              {pageIndex} &nbsp;&nbsp;&nbsp; de &nbsp;&nbsp;&nbsp; {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de título con folio */}
      <div style={styles.barraFolio}>
        {carta.consecutivo || "F-SIS-0001"} Carta responsiva del Departamento de{" "}
        {departamentoNombre}
      </div>

      {/* 3. Bloque de contenido principal */}
      <div style={styles.bloquePrincipal}>
        <p style={styles.parrafo}>
          Recibí autorización de uso y/o acceso al siguiente{" "}
          <strong>Recurso de TIC (Tecnología de la Información y la Comunicación)</strong>{" "}
          propiedad de{" "}
          <strong>{carta.empresa || "Puerto Nuevo Hotel y Villas.,"}</strong>{" "}
          siendo éste para uso exclusivo de las actividades laborales de la
          empresa, por lo que tomo responsabilidad sobre el mismo y me comprometo
          a:
        </p>

        <ul style={styles.compromisos}>
          <li>No divulgar y/o facilitar la información que se encuentra almacenada.</li>
          <li>No facilitar el acceso a personas internas o externas de la empresa.</li>
          <li>No utilizarlo en perjuicio de la empresa y/o en beneficio propio.</li>
          <li>Devolverlo cuando sea solicitado y/o al término de mi relación laboral con la empresa.</li>
          <li>Prevenir el robo o el daño parcial o total del mismo.</li>
        </ul>

        <div>
          <strong style={{ display: "block", marginBottom: 6 }}>Recurso TIC:</strong>

          <div style={styles.recursoLista}>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Descripción general:</span>
              <span style={styles.recVal}>
                {item?.descripcion || ""}
              </span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Marca:</span>
              <span style={styles.recVal}>{item?.marca || ""}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Modelo:</span>
              <span style={styles.recVal}>{item?.modelo || ""}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Número de serie:</span>
              <span style={styles.recVal}>{item?.numeroSerie || "N/A"}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Nombre del equipo:</span>
              <span style={styles.recVal}>{item?.nombreEquipo || "N/A"}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Control de activos:</span>
              <span style={styles.recVal}>{item?.controlActivos || ""}</span>
            </div>
            <div style={styles.recursoRow}>
              <span style={styles.recLabel}>Área:</span>
              <span style={styles.recVal}>{item?.area || ""}</span>
            </div>
          </div>
        </div>

        <p style={{ ...styles.parrafo, marginTop: 12 }}>
          Así mismo, declaro estar enterado del{" "}
          <strong>Reglamento del Departamento de {departamentoNombre}</strong> y
          de los compromisos que adquiero al ser usuario del equipo asignado, por
          lo que queda <strong>estrictamente prohibido</strong> cambiarlo por otro
          diferente al original y en caso de pérdida y/o daño por negligencia, me
          comprometo a pagar los daños ocasionados, autorizando a la empresa a
          realizar los descuentos correspondientes consecuencia de la
          negligencia y/o aplicar lo estipulado en el{" "}
          <strong>Reglamento Interior de Trabajo.</strong>
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
          Seguimiento en caso de retorno
        </div>

        <div style={styles.seguimientoContenido}>
          <div style={styles.lineaCampo}>
            <span style={styles.segLabel}>Fecha de devolución:</span>
            <span style={styles.segLine}></span>
          </div>
          <div style={styles.lineaCampo}>
            <span style={styles.segLabel}>Nombre de quien resguarda:</span>
            <span style={styles.segLine}></span>
          </div>
          <div style={styles.lineaCampo}>
            <span style={styles.segLabel}>Condiciones en las que se devuelve:</span>
            <span style={styles.segLine}></span>
          </div>
          <div style={styles.lineaVacia}></div>
          <div style={styles.lineaVacia}></div>

          <div style={styles.notaRh}>
            <strong>Nota:</strong> Una vez devuelto, esta carta debe permanecer
            bajo resguardo del Departamento de Recursos Humanos.
          </div>
        </div>
      </div>

      {/* 5. Firmas */}
      <div style={styles.firmas}>
        <div style={styles.firmaBox}>
          <div style={styles.lineaFirma}></div>
          <span>Responsable</span>
        </div>
        <div style={styles.firmaBox}>
          <div style={styles.lineaFirma}></div>
          <span>Encargado del área</span>
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
    marginTop: "65px",
    marginBottom: "20px",
  },
  firmaBox: {
    width: "200px",
    textAlign: "center",
    fontSize: "11px",
  },
  lineaFirma: {
    borderTop: "1.5px solid #000",
    marginBottom: "4px",
  },
};