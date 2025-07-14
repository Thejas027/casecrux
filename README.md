# CaseCrux Legal Case Summarizer

A modern web application for uploading, summarizing, and managing legal documents. Built with React (frontend), Express/MongoDB (backend), and integrates with an LLM-powered summarization service.

## Features

- **Upload & Summarize Documents:** Upload single or multiple legal documents and generate detailed summaries using AI.
- **Summary Management:**
  - View all individual document summaries on the homepage.
  - Download or delete any summary.
  - Navigate to detailed views for each summary.
- **Batch & Category Analysis:**
  - Search and process documents by category.
  - Generate batch summaries and translations.
- **Overall Summaries:**
  - Generate and view overall/case-level summaries from multiple documents.
  - Sidebar with history of all overall summaries, including download and delete options.
- **Advanced Summarization:**
  - Multi-level (detailed, concise, executive) and dual-method (abstractive, extractive) analysis.
- **Translation:**
  - Translate summaries into multiple languages using integrated APIs.
- **Modern UI/UX:**
  - Dark, glassy, and visually appealing interface.
  - Responsive design with sidebar navigation and breadcrumbs.
- **Chatbot:**
  - AI-powered chatbot for legal queries and support.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router
- **Backend:** Node.js, Express, MongoDB, Mongoose, Multer, Redis
- **AI Service:** Python (FastAPI, LangChain, Groq LLM, PyPDF)
- **Deployment:** Vercel (frontend & backend), Railway (optional backend)

## Folder Structure

- `client/` — React frontend (Vercel-ready)
  - `.vercel/` — Vercel project linking info (do not commit)
  - `vercel.json` — Vercel build/output config
  - `src/` — Main app code
- `server/` — Express backend API (Vercel-ready)
  - `.vercel/` — Vercel project linking info (do not commit)
  - `vercel.json` — Vercel config
  - `controllers/`, `models/`, `routes/`, `utils/` — API logic
- `services/` — Python LLM summarization microservice
  - `app/` — FastAPI app, routes, services, utils
  - `requirements.txt`, `run.sh` — Setup scripts

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.9+
- MongoDB (local or Atlas)

### Setup

#### 1. Backend (Express API)

```bash
cd server
npm install
# Set up your .env file with MONGO_URI and any other secrets
npm run dev
```

#### 2. Frontend (React)

```bash
cd client
npm install
npm run dev
```

#### 3. AI Summarization Service (Python)

```bash
cd services
pip install -r requirements.txt
# Set up your .env with GROQ_API_KEY(s)
./run.sh
```

### Vercel Deployment

#### Frontend

- Vercel auto-detects `client/vercel.json` for build and SPA routing.
- Deploy with:

  ```bash
  cd client
  npx vercel --prod
  ```

- Output: [https://casecrux.vercel.app](https://casecrux.vercel.app)

#### Backend

- Vercel uses `server/vercel.json` for compatibility.
- Deploy with:

  ```bash
  cd server
  npx vercel --prod
  ```

- Output: Vercel backend URL (see deploy script)
- For production reliability, consider deploying backend to Railway.

#### .vercel Folder

- Created when you link a directory to a Vercel project.
- Contains project and org IDs.
- **Do not commit**; automatically added to `.gitignore`.

## Customization

- Update LLM API keys and endpoints in `services/app/config.py` and `.env` files.
- Adjust MongoDB connection in `server/.env`.
- Tweak Vercel build/output in `vercel.json` files.

## Troubleshooting & FAQ

- **Vercel build fails?**
  - Check `vercel.json` for correct build/output settings.
  - Ensure `.vercel` is not committed.
- **Backend not connecting?**
  - Verify MongoDB URI and environment variables.
- **API keys not working?**
  - Set all required keys in `.env` and `config.py`.
- **Frontend routing issues?**
  - Confirm SPA rewrites in `client/vercel.json`.

## License

MIT

---

**CaseCrux** — AI-powered legal document intelligence