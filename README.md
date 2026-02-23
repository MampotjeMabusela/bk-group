# B & K Group – PHUSHA S'MOKOLO

Full-stack e-commerce website to sell shoes. Built with Node.js, Express, and vanilla HTML/CSS/JS. Simple, user-friendly store (Takealot/Shein style) with one product and one price per item—no duplicates.

## Features

- **Shop**: Browse all shoes with category filter (Vellies, Slip-Ons, Boots, Sandals). Products and prices match the catalog exactly; each item appears once.
- **Cart**: Add/remove items, change quantity, view total in ZAR.
- **Quotation**: Instead of placing an order online, customers download a **PDF quotation**. They are advised to email the PDF to **bandkgroupptyltd@outlook.com**, WhatsApp **+27 78 237 6257**, call the same number, or visit the store at Moreleta Corner, Cnr Garsfontein Rd & Rubenstain Dr, Moreleta Park, Pretoria. The business then confirms availability and payment.

## Run the site

1. Open a terminal and go into the server folder:
   - If you're inside `B & K Group`: `cd server`
   - If you're in the folder that contains `B & K Group`: `cd "B & K Group\server"`

2. Install and start:
   ```bash
   npm install
   npm start
   ```

3. Open in browser: **http://localhost:3000** (or the next port shown if 3000 is in use).

## Project structure

- `server/` – Express API and static files
  - `index.js` – `/api/products`, `/api/quotation` (PDF), serves `public/`
  - `quotation-pdf.js` – Builds the PDF quotation with business details and “how to complete your order”
  - `products.json` – Single list of products (no duplicates); names, descriptions, and prices match the example listings
- `public/` – Frontend
  - `index.html` – Shop, Cart, Get quotation (form + download PDF + instructions)
  - `styles.css` – Layout and styling
  - `app.js` – Products, cart, PDF download
  - `images/` – Logo, hero image, product photos

## Contact (on website and in PDF)

- **Email:** bandkgroupptyltd@outlook.com  
- **Phone / WhatsApp:** +27 78 237 6257  
- **Address:** Moreleta Corner, Cnr Garsfontein Rd & Rubenstain Dr, Moreleta Park, Pretoria  
