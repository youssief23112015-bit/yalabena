import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';

export interface ReceiptData {
  receiptNumber: string;
  paidAt: Date | string;
  method: string;
  reference?: string | null;
  amount: number | string;
  currency: string;
  studentName: string;
  studentNumber?: string | null;
  invoiceNumber: string;
  invoiceTotal: number | string;
  invoicePaid: number | string;
  invoiceBalance: number | string;
  branchName?: string | null;
  items?: { description: string; quantity: number; total: number | string }[];
  notes?: string | null;
}

export interface CertificateData {
  studentName: string;
  courseName: string;
  groupName?: string | null;
  code: string;
  issueDate: Date | string;
  verifyUrl: string;
}

export interface ChatAuditMessage {
  created_at: Date | string;
  sender_name: string;
  type: string;
  deleted: boolean;
  edited_count: number;
  body?: string | null;
  file_name?: string | null;
}

@Injectable()
export class PdfService {
  private fmtMoney(v: number | string, currency: string): string {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return `${(isNaN(n) ? 0 : n).toFixed(2)} ${currency}`;
  }

  private fmtDate(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toISOString().slice(0, 10);
  }

  // ─── Payment receipt (SRS 4.8 — branded receipt per payment) ───
  renderReceipt(data: ReceiptData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const BRAND = '#1B4F8A';

      doc.rect(0, 0, doc.page.width, 90).fill(BRAND);
      doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
        .text('Speak Up English Academy', 50, 30);
      if (data.branchName) {
        doc.fontSize(11).font('Helvetica').text(`Branch: ${data.branchName}`, 50, 58);
      }
      doc.fontSize(22).font('Helvetica-Bold')
        .text('PAYMENT RECEIPT', 50, 105, { align: 'right', width: doc.page.width - 100 });

      doc.fillColor('#000000');
      let y = 150;

      const row = (label: string, value: string) => {
        doc.font('Helvetica-Bold').fontSize(10).text(label, 50, y, { width: 160 });
        doc.font('Helvetica').fontSize(10).text(value, 220, y, { width: 330 });
        y += 18;
      };

      row('Receipt No:', data.receiptNumber);
      row('Date:', this.fmtDate(data.paidAt));
      row('Student:', data.studentName);
      if (data.studentNumber) row('Student No:', data.studentNumber);
      row('Invoice No:', data.invoiceNumber);
      row('Payment Method:', data.method);
      if (data.reference) row('Reference:', data.reference);

      if (data.items?.length) {
        y += 12;
        doc.font('Helvetica-Bold').fontSize(10).text('Description', 50, y);
        doc.text('Qty', 350, y, { width: 50, align: 'right' });
        doc.text('Amount', 420, y, { width: 130, align: 'right' });
        y += 6;
        doc.moveTo(50, y + 10).lineTo(550, y + 10).strokeColor(BRAND).stroke();
        y += 18;
        doc.font('Helvetica');
        for (const item of data.items) {
          doc.text(item.description, 50, y, { width: 290 });
          doc.text(String(item.quantity), 350, y, { width: 50, align: 'right' });
          doc.text(this.fmtMoney(item.total, data.currency), 420, y, { width: 130, align: 'right' });
          y += 16;
        }
      }

      y += 20;
      doc.rect(320, y, 230, 78).fillAndStroke('#F2F6FB', BRAND);
      doc.fillColor('#000000').fontSize(10).font('Helvetica');
      doc.text(`Invoice total:  ${this.fmtMoney(data.invoiceTotal, data.currency)}`, 330, y + 10);
      doc.text(`This payment:   ${this.fmtMoney(data.amount, data.currency)}`, 330, y + 26);
      doc.text(`Total paid:     ${this.fmtMoney(data.invoicePaid, data.currency)}`, 330, y + 42);
      doc.font('Helvetica-Bold')
        .text(`Balance due:    ${this.fmtMoney(data.invoiceBalance, data.currency)}`, 330, y + 58);

      if (data.notes) {
        doc.font('Helvetica').fontSize(9).fillColor('#555555')
          .text(`Notes: ${data.notes}`, 50, y + 95, { width: 500 });
      }

      doc.fontSize(8).fillColor('#777777').text(
        'This receipt was generated electronically by Speak Up English Academy TMS and is valid without a signature.',
        50, doc.page.height - 60, { width: 500, align: 'center' },
      );

      doc.end();
    });
  }

  // ─── Certificate (SRS 4.9 — branded PDF + QR verification) ───
  async renderCertificate(data: CertificateData): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(data.verifyUrl, { margin: 1, width: 120 });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { width, height } = doc.page;
      const BRAND = '#1B4F8A';
      const GOLD = '#C9A227';

      // Double border
      doc.rect(20, 20, width - 40, height - 40).lineWidth(3).strokeColor(BRAND).stroke();
      doc.rect(28, 28, width - 56, height - 56).lineWidth(1).strokeColor(GOLD).stroke();

      doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(15)
        .text('SPEAK UP ENGLISH ACADEMY', 0, 55, { align: 'center', width });

      doc.fillColor(GOLD).fontSize(34)
        .text('Certificate of Completion', 0, 95, { align: 'center', width });

      doc.fillColor('#444444').font('Helvetica').fontSize(12)
        .text('This is to certify that', 0, 160, { align: 'center', width });

      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(30)
        .text(data.studentName, 0, 185, { align: 'center', width });

      doc.fillColor('#444444').font('Helvetica').fontSize(12)
        .text('has successfully completed the course', 0, 235, { align: 'center', width });

      doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(20)
        .text(data.courseName, 0, 260, { align: 'center', width });

      if (data.groupName) {
        doc.fillColor('#444444').font('Helvetica').fontSize(11)
          .text(`Group: ${data.groupName}`, 0, 295, { align: 'center', width });
      }

      // Left: code + issue date
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
        .text(`Certificate Code: ${data.code}`, 60, height - 110);
      doc.font('Helvetica')
        .text(`Issue Date: ${this.fmtDate(data.issueDate)}`, 60, height - 95);

      // Right: QR verification
      doc.image(qrBuffer, width - 190, height - 175, { width: 100 });
      doc.fontSize(8).fillColor('#555555')
        .text('Scan to verify', width - 190, height - 68, { width: 100, align: 'center' });
      doc.fontSize(7)
        .text(data.verifyUrl, width - 260, height - 55, { width: 170, align: 'center' });

      doc.end();
    });
  }

  // ─── Chat audit export (SRS 6.5 — printable moderator report) ───
  renderChatAuditPdf(roomName: string, messages: ChatAuditMessage[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 45 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const BRAND = '#1B4F8A';
      doc.rect(0, 0, doc.page.width, 70).fill(BRAND);
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold')
        .text('Chat Audit Export — Speak Up English Academy', 45, 24);
      doc.fontSize(9).font('Helvetica')
        .text(`Room: ${roomName}   |   Exported: ${new Date().toISOString()}   |   Messages: ${messages.length}`, 45, 48);

      let y = 90;
      const bottom = () => doc.page.height - 50;

      for (const m of messages) {
        if (y > bottom()) {
          doc.addPage();
          y = 50;
        }
        const ts = m.created_at instanceof Date ? m.created_at.toISOString() : String(m.created_at);
        doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
          .text(`${ts}  —  ${m.sender_name}${m.deleted ? '  [DELETED]' : ''}${m.edited_count > 0 ? `  (edited x${m.edited_count})` : ''}`, 45, y);
        y += 12;
        doc.font('Helvetica').fontSize(9).fillColor('#333333');
        const content = m.type !== 'text'
          ? `[${m.type}] ${m.file_name || 'attachment'}`
          : (m.body || '');
        const h = doc.heightOfString(content, { width: 505 });
        if (y + h > bottom()) {
          doc.addPage();
          y = 50;
        }
        doc.text(content, 55, y, { width: 505 });
        y += h + 10;
      }

      doc.fontSize(8).fillColor('#777777').text(
        'Confidential moderation record — Speak Up English Academy TMS.',
        45, doc.page.height - 40, { width: 505, align: 'center' },
      );

      doc.end();
    });
  }
}
