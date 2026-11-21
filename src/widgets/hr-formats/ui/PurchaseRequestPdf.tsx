import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { PurchaseExpenseType, PurchaseRequestData } from "../model/types";
import { FormHeader, ItemsTable, LineField, LinesBlock, SignatureBlock, formStyles, shortDate } from "./requestFormPdfParts";

const EXPENSE_TYPES: { value: Exclude<PurchaseExpenseType, "">; label: string }[] = [
  { value: "operativo", label: "Operativo" },
  { value: "capex", label: "Capex" },
  { value: "mantenimiento", label: "Mantenimiento" },
];

/** Solicitud de compra: reproduce el formato en papel del hotel (mínimo 15 renglones). */
export default function PurchaseRequestPdf({ data }: { data: PurchaseRequestData }) {
  return (
    <Document title="Solicitud de compra" author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={formStyles.page}>
        <FormHeader title="SOLICITUD DE COMPRA" />

        <View style={formStyles.row}>
          <LineField label="Fecha de solicitud:" value={shortDate(data.requestDate)} />
          <LineField label="Nivel de prioridad:" value={data.priority} />
        </View>
        <View style={formStyles.row}>
          <LineField label="Área solicitante:" value={data.requestingArea} />
          <LineField label="Fecha requerida:" value={shortDate(data.requiredDate)} />
        </View>
        <View style={formStyles.row}>
          <LineField label="Centro de costos:" value={data.costCenter} />
          <LineField label="Presupuesto disponible:" value={data.availableBudget} />
        </View>

        <View style={[formStyles.row, { alignItems: "center", marginBottom: 4 }]}>
          <Text style={[formStyles.label, { marginRight: 10 }]}>Tipo de gasto:</Text>
          {EXPENSE_TYPES.map((e) => (
            <View key={e.value} style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
              <Text style={{ width: 11, height: 11, borderWidth: 0.8, borderColor: "#000", borderStyle: "solid", textAlign: "center", fontSize: 9, marginRight: 4 }}>
                {data.expenseType === e.value ? "X" : ""}
              </Text>
              <Text>{e.label}</Text>
            </View>
          ))}
        </View>

        <ItemsTable
          items={data.items}
          minRows={15}
          columns={[
            { label: "Producto / Servicio", width: "30%", get: (i) => i.product },
            { label: "Descripción", width: "42%", get: (i) => i.description },
            { label: "Cantidad", width: "12%", get: (i) => i.quantity, center: true },
            { label: "Unidad", width: "16%", get: (i) => i.unit, center: true },
          ]}
        />

        <LinesBlock label="Motivo de urgencia" value={data.urgencyReason} lines={2} />
        <LinesBlock label="Justificación de la compra" value={data.justification} lines={3} />
        <LinesBlock label="Proveedor sugerido" value={data.suggestedSupplier} lines={1} />

        <SignatureBlock
          signatures={[
            { label: "Solicitante", name: data.requesterName },
            { label: "Gerente de Compras" },
            { label: "Jefe de Área" },
            { label: "Dirección / Vo.Bo." },
          ]}
        />
      </Page>
    </Document>
  );
}
