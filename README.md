CaseCrux Legal Case Summarizer

A modern web application for uploading, summarizing, and managing legal PDF documents. Built with React (frontend), Express/MongoDB (backend), and integrates with an LLM-powered summarization service.

Features

Upload & Summarize PDFs: Upload single or multiple legal PDF files and generate detailed summaries using AI.

Summary Management:

View all individual PDF summaries on the homepage.

Download or delete any summary.

Navigate to detailed views for each summary.

Overall Summaries:

Generate and view overall/case-level summaries from multiple PDFs.

Sidebar with history of all overall summaries, including download and delete options.

Modern UI/UX:

Dark, glassy, and visually appealing interface.

Responsive design with sidebar navigation and breadcrumbs.

Why CaseCrux? (Who Is It Useful For?)

CaseCrux is especially useful for:

Lawyers & Advocates:
Quickly understand large case files, reduce reading time, and extract key points before hearings.

Law Firms:
Improve productivity by automating the summarization of long case documents, petitions, affidavits, FIRs, judgments, etc.

Legal Researchers:
Speed up literature reviews and document analysis by generating accurate, structured summaries.

Judicial Officers & Clerks:
Get concise snapshots of long case bundles, helpful for pre-hearing preparation.

Law Students:
Understand complex judgments, case laws, and legal documents more efficiently.

Corporate Legal Teams:
Summarize compliance documents, contracts, and internal reports quickly.

Anyone Working with Legal PDFs:
Saves time, reduces manual effort, and enhances productivity with AI-powered insights.

Tech Stack

Frontend: React, Tailwind CSS, Axios, React Router

Backend: Node.js, Express, MongoDB, Mongoose, Multer

AI Service: Python (FastAPI, LangChain, Groq LLM, PyPDF)

Getting Started
Prerequisites

Node.js & npm

Python 3.9+

MongoDB (local or Atlas)

Setup
1. Backend (Express API)
cd server
npm install
# Set up your .env file with MONGO_URI and any other secrets
npm run dev

2. Frontend (React)
cd client
npm install
npm run dev

3. AI Summarization Service (Python)
cd services
pip install -r requirements.txt
# Set up your .env with GROQ_API_KEY(s)
./run.sh

Usage

Open the frontend at http://localhost:3000

Upload PDFs, view summaries, generate overall summaries, and manage your summary history.

Folder Structure

client/ — React frontend

server/ — Express backend API

services/ — Python LLM summarization microservice

Customization

Update LLM API keys and endpoints in services/app/config.py and .env files.

Adjust MongoDB connection in server/.env.

License

MIT

CaseCrux — AI-powered legal document intelligence
