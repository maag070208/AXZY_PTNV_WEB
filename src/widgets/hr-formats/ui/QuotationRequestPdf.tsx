import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { QuotationRequestData } from "../model/types";
import { FormHeader, ItemsTable, LineField, LinesBlock, SignatureBlock, formStyles, shortDate } from "./requestFormPdfParts";

/** Solicitud de cotización: mismo estilo que la de compra, con columnas vacías de precio para el proveedor. */
export default function QuotationRequestPdf({ data }: { data: QuotationRequestData }) {
  return (
    <Document title="Solicitud de cotización" author="Puerto Nuevo Hotel y Villas">
      <Page size="LETTER" style={formStyles.page}>
        <FormHeader title="SOLICITUD DE COTIZACIÓN" />

        <View style={formStyles.row}>
          <LineField label="Fecha de solicitud:" value={shortDate(data.requestDate)} />
          <LineField label="Folio:" value={data.folio} />
        </View>
        <View style={formStyles.row}>
          <LineField label="Área solicitante:" value={data.requestingArea} />
          <LineField label="Solicitante:" value={data.requesterName} />
        </View>

        <Text style={[formStyles.sectionLabel, { marginTop: 4 }]}>Proveedor</Text>
        <View style={formStyles.row}>
          <LineField label="Nombre:" value={data.supplierName} />
          <LineField label="Contacto:" value={data.supplierContact} />
        </View>
        <View style={formStyles.row}>
          <LineField label="Teléfono:" value={data.supplierPhone} />
          <LineField label="Correo:" value={data.supplierEmail} />
        </View>
        <View style={formStyles.row}>
          <LineField label="Fecha límite de respuesta:" value={shortDate(data.responseDeadline)} />
        </View>

        <LinesBlock label="Lugar y condiciones de entrega" value={data.deliveryTerms} lines={2} />

        <ItemsTable
          items={data.items}
          minRows={12}
          columns={[
            { label: "Producto / Servicio", width: "24%", get: (i) => i.product },
            { label: "Descripción / Especificaciones", width: "30%", get: (i) => i.description },
            { label: "Cantidad", width: "10%", get: (i) => i.quantity, center: true },
            { label: "Unidad", width: "11%", get: (i) => i.unit, center: true },
            { label: "Precio unitario", width: "12%" },
            { label: "Importe", width: "13%" },
          ]}
        />

        <LinesBlock
          label="Observaciones (incluir IVA, vigencia, tiempo de entrega, condiciones de pago)"
          value={data.notes}
          lines={4}
        />

        <SignatureBlock signatures={[{ label: "Solicitante", name: data.requesterName }, { label: "Compras" }]} />
      </Page>
    </Document>
  );
}
