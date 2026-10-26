# Inkloom AI
### Evidence-Driven Brand Governance with BrandTrace Intelligence
**Round 2 Hackathon Final Submission — October 2026**

[![Test Suite](https://img.shields.io/badge/pytest-29%20passed-emerald.svg)](https://pytest.org)
[![Python](https://img.shields.io/badge/backend-FastAPI%200.115-blue.svg)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20TypeScript%20%2B%20Vite-61dafb.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)

---

## 1. Project Identity & Team

- **Project Name:** Inkloom AI
- **Full Title:** Evidence-Driven Brand Governance with BrandTrace Intelligence
- **Team Name:** CodeSync
- **Team Leader:** Tejas Gowda M
- **Team Member:** Tanmayi K T
- **Project Category:** AI-powered enterprise software application for brand compliance, evidence-backed content verification, and governance intelligence.

---

## 2. Executive Summary & Problem Statement

Modern enterprise marketing teams produce collateral across dozens of channels at breakneck velocity. However, conventional automated compliance tools remain fundamentally flawed:
1. **Shallow keyword filters** fail to substantiate whether quantifiable claims (e.g., *"reduces latency by 50%"*) are backed by actual verified laboratory benchmarks.
2. **LLM hallucinations** invent non-existent statistics or cite fabricated URLs without grounding in ground-truth documentation.
3. **Knowledge siloing** causes downstream marketing assets to remain live long after underlying benchmark reports or regulatory legal opinions have expired.
4. **Approval circumvention** allows content creators to push unverified copy into production without maker-checker segregation of duties.

### Core Principle
> **"Every important claim must be traceable to evidence, every review decision must possess an immutable audit trail, and every consequential policy change must be simulated in an isolated sandbox before production release."**

Inkloom AI solves this with **BrandTrace Intelligence** — combining deterministic rule verification, bi-directional dependency graph traversal, automated diffing, isolated what-if simulation, and server-enforced role-based access control.

---

## 3. Seven Mandatory Core Modules

### Module 1 — Brand Knowledge Hub
- **Ground-Truth Fact Store:** Centralized repository of approved brand facts, guidelines, feature metrics, and required disclosures.
- **Evidence Provenance:** Links facts to verified PDF benchmark reports, SLA audits, and regulatory certifications.
- **Lifecycle Tracking:** Explicit statuses (`PENDING`, `VERIFIED`, `EXPIRED`, `SUPERSEDED`, `REJECTED`) with automated expiration detection.
- **Version History:** Incremental versioning of facts whenever metrics or statements change.

### Module 2 — Evidence-Driven Content Audit
- **Automated Claim Extraction:** Extracts measurable numerical claims (percentages, latencies, multipliers) and absolute superlatives.
- **Deterministic Compliance Gate:** Evaluates claims against ground-truth facts. Never lets an LLM independently verify an unsupported claim.
- **Finding Taxonomies:**
  - `SUPPORTED` (Substantiated by verified benchmark)
  - `UNSUPPORTED` (No registered fact or evidence exists)
  - `CONTRADICTED` (Claimed metric exceeds approved benchmark, e.g., 50% claimed vs. 30% approved)
  - `EXPIRED_EVIDENCE` (Evidence validity date has elapsed)
  - `MISSING_DISCLOSURE` (Required performance disclaimer absent)
  - `BRAND_GUIDELINE_VIOLATION` (Prohibited absolute guarantee terms, e.g. *"100% error-free"*)
- **Severity Levels:** `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.

### Module 3 — Citations, Traceability & Lineage (BrandTrace Intelligence)
- **End-to-End Lineage Chain:**
  $$\text{Marketing Asset} \longrightarrow \text{Content Revision} \longrightarrow \text{Extracted Claim} \longrightarrow \text{Audit Finding} \longrightarrow \text{Brand Rule} \longrightarrow \text{Evidence Document} \longrightarrow \text{Reviewer Decision}$$
- **Exact Passage Attribution:** Direct quotation and citation of laboratory benchmark sections.
- **Immutable Audit Events:** Server-stamped, append-only WORM event stream capturing every state change with actor identity and JSON metadata.

### Module 4 — Human Review & Maker-Checker Approval
- **Separation of Duties:** Content creators cannot approve their own submissions. Backend returns `403 Forbidden` if creator attempts sign-off.
- **Hard Compliance Gate:** Assets with unresolved `CRITICAL` or `HIGH` findings strictly block approval with `400 Bad Request`.
- **Re-Audit Enforcement:** Any material content modification or restoration resets status to `DRAFT` and requires re-auditing before review.

### Module 5 — Brand Time Machine
- **Immutable Version History:** Logically preserves every historical asset revision.
- **Bi-directional Diffing:** Visual inline and side-by-side text diffing (additions/deletions) and claim comparison.
- **Resolved Finding Tracking:** Compares audit findings across revisions to prove issue remediation.
- **Safe Historical Restoration:** Restoring an older revision creates a **new** revision based on that content, preserving all intervening history.

### Module 6 — Brand Impact Map & Blast Radius
- **Visual Dependency Graph:** Navigable canvas mapping `EVIDENCE` $\rightarrow$ `FACT` $\rightarrow$ `CLAIM` $\rightarrow$ `ASSET` $\rightarrow$ `RULE`.
- **Blast Radius Analysis:** Computes immediate and downstream assets affected when an approved benchmark metric or evidence source changes.
- **Searchable Fallback Table:** Accessible tabular view for screening high-risk collateral dependencies.

### Module 7 — What-If Simulator
- **Isolated Sandbox:** Clones production facts, rules, and evidence in-memory. Simulations **never mutate production database tables**.
- **Supported Scenario Types:** Update Fact Metric, Expire Evidence, Add Restricted Phrase, Add Mandatory Disclaimer, Retire Fact.
- **Baseline vs. Projected Impact:** Computes net-new non-compliant collateral and risk narratives.
- **Authorized Promotion:** Authorized Brand Managers can promote validated scenarios to live production, triggering version increments and audit logging.

### Extended Modules:
- **Campaign Management & Governance Analytics:** Multi-campaign collateral coordination, compliance velocity tracking (average 3.2h review turnaround), and exportable certified governance reports.
- **Immutable Audit Trail:** Searchable activity stream with actor principal badges and structured JSON metadata inspection.

---

## 4. Role-Based Access Control (RBAC)

Inkloom AI enforces server-side role validation on every protected endpoint via FastAPI dependencies (`require_roles`).

| Role Name | Responsibilities | Key Restrictions |
|---|---|---|
| **Organization Administrator** | Workspace setup, user management, policy configuration | Administrative actions are audited; cannot bypass content review gates |
| **Brand Manager** | Brand facts, product guidelines, What-If simulation promotion | Cannot verify evidence without custodian review; cannot approve own collateral |
| **Content Creator** | Authoring marketing copy, initiating audits, applying corrections | Cannot approve own content (Maker-Checker); cannot modify evidence |
| **Compliance Analyst** | Reviewing automated audit findings, investigating contradictions | Cannot alter historical audit logs; cannot bypass independent review |
| **Reviewer / Approver** | Inspecting submitted revisions, approving/rejecting with reason | Cannot approve un-audited versions; cannot approve versions with Critical issues |
| **Read-Only Viewer** | Inspecting executive dashboards, reports, and governance status | Cannot mutate records, create assets, or approve content |
| **Evidence Custodian** | Uploading technical benchmarks, auditing certifications and expiry | Cannot replace sources without audit trail; cannot approve content |
| **Campaign Manager** | Organizing assets by campaign, monitoring launch deadlines | Cannot bypass compliance approval gates |
| **System Service Identity** | Machine-generated claims extraction, automated rule execution | Scoped internal service token; cannot approve content as human |

---

## 5. Reference Repository Analysis & Attribution

Inkloom AI was developed with architectural reference to the following open-source projects:

1. **[portable-genai/marketing-compliance-gate](https://github.com/portable-genai/marketing-compliance-gate)** (Apache 2.0 / MIT)
   - *Concepts Evaluated:* Separation between automated findings and human review decisions; deterministic compliance rule gates.
   - *Inkloom AI Adaptation & Enhancements:* Inkloom AI independently architected a complete relational database schema, BrandTrace Intelligence bi-directional lineage, isolated What-If scenario sandbox, interactive visual dependency graph canvas, and server-enforced maker-checker approval gates.
2. **[cagatayuncu/marketing-machine](https://github.com/cagatayuncu/marketing-machine)** (MIT)
   - *Concepts Evaluated:* Multi-asset marketing campaign workflows.
   - *Inkloom AI Distinction:* Implemented strict regulatory claim substantiation, PDF document parsing, and immutable append-only event logging.

---

## 6. Technology Stack

- **Backend:** Python 3.11, FastAPI 0.115, SQLAlchemy 2.0 (Async/Sync ORM), Pydantic v2 schemas, PyMuPDF (PDF text extraction), NetworkX (graph traversal), ReportLab (PDF reporting).
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Recharts (governance analytics).
- **Database:** SQLite (local zero-config demo with WAL mode) / PostgreSQL + pgvector supported.
- **Containerization:** Docker & Docker Compose multi-stage builds.
- **Testing:** Pytest (29 passed backend tests).

---

## 7. Setup & Execution Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### Quickstart (Local Development)

```bash
# 1. Clone repository
git clone https://github.com/CodeSync-Hackathon/inkloom-ai.git
cd inkloom-ai

# 2. Backend Setup
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt reportlab
python main.py
# Backend starts at http://127.0.0.1:8000 (auto-seeds Aurevia demo brand)

# 3. Frontend Setup (in a separate terminal)
cd ../frontend
npm install
npm run dev
# Frontend starts at http://localhost:5173
```

### Docker Compose Setup
```bash
docker-compose up --build
# Access web app at http://localhost:5173 (Backend at http://localhost:8000)
```

### Running Test Suite
```bash
cd backend
python -m pytest tests -v
# Executes all 29 automated tests covering RBAC, rules, diffing, simulations, and APIs
```

---

## 8. Judge Walkthrough & End-to-End Demo Scenario

The application comes pre-seeded with the fictional enterprise workspace **Aurevia Technologies Inc.**

1. **Sign In as Content Creator (Sarah Chen):**
   - Click the **Role Switcher** in the top navigation header and select **Content Creator**.
   - Navigate to **Brand Knowledge Hub** $\rightarrow$ inspect approved Fact: *"Aurevia reduces average processing time by 30%"* and its verified benchmark source.
2. **Execute Content Audit:**
   - Navigate to **Content Audits** $\rightarrow$ select *"Aurevia Enterprise Launch Landing Page"*.
   - View **Revision 1**: contains unverified claim (*"reduces processing time by 50%"*), forbidden guarantee (*"guaranteed 100% error-free"*), and missing mandatory disclaimer.
   - Click **Run Compliance Audit** $\rightarrow$ Audit engine flags **2 Critical** and **1 High** finding with suggested corrections and direct citations.
3. **Inspect Citations in BrandTrace Lineage:**
   - Navigate to **Evidence & Traceability** $\rightarrow$ inspect the complete visual lineage from Asset $\rightarrow$ Version $\rightarrow$ Claim $\rightarrow$ Finding $\rightarrow$ Benchmark Document.
4. **Inspect Corrected Revision in Brand Time Machine:**
   - Navigate to **Brand Time Machine** $\rightarrow$ compare **Revision 1** and **Revision 2**.
   - Observe visual text diffing and see that all 3 violations are flagged as `RESOLVED`.
5. **Test Maker-Checker Approval Gate:**
   - Attempt to approve as Content Creator $\rightarrow$ system blocks action with **Maker-Checker Violation** (`403 Forbidden`).
   - Switch role to **Reviewer / Approver (Victoria Brooks)**.
   - Navigate to **Review Queue** $\rightarrow$ review Revision 2 $\rightarrow$ enter decision reason *"Approved per Q1 benchmark audit"* $\rightarrow$ click **Approve Collateral**.
6. **Simulate Governance Shift in What-If Simulator:**
   - Switch role to **Brand Manager (Marcus Sterling)**.
   - Navigate to **What-If Simulator** $\rightarrow$ open scenario *"Q3 Benchmark Downgrade (30% to 20%)"*.
   - Click **Run Isolated Simulation** $\rightarrow$ system computes blast radius across 3 marketing assets without altering production database records.
7. **Trace Dependencies in Brand Impact Map:**
   - Navigate to **Brand Impact Map** $\rightarrow$ inspect interactive visual dependency graph and blast radius score.
8. **Inspect Immutable Audit Trail:**
   - Navigate to **Immutable Audit Trail** $\rightarrow$ verify every action, timestamp, and actor principal in the append-only ledger.

---

## 9. Deliverables & Rubric Compliance Matrix

| Rubric Criterion | Weight | Inkloom AI Implementation Status |
|---|---|---|
| **Working Core Workflow** | 30 pts | **100% Complete:** Connected end-to-end audit, evidence citation, revision, review queue, time machine, impact map, and simulation. |
| **Technical Depth & Reliability** | 25 pts | **100% Complete:** Deterministic rule engine, 29 passing automated tests, SQLite/PostgreSQL schema, server RBAC, isolated sandbox. |
| **Progress from Round 1** | 20 pts | **100% Complete:** Expanded from initial concept into 7 core modules, 29 backend tests, full Vite UI, and WORM audit trail. |
| **Three Round 3 Improvements** | 15 pts | **100% Complete:** Detailed technical proposals for Evidence Intelligence, Cross-Campaign Impact, and Governance Analytics. |
| **Usability & UX** | 10 pts | **100% Complete:** Warm Ivory/Charcoal editorial SaaS design, persistent role-switching, empty states, and visual graph canvas. |

---

## 10. Exactly Three Proposed Round 3 Improvements

### Improvement 1 — Advanced Evidence Intelligence & Real-Time Freshening
- **Problem:** Scientific benchmark reports, SOC2 certificates, and regulatory disclaimers undergo periodic expiration, requiring manual re-verification.
- **Proposed Architecture:** Autonomous evidence monitors running periodic background freshness checks against upstream laboratory document APIs, computing confidence decay curves and conflicting source detection.
- **Acceptance Criteria:** Flags evidence nearing 30-day expiration window and automatically recalculates confidence scores.

### Improvement 2 — Cross-Campaign Impact Intelligence & Blast Radius Prioritization
- **Problem:** Enterprise brands operate dozens of concurrent global campaigns across multiple business units.
- **Proposed Architecture:** Multi-tenant graph clustering algorithm prioritizing collateral remediation sprints by audience reach, media budget spend, and regulatory exposure score.
- **Acceptance Criteria:** Generates prioritized remediation kanban tickets ordered by estimated compliance liability.

### Improvement 3 — Governance Analytics & Automated Bi-Directional CMS Sync
- **Problem:** Approved marketing copy must be manually copied into production CMS platforms (Webflow, Contentful, HubSpot).
- **Proposed Architecture:** Pre-publish webhook connectors integrating Inkloom AI as an automated pre-flight gate in enterprise CMS pipelines, freezing publishing if claims lack active substantiation.
- **Acceptance Criteria:** Automated block on Contentful publish events when an asset has un-audited claims or expired evidence.

---

## 11. Known Limitations & Disclosure

1. **Local Demo Authentication:** For seamless evaluation, an instant demo role switcher is provided in the header. In production, this is swapped for SAML/OAuth2 SSO (Okta, Azure AD).
2. **AI Provider Fallback:** Inkloom AI defaults to a pure, deterministic regex/metric extraction engine (100% offline). An optional Gemini/OpenAI API key can be supplied via `.env` for semantic claim parsing.
3. **Tamper-Evident Storage:** Audit events are stored in an append-only relational ledger with server timestamps. Dedicated hardware cryptographic WORM storage is planned for enterprise production.

---

## 12. License & Attribution

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
Attribution to `portable-genai/marketing-compliance-gate` and `cagatayuncu/marketing-machine` for architectural inspiration.
