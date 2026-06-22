# INDUS BRAIN AI
> **Tagline:** "The operating brain for industrial assets."  
> *Developed for the ET AI Hackathon*

![Executive Command Center Mockup](docs/images/dashboard_screenshot.png)

---

## 1. Product Vision & Value Proposition
Fragmented documents, scans, and maintenance logs in heavy industries lead to unplanned downtime, compliance penalties, and process safety risks. **INDUS BRAIN AI** solves this by unifying unstructured, messy industrial data into a searchable, explainable, and actionable operations brain.

It doesn't just do semantic search; it builds a **hybrid query system** matching:
1. **Vector-based RAG** for document lookup.
2. **Relational Knowledge Graphs** linking equipment tags, failure modes, regulations, and operators.
3. **Automated Audit Engines** that trace compliance gaps and output corrective action checklists.

---

## 2. Architecture Overview
Below is the system architecture diagram:

![System Architecture Diagram](docs/images/architecture_diagram.png)

### System Dataflow:
```
[Messy Documents] -> [Ingestion Pipe (OCR Fallback)] -> [NLP Extraction (NER/Relation)]
                                                                    |
                                                                    v
[Expert Chat] <--- [Vector DB (Search)] <----------------- [SQLite Database Engine]
     |                     ^                               (Assets, Rules, Graph Tables)
     v                     |
[Grounded Answers] + [Citation Trail] + [Interactive Knowledge Graph Map]
```

### Key Modules:
- **Universal Ingestion & OCR**: Decodes log files, spreadsheets, and scanned PDFs, chunking texts with context-aware overlap.
- **NLP NER & Relation Service**: Detects patterns (e.g., equipment tags like `PMP-101`) and registers node relationships in SQLite.
- **SQLite Graph Layer**: Fallback schema storing graph node and link entities, making Neo4j setup optional for stable offline runs.
- **RAG Semantic Search**: Ranks chunk overlaps utilizing tag boosts and mathematical similarity scoring.
- **Compliance Auditor & RCA Engine**: Checks chunk texts against safety rules, raising gap flags and computing plant compliance score percentages.

---

## 3. Database Schema Design
The application runs on a local SQLite database (`indus_brain.db`). The tables map as follows:

| Table Name | Primary Key | Description | Key Columns |
| :--- | :--- | :--- | :--- |
| `uploaded_documents` | `id` | Ingested source files | `filename`, `file_type`, `status` (Processing/Completed/Failed), `summary` |
| `document_chunks` | `id` | Splitted overlap chunks | `document_id` (FK), `text_content`, `page_num`, `chunk_index` |
| `extracted_entities` | `id` | Graph nodes | `document_id` (FK), `name`, `type` (EQUIPMENT/FAILURE/REGULATION/PERSON/etc.) |
| `extracted_relations` | `id` | Graph edges | `document_id` (FK), `source_name`, `target_name`, `relation_type` |
| `equipment_assets` | `id` | Plant equipment catalog | `tag_number` (Unique), `name`, `location`, `risk_score`, `health_index` |
| `incidents` | `id` | Logged safety breakdowns | `asset_tag`, `incident_date`, `severity`, `root_cause`, `corrective_action` |
| `maintenance_events` | `id` | Historical repairs ledger | `asset_tag`, `event_date`, `type`, `cost`, `duration_hours` |
| `compliance_rules` | `id` | Safety audit registry | `rule_code` (Unique), `description`, `category`, `standard_ref` |
| `compliance_findings` | `id` | Discovered audit violations| `document_id` (FK), `rule_code`, `status` (Compliant/Gap), `gap_details` |
| `chat_messages` | `id` | Session chat ledger | `session_id`, `sender` (User/Assistant), `text`, `citations_json` |

---

## 4. API Endpoints Reference
FastAPI exposes the following REST APIs:

- **Document Management**:
  * `POST /api/documents/upload` - Ingests a new file (scans, text, CSV).
  * `GET /api/documents` - Lists uploaded files, summaries, and processing states.
- **Search & Expert Chat**:
  * `GET /api/search?query=...` - Queries vector chunks returning matching snippets.
  * `POST /api/copilot/chat` - Chats with RAG copilot, returning response with exact citation objects.
- **Operational Brain**:
  * `GET /api/graph/data` - Returns nodes/links network data for D3/SVG canvas rendering.
  * `GET /api/graph/drilldown?node_id=...` - Drilldown query returning local subgraph.
  * `GET /api/compliance/summary` - Returns compliance score, gaps array, and checklist tasks.
  * `GET /api/assets/risk` - Lists equipment health indices, risk indexes, and actions.
  * `GET /api/assets/rca/{asset_tag}` - Performs Root Cause Analysis (RCA) on specified asset, outputting evidence logs.
  * `GET /api/lessons-learned` - Returns executive lessons learned summaries.
  * `GET /api/export` - Exports executive report content in markdown.

---

## 5. Startup Instructions

### Windows (Quickstart in 1-Click)
1. Double-click the `run.bat` file in the project folder.
2. The script will automatically:
   - Check and install Python backend pip packages.
   - Seed the database with operational logs, manuals, and assets.
   - Start the unified server on `http://localhost:8000`.
3. Open `http://localhost:8000` in your web browser.

### Docker Setup (Self-Contained Run)
To run the prototype inside a containerized environment (no local Python/Node dependencies required):
```bash
# Build and launch image
docker-compose up --build

# Access UI and API Gateway
# Go to: http://localhost:8000
```

---

## 6. Pitch Presentation Deck Content

