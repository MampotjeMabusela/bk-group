// Express app with API routes only (used by server/index.js locally and by api/index.js on Vercel)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { buildQuotationPDF } = require('./quotation-pdf');

const app = express();
app.use(cors());
app.use(express.json());

const productsPath = path.join(__dirname, 'products.json');
const feedbackPath = process.env.VERCEL
  ? path.join(process.env.TMPDIR || '/tmp', 'feedback.json')
  : path.join(__dirname, 'feedback.json');

function readJson(filePath, defaultValue = []) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/products', (req, res) => {
  const products = readJson(productsPath, []);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJson(productsPath, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/quotation', (req, res) => {
  const { items, customer } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Quotation must contain at least one item' });
  }
  buildQuotationPDF({ items, customer: customer || {} }, (pdfBuffer, err) => {
    if (err) {
      console.error('PDF error:', err);
      return res.status(500).json({ error: 'Failed to generate quotation' });
    }
    const filename = `B-K-Group-Quotation-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  });
});

app.post('/api/feedback', (req, res) => {
  const { name, email, message, rating, subject } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
    subject: subject || 'general',
    createdAt: new Date().toISOString(),
  };
  try {
    const feedback = readJson(feedbackPath, []);
    feedback.push(entry);
    writeJson(feedbackPath, feedback);
  } catch (e) {
    console.error('Feedback write error:', e.message);
    return res.status(500).json({ error: 'Could not save feedback' });
  }
  res.status(201).json({ success: true, id: entry.id });
});

module.exports = app;
