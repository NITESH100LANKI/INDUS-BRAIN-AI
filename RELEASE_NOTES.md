# Release Notes - INDUS BRAIN AI (v1.0)
> **Tagline:** "The operating brain for industrial assets."  
> **Status:** Hackathon Release Candidate v1.0 (Freeze Mode)

## 1. Release Summary
We are proud to freeze the codebase and release **v1.0** of **INDUS BRAIN AI** for the ET AI Hackathon. This platform integrates unstructured documentation parsing, knowledge graph networking, compliance checks, RAG copilot, and predictive failure simulation into a single premium industrial dashboard.

---

## 2. Completed Modules
- **Universal Ingestion & OCR**: Supports plain text, spreadsheets, and scanned PDFs (via deterministic OCR simulation mapping).
- **NLP NER & Relationship Modeler**: Regex-based local NER categorizing `EQUIPMENT`, `FAILURE`, `REGULATION`, `PERSON`, `PROCEDURE` nodes, saving relations dynamically to SQLite.
- **SQLite Graph Schema Layer**: Built-in fallback database representing nodes and edges tables, allowing local graph traversals without Neo4j installations.
- **RAG Semantic Search**: Cosine-similarity TF-IDF matching on chunk overlaps with targeted equipment tag boosters.
- **Multi-Key Gemini RAG Client**: REST API connector supporting automatic rotation and fallbacks across `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, and `GEMINI_API_KEY_3`.
- **Graceful Fallback Mode**: If keys are empty or the network is offline, the chat engine degrades to the local keyword simulation to guarantee a crash-free demo.
- **Executive Command Center Dashboard**: Real-time dials (Plant Health, Compliance Index), downtime alerts, compliance checklist gaps, and lessons learned summaries.
- **AI Executive Briefing Agent**: 1-click printable modal outlining current facility health, top risks, EPA stack exceedances, and actionable corrective check tasks.
- **Asset Digital Twin View**: Renamed Twin interface profiling mechanical specifications, filterable maintenance repair logs, incidents, and adjacent graph neighbors.
- **"What Happens If?" Risk Simulator**: Topological routing simulator predicting cascading equipment stresses, process shutdowns, and regulatory breaches.

---

## 3. Technology Stack & Environment
- **Backend**: FastAPI, SQLAlchemy, SQLite Database.
- **Frontend**: React (Vite), Tailwind CSS v3, Lucide Icons, Custom SVG Physics Engine.
- **Deployment**: Windows `run.bat` local runner, multi-stage Docker configurations, and Docker Compose.
- **Environment Keys**:
  - `GEMINI_API_KEY` - Primary Google LLM Key
  - `GEMINI_API_KEY_2` - Secondary Rotation Key
  - `GEMINI_API_KEY_3` - Tertiary Rotation Key