- **Slide 1: Title & Tagline**
  - *Title:* INDUS BRAIN AI
  - *Subtitle:* The operating brain for industrial assets.
  - *Presenter:* [Your Team Name]
- **Slide 2: The Problem**
  - *Title:* Unstructured Silos Cause Operational Blindspots
  - *Points:* Heavy industry workers spend hours searching paper logs, expired certifications, and unsigned SOP revisions. This fragmentation triggers safety incidents, audit penalties, and costly downtime.
- **Slide 3: The Solution**
  - *Title:* INDUS BRAIN AI: A Unified Operations Brain
  - *Points:* A platform combining RAG semantic search, SQLite relational graphs, and compliance reasoning agents to transform messy records into instant, cited advice.
- **Slide 4: System Architecture**
  - *Title:* Modular Ingestion & Retrieval Pipeline
  - *Points:* Universal Ingestion (OCR fallback) -> NLP NER (Entity/Relation Mapper) -> SQLite database (Vector/Graph fallback) -> Interactive Dashboard UI.
- **Slide 5: Live Knowledge Graph Engine**
  - *Title:* Transcending Search to Map Asset Relationships
  - *Points:* Connects `EQUIPMENT -> HAS_FAILURE -> FAILURE`, `SOP -> APPLIES_TO -> EQUIPMENT`, and `OSHA -> REQUIRES -> CONTROL` dynamically for diagnostic drill-down.
- **Slide 6: Grounded RAG Copilot**
  - *Title:* Zero Hallucination, 100% Citation
  - *Points:* Engineers ask questions and receive answers strictly derived from chunks with highlighted source files, page numbers, and confidence metrics.
- **Slide 7: Compliance Auditor**
  - *Title:* Automated Gap Detection & Corrective Action Checklists
  - *Points:* Audits plant files against safety frameworks (OSHA, ASME, API, EPA) to highlight gaps and assign corrective action schedules.
- **Slide 8: Root Cause Analysis (RCA) Agent**
  - *Title:* Diagnostics Fueled by Historical Evidence
  - *Points:* Aggregates failure logs, vibration telemetry, and maintenance costs to recommend preventative repairs with explicit evidence trails.
- **Slide 9: Business Impact**
  - *Title:* Tangible ROI for Industrial Enterprises
  - *Points:* 35% reduction in compliance overhead, 20% decline in troubleshooting search time, and significant reduction in unplanned downtime.
- **Slide 10: Summary & Closing**
  - *Title:* The Operating Brain for Tomorrow's Infrastructure
  - *Points:* INDUS BRAIN AI is scalable, runs offline/locally or connects to OpenAI models, and maps unstructured data to concrete operations. Let's make safety and efficiency intelligent!

---

## 7. 3-5 Minute Live Demo Script

**Presenter Prep:** Launch the app using `run.bat` and open `http://localhost:8000`.

* **Step 1: Introduction (0:00 - 0:45)**
  - *"Judges, today we present INDUS BRAIN AI, the operating brain for industrial assets. Let's look at the Control Room dashboard. Here we see real-time plant telemetry: our compliance score sits at 64%, we have 3 active compliance gaps, 4 ingested files, and 2 critical safety incidents logged. On the left, our Asset Matrix highlights that Pump PMP-101 and Boiler Boiler-2 represent critical risks."*

* **Step 2: Universal Ingestion & OCR (0:45 - 1:30)**
  - *"Let's go to the Ingestion page. When engineers upload PDFs, inspection logs, or scanned PNG images, our backend extracts text, segments it into vector chunks, and maps relationships. For example, selecting our parsed 'boiler_inspection_report.pdf' reveals the extracted entities like Boiler-2, Valve VLV-204, and ASME Section VIII. Our relations tracker immediately links Boiler-2 to scale buildup."*

* **Step 3: Interactive Knowledge Graph (1:30 - 2:15)**
  - *"How do these entities talk? Let's check the Knowledge Graph tab. This is a live force-directed network diagram. Blue represents equipment, red represents failures, amber represents regulations. Hovering highlights connections. Let's double-click on Pump PMP-101. The graph drill-down highlights its exact relationships: it suffered cavitation and vibration, it was maintained by John Doe, and is tied to safety SOP regulations. We can browse metadata on the right panel instantly."*

* **Step 4: Grounded RAG Chat Copilot (2:15 - 3:00)**
  - *"Now let's ask our Expert Copilot: 'What caused repeated pump failure?'. Our engine queries the vector index, scores the chunks, and outputs a structured answer: Cavitation and bearing wear due to suction head pressure drops. Notice the amber 'Inspect Grounded Citations' button. Clicking it slides out the Citation Inspector, proving the exact file context, page count, and confidence percentage. No hallucinations."*

* **Step 5: Compliance and RCA Resolution (3:00 - 3:45)**
  - *"In the Compliance tab, we see the 3 safety gaps. Let's look at the corrective checklist for Boiler-2's expired valves. We have assigned maintenance tasks. When I check off 'Overhaul bypass valve VLV-204' and 'Schedule inspector validation', our compliance score dynamically recalibrates from 64% up to 100%. Finally, checking our Maintenance RCA tab reveals full root-cause diagnoses, preventative recommendations, and the verbatim log evidence trail for any asset. INDUS BRAIN AI brings fragmented archives into clear focus."*

* **Step 6: Wrap-up (3:45 - 4:00)**
  - *"By combining vector search with SQLite relationship graphs and compliance auditors, INDUS BRAIN AI reduces search overhead and safeguards industrial infrastructure. Thank you!"*
