import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import type { Ticket } from "@core/api/tickets.api";
import { TicketPDF } from "../components/TicketPDF";

export const downloadTicketPDF = async (ticket: Ticket): Promise<void> => {
  const blob = await pdf(
    createElement(TicketPDF, { ticket }) as any
  ).toBlob();
  const id = ticket.id.slice(0, 8).toUpperCase();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `ticket_${id}_${yy}${mm}${dd}.pdf`);
};
