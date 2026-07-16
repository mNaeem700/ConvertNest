# ConvertNest — Free Universal File Converter Online

ConvertNest is a lightning-fast, production-ready, free online universal file converter. It allows users to convert documents, images, spreadsheets, presentations, eBooks, code files, fonts, and archives instantly in their browser with zero registration barriers, zero payment forms, and zero watermarks.

> **Important Format Restriction**: ConvertNest is optimized for high-performance structured documents, text processing, layouts, data tables, spreadsheets, vectors, and fonts. It **DOES NOT** support heavy multimedia formats (audio/video conversions).

---

## 🚀 Core Features

- **Multi-File Batch Queue**: Drag and drop dozens of files simultaneously, manage them in a responsive queue, rename target names, and download results individually or bundled in a single ZIP.
- **Client-Side Image Engine**: Canvas-based processing converts JPG, PNG, WEBP, GIF, BMP, and ICO formats instantly in the browser without server latency or network bandwidth usage.
- **AI-Enhanced Restructuring**: Utilizes Google Gemini 3.5 models server-side to execute advanced layout transformations (e.g. converting PDF, DOCX, ODT, RTF to beautifully structured Markdown, XML, or HTML).
- **Code & Document Toolbox**: A dedicated panel to validate, beautify, minify, and translate data files (JSON, XML, YAML, CSV, SQL, Markdown) with high-fidelity validation feedback.
- **Offline ZIP Extractor**: Extracts and recompiles compressed ZIP folders purely locally using JSZip.
- **Local History PERSISTENCE**: Statically cached history log utilizing browser `localStorage` with automated cache clearing option.
- **Dynamic programmatic SEO Directory**: Structured sitemaps, articles, and programmatic landing pages for over 100+ conversion pairs (e.g., PDF to DOCX, PNG to WebP).

---

## 🛠️ Tech Stack & Architecture

### Frontend
- **React 19 & Vite**: Ultra-fast hot-reload rendering engine.
- **Tailwind CSS v4**: Beautiful modern utility classes.
- **JSZip & SheetJS (xlsx)**: Full browser-side data parsing for compression and spreadsheets.
- **Lucide Icons & Motion**: Premium layout micro-interactions.

### Backend
- **Node.js & Express**: Extensible JSON API.
- **Mammoth**: Secure raw text and HTML extraction from Microsoft Word documents.
- **Google GenAI SDK**: Google Gemini 3.5 AI pipeline for advanced layout translations.
- **Esbuild**: Compiles TypeScript backend files into a self-contained production bundle.

---

## 📁 Project Folder Structure

```bash
├── /.github/workflows/deploy.yml  # CI/CD Automated build workflows
├── /src
│   ├── /components
│   │   ├── Navbar.tsx             # responsive glassmorphism header navigation
│   │   ├── ConversionTool.tsx     # main multi-file batch uploader, rename & preview
│   │   ├── CodeToolbox.tsx        # code beautify, minify, validate & convert
│   │   ├── ArchiveManager.tsx     # browser-side ZIP packer & extractor
│   │   ├── HistoryPanel.tsx       # localStorage history log
│   │   ├── SeoViews.tsx           # SEO landing pages, articles & contact forms
│   │   └── Footer.tsx             # site footer with modal policy details
│   ├── /data
│   │   └── seoContent.ts          # dynamic 100+ conversion pairings & FAQs generator
│   ├── App.tsx                    # React driver controlling tab routing
│   ├── index.css                  # Tailwind v4 directives & scrollbar presets
│   ├── main.tsx                   # client entry point
│   └── types.ts                   # global typescript interfaces
├── /tests
│   └── convert.test.ts            # comprehensive testing suites
├── /server.ts                     # Express.js REST API server & Vite middleware
├── /netlify.toml                  # Netlify frontend deployment redirect rules
├── /Dockerfile                    # Multi-stage optimized Docker runner
├── /docker-compose.yml            # Docker container orchestration manifest
├── /metadata.json                 # AI Studio application meta configurations
├── /tsconfig.json                 # TypeScript compiler configuration
└── /package.json                  # project dependencies & build commands
```

---

## 🛠️ Local Developer Guide

### Prerequisites
- Node.js (version 20+ or 22+)
- A Google Gemini API Key (Optional: for AI conversion features)

### 1. Install Workspace Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new `.env` file and insert your API key:
```bash
cp .env.example .env
```
Update your secrets:
```env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```

### 3. Start Development Server
This boots the server on port `3000` with hot-reloading for the server and active Vite middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Full-Stack Deployment Guide

### Option 1: Frontend on Netlify
Netlify will host the frontend application.
1. Push this workspace folder to a GitHub repository.
2. Link your repository to a new site on Netlify.
3. Use settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Netlify automatically reads the pre-configured `/netlify.toml` file to route standard Single Page App URL pathways back to `index.html`.

### Option 2: Docker Orchestration (VPS, Railway, Render)
You can compile and deploy the complete full-stack environment using our multi-stage optimized Docker setup.
```bash
# Build and run container
docker-compose up -d --build
```
This launches the Node Express server bound to port `3000` with the static Vite pages embedded inside the static distributor layer.

---

## 📂 API Specifications

### 1. Health Status
- **Endpoint**: `GET /api/health`
- **Output**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-07-16T04:56:00Z",
    "aiEnabled": true
  }
  ```

### 2. Document Conversion
- **Endpoint**: `POST /api/convert`
- **Request Body**:
  ```json
  {
    "fileName": "report.docx",
    "fileContent": "BASE64_ENCODED_STRING",
    "sourceFormat": "docx",
    "targetFormat": "html"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "fileName": "report.html",
    "content": "BASE64_CONVERTED_RESULT",
    "mimeType": "text/html",
    "isAiPowered": false
  }
  ```

### 3. Code Toolbox Utilities
- **Endpoint**: `POST /api/toolbox`
- **Request Body**:
  ```json
  {
    "code": "{\"name\":\"convertnest\",\"free\":true}",
    "language": "json",
    "action": "beautify"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "result": "{\n  \"name\": \"convertnest\",\n  \"free\": true\n}"
  }
  ```

---

## 🔧 Troubleshooting & Support

### Issue: "Vite fails to connect to websocket"
This is expected behavior in our sandboxed browser iframe previews. HMR is safely disabled in the control plane to optimize CPU cycles during agent edits. This error is completely benign and has zero impact on application behavior.

### Issue: "Gemini AI conversions failing"
Make sure your `GEMINI_API_KEY` is not the default placeholder string `"MY_GEMINI_API_KEY"` inside your active `.env` parameters. When deployed inside Google AI Studio, this variable is managed securely via the Secrets panel.
