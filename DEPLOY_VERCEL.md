# Deploy B & K Group website to Vercel

Follow these steps to deploy your B & K Group (PHUSHA S'MOKOLO) shoe store to Vercel.

---

## 1. Prerequisites

- A **Vercel account** (free at [vercel.com](https://vercel.com))
- Your project in a **Git repository** (GitHub, GitLab, or Bitbucket), **or** you can deploy with the Vercel CLI without Git

---

## 2. Push your project to Git (recommended)

If the project is not in a repo yet:

1. Open a terminal in the project folder:  
   `c:\Users\mampo\OneDrive\Documents\B & K Group`
2. Initialize Git (if needed):
   ```bash
   git init
   ```
3. Create a `.gitignore` so you don’t upload secrets or dependencies:
   ```
   node_modules
   server/node_modules
   .env
   server/.env
   *.log
   .vercel
   ```
4. Add and commit:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```
5. Create a new repository on **GitHub** (or GitLab/Bitbucket), then link and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Deploy from the Vercel website

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **“Add New…”** → **“Project”**.
3. **Import** your Git repository (GitHub/GitLab/Bitbucket).  
   - If you haven’t connected your Git provider, do it when Vercel asks.
   - Select the repo that contains this project.
4. **Configure the project** (Vercel usually detects it automatically):
   - **Framework Preset:** “Other” (or leave as detected).
   - **Root Directory:** leave as `.` (project root).
   - **Build Command:** `npm run build` (already in `package.json`).
   - **Output Directory:** `public` (already set in `vercel.json`).
   - **Install Command:** `npm install`.
5. (Optional) **Environment variables**  
   If you use a `.env` file locally (e.g. for Gmail), add the same variables in Vercel:
   - In the project import screen, open **“Environment Variables”**.
   - Add each variable (e.g. `GMAIL_USER`, `GMAIL_APP_PASSWORD`) for **Production** (and Preview if you want).
6. Click **“Deploy”**.
7. Wait for the build to finish. You’ll get a URL like `https://your-project.vercel.app`.

---

## 4. Deploy using the Vercel CLI (alternative)

If you prefer not to use Git or want to deploy from your machine:

1. **Install the Vercel CLI** (one time):
   ```bash
   npm install -g vercel
   ```
2. In the project folder, run:
   ```bash
   cd "c:\Users\mampo\OneDrive\Documents\B & K Group"
   vercel
   ```
3. Log in when asked (browser or token).
4. Answer the prompts:
   - **Set up and deploy?** Yes  
   - **Which scope?** Your account  
   - **Link to existing project?** No (first time)  
   - **Project name:** e.g. `bk-group-shoes` (or press Enter for default)  
   - **Directory:** `./` (press Enter)
5. For **production** deployment later:
   ```bash
   vercel --prod
   ```

---

## 5. After deployment

- **Site URL:** Use the URL Vercel gives you (e.g. `https://bk-group-shoes.vercel.app`).
- **Custom domain:** In the Vercel project → **Settings** → **Domains** you can add your own domain.
- **Environment variables:** To change or add variables, go to **Project** → **Settings** → **Environment Variables**, then redeploy.
- **Feedback on Vercel:** Submissions from the Feedback form are stored in the serverless function’s temporary storage and **do not persist** between requests. For permanent storage you’d need a database or Vercel KV; the rest of the site (products, quotation PDF, cart, chatbot) works as normal.

---

## 6. Project structure used by Vercel

- **`public/`** – Served as static files (HTML, CSS, JS, images).
- **`api/index.js`** – Serverless function that runs your API (`/api/products`, `/api/quotation`, `/api/feedback`).
- **`server/`** – API logic and data (`app.js`, `products.json`, `quotation-pdf.js`, etc.).
- **`vercel.json`** – Tells Vercel to serve `public`, route `/api/*` to the function, and send other paths to `index.html` for the SPA. **Do not add a `functions` or `runtime` section** to `vercel.json`; Node version is set only in `package.json` via `engines.node`.
- **`package.json`** – The `engines.node` field (e.g. `"20.x"`) is the only place to set the Node.js version for Vercel. This prevents the "Function Runtimes must have a valid version" error.

---

## 7. Troubleshooting

| Issue | What to do |
|--------|------------|
| **"Function Runtimes must have a valid version"** | Do **not** add `functions` or `runtime` to `vercel.json`. Set Node only in root `package.json`: `"engines": { "node": "20.x" }`. Then redeploy. |
| Build fails | Check the build log in Vercel. Ensure `npm install` and `npm run build` work locally in the project root. |
| 404 on `/api/products` | Confirm `vercel.json` has the rewrite from `/api/(.*)` to `/api` and that `api/index.js` exists. |
| Blank page or wrong route | The SPA rewrite in `vercel.json` should send non-file paths to `/index.html`. Check that `outputDirectory` is `public`. |
| Quotation PDF fails | Ensure `pdfkit` is in the root `package.json` dependencies (it is). If it still fails, check the function logs in Vercel. |

You’re done. Your B & K Group site should be live on Vercel.
