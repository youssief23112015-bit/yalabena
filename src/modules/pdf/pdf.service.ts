import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { ChatAuditRow } from '../chat/chat.service';

/**
 * NOTE: If a PdfService already exists in this module (the project's module
 * listing shows a `pdf` folder), do NOT replace the whole file with this —
 * merge `renderChatAuditPdf` into the existing class instead, so any other
 * PDF generation already in use (certificates, receipts, invoices per SRS
 * §4.8/§4.9) keeps working unchanged.
 */
@Injectable()
export class PdfService {
  /**
   * CHAT-BE-10: renders a styled audit trail for a chat room as a PDF Buffer.
   * Mirrors the columns used in exportRoomMessagesCsv so CSV and PDF exports
   * stay in sync if one changes.
   */
  async renderChatAuditPdf(roomId: string, rows: ChatAuditRow[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(16)
        .text('Chat Audit Log', { align: 'left' })
        .fontSize(9)
        .fillColor('#666')
        .text(`Room: ${roomId}`)
        .text(`Generated: ${new Date().toISOString()}`)
        .moveDown(1)
        .fillColor('#000');

      const colWidths = { time: 90, sender: 100, type: 45, flags: 55, body: 180 };
      const startX = doc.x;
      let y = doc.y;

      const drawRow = (
        time: string,
        sender: string,
        type: string,
        flags: string,
        body: string,
        opts: { bold?: boolean } = {},
      ) => {
        doc.fontSize(8).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(time, startX, y, { width: colWidths.time });
        doc.text(sender, startX + colWidths.time, y, { width: colWidths.sender });
        doc.text(type, startX + colWidths.time + colWidths.sender, y, { width: colWidths.type });
        doc.text(flags, startX + colWidths.time + colWidths.sender + colWidths.type, y, { width: colWidths.flags });
        const bodyHeight = doc.heightOfString(body, { width: colWidths.body });
        doc.text(
          body,
          startX + colWidths.time + colWidths.sender + colWidths.type + colWidths.flags,
          y,
          { width: colWidths.body },
        );
        y += Math.max(14, bodyHeight + 4);

        if (y > doc.page.height - 60) {
          doc.addPage();
          y = doc.y;
        }
      };

      drawRow('Time', 'Sender', 'Type', 'Flags', 'Body', { bold: true });
      doc.moveTo(startX, y).lineTo(doc.page.width - 40, y).strokeColor('#ccc').stroke();
      y += 6;

      for (const row of rows) {
        const flags = [
          row.deleted ? 'deleted' : null,
          row.editedCount > 0 ? `edited x${row.editedCount}` : null,
        ]
          .filter(Boolean)
          .join(', ');

        drawRow(
          row.createdAt.toISOString().replace('T', ' ').slice(0, 19),
          row.senderName,
          row.type,
          flags || '—',
          row.body,
        );
      }

      doc.end();
    });
  }
}
