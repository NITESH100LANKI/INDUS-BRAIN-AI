# INDUS BRAIN AI - Deployment & Operations Guide

This guide outlines the production deployment methodologies for **INDUS BRAIN AI**, built for the **ET AI Hackathon 2026**.

---

## 1. System Audit & Core Frameworks

* **Frontend Framework:** React 18, Vite 8, Tailwind CSS v3, Lucide React icons, and D3-based physics graph engines.
* **Backend Framework:** Python 3.9+ FastAPI, SQLAlchemy ORM (SQLite relational graph and vector db tables), and uvicorn server.
* **Database Engine:** File-based SQLite (`indus_brain.db`). Automatic tables schema generation and operational data seeding on server startup.
* **AI Engine:** Google Gemini API Client wrapper with rate-limit rotation (3 keys) and offline local TF-IDF vector database fallback.

---

## 2. Environment Variables

Configure the following variables in your hosting provider's dashboard:

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Yes (Online) | N/A | Primary API key for Gemini RAG diagnostics & briefings. |
| `GEMINI_API_KEY_2` | No | N/A | Secondary key for rate-limit failovers. |
| `GEMINI_API_KEY_3` | No | N/A | Tertiary key for rate-limit failovers. |
| `PORT` | Yes (Cloud) | `8000` | The port the FastAPI uvicorn backend binds to (auto-configured by Render). |
| `PYTHON_VERSION` | No | `3.10.5` | Recommended python version for cloud builds. |

---

## 3. Recommended Deployment: Unified Single-Server (Render)

This method deploys both the backend APIs and compiles the React static files onto a single web service. The FastAPI server serves the compiled frontend directly, avoiding CORS configuration issues.

### Render Web Service Settings:
* **Repository:** `https://github.com/NITESH100LANKI/INDUS-BRAIN-AI`
* **Environment:** `Python`
* **Region:** Select the closest region (e.g., `Singapore` or `Oregon`).
* **Branch:** `main`
* **Build Command:**
  ```bash
  pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
  ```
* **Start Command:**
  ```bash
  python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
  ```

*A pre-configured `render.yaml` infrastructure-as-code file is included in the repository root for automated Render Blueprint imports.*

---

## 4. Alternative Deployment: Decoupled Architecture

For decoupled setups, you host the React static site on Netlify and the FastAPI backend on Render.

### A. Backend API (Render Web Service)
* **Build Command:** `pip install -r backend/requirements.txt`
* **Start Command:** `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
* **URL Generated:** Take note of the output domain (e.g. `https://indus-brain-api.onrender.com`).

### B. Frontend Static Site (Netlify)
Netlify builds the React app and proxies `/api/*` requests to the Render backend to prevent cross-origin errors (CORS).

1. Edit [netlify.toml](file:///c:/SIH/netlify.toml) to change the redirect URL `https://indus-brain-api.onrender.com` to your actual Render API endpoint.
2. Link your repository to Netlify with the following settings:
   * **Base Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Publish Directory:** `frontend/dist`
3. Click **Deploy**. Netlify will build the client and handle API proxy routing dynamically.

---

## 5. Persistent Storage & Database Seeding

On startup, the FastAPI app checks for `indus_brain.db`. If empty or missing, the backend automatically runs `backend/seed_data.py` to:
1. Seed **50 assets**, **100 maintenance records**, and **20 safety incidents**.
2. Parse **35 document files** (15 SOPs, 10 Audits, 10 Inspections) to build the **226 nodes / 351 edges** Knowledge Graph.

*Note: Render free instances reset local databases on redeploys. For permanent data preservation, attach a **Render Persistent Disk** (size 1GB, mounted at `/data`) and modify the DATABASE_URL in `backend/database.py` to `sqlite:////data/indus_brain.db`.*
