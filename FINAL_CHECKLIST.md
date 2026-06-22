# Pre-Demo Verification Checklist
> **INDUS BRAIN AI - ET AI Hackathon Release Candidate v1.0**

Perform these checks in order in the **5 minutes before** presenting to the judges:

## 1. Environment & Keys
- [ ] If you have Google Gemini API keys, open a terminal and set them in your environment (or write them in a `.env` file in the root directory):
  ```bash
  set GEMINI_API_KEY=AQ.Ab8RN6...
  set GEMINI_API_KEY_2=AQ.Ab8RN6...
  set GEMINI_API_KEY_3=AQ.Ab8RN6...
  ```
- [ ] Verify that internet connectivity is stable if using live Gemini keys.
- [ ] *Self-Correction:* If offline, do NOT panic. The system automatically detects missing keys or timeouts, falling back to the local simulated RAG matcher. The demo will work perfectly offline.

## 2. Database & Seeding
- [ ] Reset the database to a clean, fully populated state representing the **INDUS ENERGY PLANT** by running:
  ```bash
  python -m backend.seed_data
  ```
- [ ] Verify the terminal outputs:
  - `50 Assets seeded successfully.`
  - `20 Incidents seeded.`
  - `100 Maintenance records programmatically generated & seeded.`
  - `Writing 35 scaling documents to disk...`
  - `Dynamic seeding completed successfully.`

## 3. Server Startup
- [ ] Double-click the [run.bat](file:///c:/SIH/run.bat) file (or run `python -m uvicorn backend.main:app --port 8000` in the workspace).
- [ ] Verify the Uvicorn log outputs:
  - `INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)`
- [ ] Keep the server terminal window open and visible in the background.

## 4. Browser Check
- [ ] Open Google Chrome or Microsoft Edge.
- [ ] Navigate to **`http://localhost:8000`**.
- [ ] Verify that the dashboard loads:
  - Plant Health Score reads **65%**.
  - Compliance Index reads **64%**.
  - Active safety alarms reads **3**.
  - Predictive downtime alert banner is flashing red.
- [ ] Click the **AI Executive Briefing** button on the header and ensure the modal pops up immediately.
- [ ] Navigate to the **Expert Copilot** tab and click one of the suggestion chips (e.g. *"What caused repeated pump failure?"*) to verify that RAG results load in under 1 second.
- [ ] Go to the **Risk Simulator** tab, select `PMP-101`, and click **Run Failure Simulation** to ensure the cascading timeline charts generate properly.
- [ ] Go to the **Compliance Audit** tab, toggle a task checkmark, and verify that the circular gauge dynamically updates its score.
- [ ] Clear browser cache (Ctrl+F5) to ensure the latest static bundle is active.

**You are ready to present! Good luck!**
