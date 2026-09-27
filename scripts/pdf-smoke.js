// Smoke test: renders a receipt PDF and a certificate PDF using the compiled
// PdfService (no Nest container needed — pure service).
const fs = require('fs');
const path = require('path');

const { PdfService } = require('../dist/modules/pdf/pdf.service');

async function main() {
  const pdf = new PdfService();

  const receipt = await pdf.renderReceipt({
    receiptNumber: 'RCP-2026-0001',
    paidAt: new Date(),
    method: 'cash',
    reference: null,
    amount: 1500,
    currency: 'EGP',
    studentName: 'Ahmed Hassan',
    studentNumber: 'STU-0042',
    invoiceNumber: 'INV-2026-0100',
    invoiceTotal: 3000,
    invoicePaid: 1500,
    invoiceBalance: 1500,
    branchName: 'Nasr City',
    items: [
      { description: 'General English - Level 3', quantity: 1, total: 3000 },
    ],
    notes: 'First installment',
  });
  const cert = await pdf.renderCertificate({
    studentName: 'Ahmed Hassan',
    courseName: 'General English - Level 3',
    groupName: 'G-2026-A',
    code: 'CERT-TEST-ABC123',
    issueDate: new Date(),
    verifyUrl: 'http://localhost:3000/api/v1/certificates/verify/CERT-TEST-ABC123',
  });

  const outDir = path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'receipt.pdf'), receipt);
  fs.writeFileSync(path.join(outDir, 'certificate.pdf'), cert);

  const audit = await pdf.renderChatAuditPdf('G-2026-A — General English', [
    { created_at: new Date('2026-09-20T10:00:00Z'), sender_name: 'Ahmed Hassan', type: 'text', deleted: false, edited_count: 0, body: 'Hello everyone, ready for today\'s lesson?' },
    { created_at: new Date('2026-09-20T10:01:00Z'), sender_name: 'Sara Ali', type: 'text', deleted: false, edited_count: 1, body: 'Yes! Reviewing the homework now.' },
    { created_at: new Date('2026-09-20T10:02:00Z'), sender_name: 'Ahmed Hassan', type: 'file', deleted: true, edited_count: 0, file_name: 'homework.pdf' },
  ]);
  fs.writeFileSync(path.join(outDir, 'chat-audit.pdf'), audit);

  const ok = (b) => b.length > 500 && b.slice(0, 5).toString() === '%PDF-';
  if (!ok(receipt) || !ok(cert) || !ok(audit)) {
    console.error('PDF_SMOKE_FAIL', receipt.length, cert.length, audit.length);
    process.exit(1);
  }
  console.log(`PDF_SMOKE_OK receipt=${receipt.length}b certificate=${cert.length}b audit=${audit.length}b (scripts/out/)`);
}

main().catch((e) => { console.error('PDF_SMOKE_FAIL', e); process.exit(1); });
