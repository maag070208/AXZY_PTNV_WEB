import { saveAs } from "file-saver";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { ticketsApi, type Ticket, type TicketAttachment } from "@core/api/tickets.api";
import { TicketPDF } from "../components/TicketPDF";

export const downloadTicketPDF = async (ticket: Ticket): Promise<void> => {
  const attachmentGroups = await Promise.all([
    ticketsApi.attachments(ticket.id).catch(() => [] as TicketAttachment[]),
    ...ticket.assignments.map((assignment) =>
      ticketsApi.assignmentAttachments(ticket.id, assignment.id).catch(() => [] as TicketAttachment[])
    ),
  ]);
  const attachments = attachmentGroups.flat();

  const imageAttachments = await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment.mimeType.startsWith("image/")) return attachment;
      try {
        const blob = attachment.assignmentId
          ? await ticketsApi.downloadAssignmentAttachment(ticket.id, attachment.assignmentId, attachment.id)
          : await ticketsApi.downloadAttachment(ticket.id, attachment.id);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        return { ...attachment, dataUrl };
      } catch {
        try {
          const response = await fetch(attachment.url);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          return { ...attachment, dataUrl };
        } catch {
          return attachment;
        }
      }
    })
  );

  const blob = await pdf(
    createElement(TicketPDF, { ticket, attachments: imageAttachments }) as any
  ).toBlob();
  const id = ticket.id.slice(0, 8).toUpperCase();
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = now.getFullYear();
  saveAs(blob, `ticket_${id}_${yy}${mm}${dd}.pdf`);
};
