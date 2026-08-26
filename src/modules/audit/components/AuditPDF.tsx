import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { AuditLog } from "@core/api/audit.api";

interface Props {
  logs: AuditLog[];
  filters?: {
    action?: string;
    start?: string;
    end?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#000",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  filters: {
    fontSize: 7,
    color: "#888",
    marginBottom: 8,
  },
  table: {
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colFecha: { width: "18%", fontSize: 7 },
  colAccion: { width: "15%", fontSize: 7 },
  colUsuario: { width: "18%", fontSize: 7 },
  colEntidad: { width: "14%", fontSize: 7 },
  colDispositivo: { width: "15%", fontSize: 7 },
  colDetalles: { width: "20%", fontSize: 6, color: "#555" },
  bold: { fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 7,
    color: "#888",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    paddingTop: 4,
  },
});

const ACTION_LABELS: Record<string, string> = {
  MOVEMENT_ENTRADA: "Entrada",
  MOVEMENT_SALIDA: "Salida",
  MOVEMENT_TRASLADO: "Traslado",
  MOVEMENT_BAJA: "Baja",
  MOVEMENT_PRESTAMO: "Prestamo",
  MOVEMENT_DEVOLUCION: "Devolucion",
  CARTA_CREATED: "Carta Creada",
  DEVICE_UPDATED: "Dispositivo Actualizado",
};

export default function AuditPDF({ logs, filters }: Props) {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterStr = [
    filters?.action ? `Accion: ${filters.action}` : "",
    filters?.start ? `Desde: ${filters.start}` : "",
    filters?.end ? `Hasta: ${filters.end}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reporte de Auditoria</Text>
            <Text style={styles.subtitle}>
              Puerto Nuevo Hotel y Villas - Inventario
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 8 }}>
              Generado: {new Date().toLocaleString("es-MX")}
            </Text>
            <Text style={{ fontSize: 7, color: "#666" }}>
              {logs.length} registro(s)
            </Text>
          </View>
        </View>

        {filterStr && (
          <Text style={styles.filters}>Filtros: {filterStr}</Text>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colFecha, styles.bold]}>Fecha/Hora</Text>
            <Text style={[styles.colAccion, styles.bold]}>Accion</Text>
            <Text style={[styles.colUsuario, styles.bold]}>Usuario</Text>
            <Text style={[styles.colEntidad, styles.bold]}>Entidad</Text>
            <Text style={[styles.colDispositivo, styles.bold]}>Codigo</Text>
            <Text style={[styles.colDetalles, styles.bold]}>Detalles</Text>
          </View>

          {logs.map((log) => (
            <View key={log.id} style={styles.tableRow}>
              <Text style={styles.colFecha}>{formatDate(log.createdAt)}</Text>
              <Text style={styles.colAccion}>
                {ACTION_LABELS[log.action] ?? log.action}
              </Text>
              <Text style={styles.colUsuario}>{log.userName ?? "—"}</Text>
              <Text style={styles.colEntidad}>{log.entityType}</Text>
              <Text style={styles.colDispositivo}>
                {log.deviceCode ?? "—"}
              </Text>
              <Text style={styles.colDetalles}>
                {log.newState?.condicion
                  ? `Cond: ${log.newState.condicion}`
                  : log.newState?.estado
                    ? `Est: ${log.newState.estado}`
                    : log.newState?.consecutive
                      ? `Carta: ${log.newState.consecutive}`
                      : "—"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Documento generado por Sistema de Cartas Responsivas - Pagina 1
        </Text>
      </Page>
    </Document>
  );
}
