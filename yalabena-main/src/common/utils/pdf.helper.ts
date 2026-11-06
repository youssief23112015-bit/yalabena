import * as fs from 'fs';
import PDFDocument from 'pdfkit';

export interface PdfText {
  text: string;
  y?: number;
  size?: number;
  bold?: boolean;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export async function buildPdf(opts: {
  landscape?: boolean;
  backgroundPath?: string | null;
  texts: PdfText[];
  width?: number;
}): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: opts.landscape ? 'landscape' : 'portrait',
    margin: 40,
    bufferPages: true,
  });

  const fontPath = process.env.CERT_FONT_PATH;
  if (fontPath && fs.existsSync(fontPath)) {
    doc.registerFont('app', fontPath);
    doc.font('app');
  } else if (opts.texts.some((t) => /[\u0600-\u06FF]/.test(t.text))) {
    // eslint-disable-next-line no-console
    console.warn('[pdf] Arabic text detected but CERT_FONT_PATH is not set â€” glyphs will be wrong.');
  }

  if (opts.backgroundPath && fs.existsSync(opts.backgroundPath)) {
    try {
      doc.image(opts.backgroundPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    } catch {
      /* ignore broken background */
    }
  }

  for (const t of opts.texts) {
    doc
      .fontSize(t.size ?? 14)
      .fillColor(t.color ?? '#111111')
      .text(t.text, 40, t.y, {
        width: doc.page.width - 80,
        align: t.align ?? 'center',
        lineGap: 4,
      });
  }

  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
  doc.end();
  return done;
}

export function resolveUploadPath(url?: string | null): string | null {
  if (!url) return null;
  const p = url.startsWith('/') ? url.slice(1) : url;
  const full = require('path').join(process.cwd(), p);
  return fs.existsSync(full) ? full : null;
}

