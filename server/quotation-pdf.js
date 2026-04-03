const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const BUSINESS = {
  name: 'B & K Group',
  tagline: "PHUSHA S'MOKOLO",
  email: 'bandkgroupptyltd@outlook.com',
  phone: '+27 78 237 6257',
  address: 'Moreleta Corner, Cnr Garsfontein Rd & Rubenstain Dr, Moreleta Park, Pretoria',
};

/** Matches site theme (public/styles.css :root) for print-friendly PDF */
const THEME = {
  text: '#1a1a28',
  muted: '#5c5c6e',
  accent: '#e94560',
  gold: '#c9a54a',
  goldLine: '#e8c766',
  goldSoft: '#f5e6c8',
};

function formatPrice(amount) {
  return 'ZAR ' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Read width/height from PNG IHDR (no extra deps). */
function pngDimensions(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function buildQuotationPDF({ items, customer }, callback) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => callback(Buffer.concat(chunks)));
  doc.on('error', (err) => callback(null, err));

  const total = (items || []).reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0);

  const margin = 50;
  const pageW = doc.page.width;
  const contentW = pageW - margin * 2;

  const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
  let y = margin;

  if (fs.existsSync(logoPath)) {
    const buf = fs.readFileSync(logoPath);
    const dims = pngDimensions(buf);
    const logoW = 132;
    const logoH = dims ? (logoW * dims.height) / dims.width : 48;
    const logoX = (pageW - logoW) / 2;
    doc.image(logoPath, logoX, y, { width: logoW });
    y += logoH + 14;
  } else {
    doc.fillColor(THEME.text).fontSize(22).font('Helvetica-Bold').text(BUSINESS.name, margin, y, {
      align: 'center',
      width: contentW,
    });
    y = doc.y + 6;
    doc.fontSize(10).font('Helvetica').fillColor(THEME.gold).text(BUSINESS.tagline, margin, y, {
      align: 'center',
      width: contentW,
    });
    y = doc.y + 14;
  }

  doc.strokeColor(THEME.goldLine).lineWidth(1.6).moveTo(margin, y).lineTo(pageW - margin, y).stroke();
  y += 10;
  doc.strokeColor(THEME.accent).opacity(0.55).lineWidth(0.75).moveTo(margin, y).lineTo(pageW - margin, y).stroke();
  doc.opacity(1);
  y += 18;

  doc.fillColor(THEME.accent).fontSize(14).font('Helvetica-Bold').text('Quotation', margin, y, {
    align: 'center',
    width: contentW,
  });
  y = doc.y + 8;
  doc.fillColor(THEME.muted).fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-ZA')}`, margin, y, {
    align: 'center',
    width: contentW,
  });
  y = doc.y + 18;

  doc.fillColor(THEME.text).fontSize(10).font('Helvetica-Bold').text('Customer details', margin, y, { width: contentW });
  y = doc.y + 6;
  doc.font('Helvetica').fontSize(9);
  const c = customer || {};
  doc.fillColor(THEME.text).text(`Name: ${c.name || '—'}`, margin, y, { width: contentW });
  y = doc.y + 4;
  doc.text(`Email: ${c.email || '—'}`, margin, y, { width: contentW });
  y = doc.y + 4;
  doc.text(`Phone: ${c.phone || '—'}`, margin, y, { width: contentW });
  y = doc.y + 4;
  doc.text(`Address: ${(c.address || '—').replace(/\n/g, ' ')}`, margin, y, { width: contentW });
  y = doc.y + 16;

  doc.fillColor(THEME.accent).font('Helvetica-Bold').fontSize(10).text('Items', margin, y, { width: contentW });
  y = doc.y + 8;
  doc.fillColor(THEME.text).font('Helvetica').fontSize(9);
  (items || []).forEach((i) => {
    const lineTotal = (i.price || 0) * (i.quantity || 1);
    const sizeStr = i.size ? ` (Size ${i.size})` : '';
    doc.text(`${i.name}${sizeStr} × ${i.quantity || 1}  ${formatPrice(lineTotal)}`, margin, y, { width: contentW });
    y = doc.y + 4;
  });
  y += 6;
  doc.fillColor(THEME.accent).font('Helvetica-Bold').text(`Total: ${formatPrice(total)}`, margin, y, { width: contentW });
  y = doc.y + 22;

  doc.fillColor(THEME.text).fontSize(10).font('Helvetica-Bold').text('How to complete your order', margin, y, { width: contentW });
  y = doc.y + 8;
  doc.font('Helvetica').fontSize(9).fillColor(THEME.muted);
  doc.text('Please send this quotation to us by one of the following:', margin, y, { width: contentW });
  y = doc.y + 8;
  doc.fillColor(THEME.text);
  doc.text(`• Email: ${BUSINESS.email}`, margin, y, { width: contentW });
  y = doc.y + 4;
  doc.text(`• WhatsApp: ${BUSINESS.phone}`, margin, y, { width: contentW });
  y = doc.y + 4;
  doc.text(`• Call: ${BUSINESS.phone}`, margin, y, { width: contentW });
  y = doc.y + 4;
  doc.text(`• Visit: ${BUSINESS.address}`, margin, y, { width: contentW });
  y = doc.y + 8;
  doc.fillColor(THEME.muted).text('We will confirm availability and payment details.', margin, y, { width: contentW });

  doc.end();
}

module.exports = { buildQuotationPDF };
