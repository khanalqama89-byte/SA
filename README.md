# SA — Online Document Converter Platform

**SA** is an enterprise-grade document conversion and processing platform, similar in concept to iLovePDF, featuring a high-performance **Node.js** serverless-ready backend, modern **React (Vite)** frontend, and zero-config deployment to **Vercel** with custom domain support (**GoDaddy**).

---

## 1. Project Structure

```text
SA/
│
├── api/
│   └── index.js                  # Vercel Serverless Function entrypoint
│
├── frontend/
│   └── sa-web/                   # React + Vite application
│       ├── src/
│       │   ├── components/       # Reusable UI elements (Navbar, Footer, Uploader, etc.)
│       │   ├── pages/            # Home, Tools, ToolDetailPage, Login, Register, History, Dashboard
│       │   ├── services/         # Centralized API fetch services (Auth, File, Conversion, Tool)
│       │   ├── context/          # React AuthContext (JWT, user state)
│       │   ├── hooks/            # useConversion custom hook
│       │   ├── routes/           # AppRoutes route definitions
│       │   └── index.css         # Modern design system tokens & styling
│       └── package.json
│
├── backend/
│   ├── sa-node/                  # Full Node.js Backend (Express + PDF/DOCX Engines)
│   │   ├── src/
│   │   │   ├── app.js            # Express application with routes and CORS
│   │   │   ├── server.js         # Local standalone HTTP server (port 8080)
│   │   │   ├── config/           # 15 tool specifications
│   │   │   ├── converters/       # Pure JS engines (pdf-lib, pdfjs-dist, docx, mammoth, archiver)
│   │   │   ├── database/         # Zero-config embedded & MySQL compatible store
│   │   │   ├── middleware/       # JWT auth & Multer memory upload handling
│   │   │   ├── routes/           # Auth, Tools, Files, Conversions, History, Admin
│   │   │   └── storage/          # StorageManager (/tmp on Vercel, local disk, in-memory cache)
│   │   ├── test-server.js        # Automated API integration tests
│   │   └── test-converters.js    # Unit validation for all 15 converters
│   │
│   └── sa-server/                # (Optional) Original Spring Boot Java backend
│
├── storage/                      # Local physical file storage (uploads, processed, temp)
├── vercel.json                   # Vercel deployment & routing configuration
├── package.json                  # Root monorepo scripts & dependencies
└── README.md
```

---

## 2. Requirements

- **Node.js**: 18+ (Node 20 or 24 recommended)
- **npm**: 9+
- *(Optional)* **Vercel CLI**: `npm i -g vercel` (for terminal deployment)

---

## 3. Quick Start Guide (Local Development)

### Step 1: Install Dependencies
```bash
npm run install:all
```

### Step 2: Run Automated Tests
```bash
npm test
```
*Validates the health check, JWT authentication, file upload, conversion pipelines, and all 15 document conversion engines.*

### Step 3: Start Development Servers
Run the Node.js backend:
```bash
npm run server
```
*(Backend runs on `http://localhost:8080`)*

In a second terminal, start the React frontend:
```bash
npm run client
```
*(Frontend runs on `http://localhost:3000` with automated proxying to the backend)*

---

## 4. Deploying to Vercel (Frontend & Backend Both)

The platform is pre-configured with `vercel.json` and `api/index.js` so that **both frontend and backend deploy as a single unified project on Vercel**.

### Method A: Deploy via GitHub (Recommended)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Convert backend to Node.js for Vercel deployment"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** &rarr; **"Project"**.
4. Import your GitHub repository (`SA` or your repo name).
5. Leave the default settings:
   - **Framework Preset**: Other (or Vite)
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build` (detected automatically from `vercel.json`)
   - **Output Directory**: `frontend/sa-web/dist` (detected automatically)
6. Click **Deploy**. Vercel will build the React SPA and deploy the Node.js serverless API functions automatically!

### Method B: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI globally (if not installed)
npm i -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Deploy to production
vercel --prod
```

---

## 5. Connecting Your GoDaddy Domain to Vercel

Follow these simple steps to link the domain you bought from GoDaddy to your Vercel deployment:

### Step 1: Add the Domain in Vercel
1. Go to your Vercel Dashboard and click on your deployed project.
2. Navigate to **Settings** &rarr; **Domains**.
3. Type your GoDaddy domain name (e.g. `yourdomain.com`) and click **Add**.
4. Vercel will ask you to also add `www.yourdomain.com` (recommended to redirect `www` to root or vice versa).
5. Vercel will show the exact DNS records needed:
   - **A Record**:
     - **Name / Host**: `@`
     - **Value**: `76.76.21.21`
   - **CNAME Record**:
     - **Name / Host**: `www`
     - **Value**: `cname.vercel-dns.com`

