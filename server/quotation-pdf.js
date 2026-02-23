const PDFDocument = require('pdfkit');

const BUSINESS = {
  name: 'B & K Group',
  tagline: "PHUSHA S'MOKOLO",
  email: 'bandkgroupptyltd@outlook.com',
  phone: '+27 78 237 6257',
  address: 'Moreleta Corner, Cnr Garsfontein Rd & Rubenstain Dr, Moreleta Park, Pretoria',
};

function formatPrice(amount) {
  return 'ZAR ' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function buildQuotationPDF({ items, customer }, callback) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => callback(Buffer.concat(chunks)));
  doc.on('error', (err) => callback(null, err));

  const total = (items || []).reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0);

  doc.fontSize(22).font('Helvetica-Bold').text(BUSINESS.name, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').text(BUSINESS.tagline, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(12).font('Helvetica-Bold').text('Quotation', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-ZA')}`, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(10).font('Helvetica-Bold').text('Customer details');
  doc.font('Helvetica');
  doc.fontSize(9);
  const c = customer || {};
  doc.text(`Name: ${c.name || '—'}`);
  doc.text(`Email: ${c.email || '—'}`);
  doc.text(`Phone: ${c.phone || '—'}`);
  doc.text(`Address: ${(c.address || '—').replace(/\n/g, ' ')}`);
  doc.moveDown(1);

  doc.fontSize(10).font('Helvetica-Bold').text('Items');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9);
  (items || []).forEach((i) => {
    const lineTotal = (i.price || 0) * (i.quantity || 1);
    const sizeStr = i.size ? ` (Size ${i.size})` : '';
    doc.text(`${i.name}${sizeStr} × ${i.quantity || 1}  ${formatPrice(lineTotal)}`);
  });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').text(`Total: ${formatPrice(total)}`);
  doc.moveDown(2);

  doc.fontSize(10).font('Helvetica-Bold').text('How to complete your order');
  doc.font('Helvetica').fontSize(9);
  doc.text('Please send this quotation to us by one of the following:');
  doc.moveDown(0.3);
  doc.text(`• Email: ${BUSINESS.email}`);
  doc.text(`• WhatsApp: ${BUSINESS.phone}`);
  doc.text(`• Call: ${BUSINESS.phone}`);
  doc.text(`• Visit: ${BUSINESS.address}`);
  doc.moveDown(0.5);
  doc.text('We will confirm availability and payment details.');
  doc.end();
}

module.exports = { buildQuotationPDF };