### Step 2: Configure DNS in GoDaddy
1. Log in to [GoDaddy Domain Portfolio](https://dcc.godaddy.com/).
2. Click on the domain you purchased.
3. Scroll down or click **Manage DNS** (or **DNS Records**).
4. Edit or add the following records:
   - **Record 1 (Root Domain)**:
     - **Type**: `A`
     - **Name**: `@`
     - **Value**: `76.76.21.21`
     - **TTL**: `1/2 Hour` (or `600 seconds` / default)
   - **Record 2 (WWW Subdomain)**:
     - **Type**: `CNAME`
     - **Name**: `www`
     - **Value**: `cname.vercel-dns.com`
     - **TTL**: `1/2 Hour`
   *(Delete any old Parked A records pointing to GoDaddy holding pages if present).*
5. Click **Save**.

### Step 3: Verification & Automatic SSL
- Go back to Vercel and check your **Domains** tab.
- Once DNS propagation begins (usually 2 to 15 minutes), Vercel will display a **Valid Configuration** green checkmark.
- Vercel will automatically provision a free **Let's Encrypt SSL/TLS Certificate** for your domain.
- Your document converter platform is now live on `https://yourdomain.com`!

---

## 6. Supported 15 Conversion Tools

All 15 converters run natively in Node.js using modern, cross-platform libraries without requiring server-level native binaries:

| Tool Name | Slug | Source | Target | Engine |
| :--- | :--- | :---: | :---: | :--- |
| **PDF to Word** | `pdf-to-word` | `.pdf` | `.docx` | Mozilla PDF.js + docx |
| **Word to PDF** | `word-to-pdf` | `.docx` | `.pdf` | mammoth + pdf-lib |
| **PDF to Text** | `pdf-to-text` | `.pdf` | `.txt` | Mozilla PDF.js text extractor |
| **PDF to JPG** | `pdf-to-jpg` | `.pdf` | `.zip` | pdf-lib + archiver |
| **JPG to PDF** | `jpg-to-pdf` | `.jpg` | `.pdf` | pdf-lib JPG embedder |
| **PNG to PDF** | `png-to-pdf` | `.png` | `.pdf` | pdf-lib PNG embedder |
| **PDF to PNG** | `pdf-to-png` | `.pdf` | `.zip` | pdf-lib + archiver |
| **Merge PDF** | `merge-pdf` | `.pdf` | `.pdf` | pdf-lib page combiner |
| **Split PDF** | `split-pdf` | `.pdf` | `.zip` | pdf-lib page splitter + archiver |
| **Compress PDF** | `compress-pdf` | `.pdf` | `.pdf` | pdf-lib stream optimizer & cleaner |
| **Rotate PDF** | `rotate-pdf` | `.pdf` | `.pdf` | pdf-lib rotation matrix |
| **Extract PDF Pages** | `extract-pdf-pages` | `.pdf` | `.pdf` | pdf-lib page range extractor |
| **Delete PDF Pages** | `delete-pdf-pages` | `.pdf` | `.pdf` | pdf-lib page stripper |
| **HTML to PDF** | `html-to-pdf` | `.html` | `.pdf` | HTML parser + pdf-lib |
| **Text to PDF** | `text-to-pdf` | `.txt` | `.pdf` | pdf-lib typography & paginator |

---

## 7. REST API Endpoints

All endpoints are available at `/api/*` both locally and on Vercel:

- `GET  /api/health` — Service health check
- `GET  /api/tools` — List all enabled tools
- `GET  /api/tools/:slug` — Retrieve tool configuration by slug
- `POST /api/auth/register` — Create new user account
- `POST /api/auth/login` — Sign in and get JWT token
- `GET  /api/auth/me` — Inspect profile (authenticated)
- `POST /api/files/upload` — Multipart document upload
- `GET  /api/files/:id` — Inspect file metadata
- `DELETE /api/files/:id` — Delete uploaded file
- `POST /api/conversions` — Start conversion job (`{ toolSlug, sourceFileId, options }`)
- `GET  /api/conversions/:id/status` — Poll conversion status
- `GET  /api/conversions/:id/download` — Stream converted output file
- `POST /api/conversions/:id/cancel` — Cancel active job
- `GET  /api/history` — User conversion history (authenticated)
- `DELETE /api/history/:id` — Delete history record
- `GET  /api/admin/stats` — Platform metrics & active queue
