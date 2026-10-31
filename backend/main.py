from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, sync_engine
from app.seed_data import seed_database

# Routers
from app.api.auth import router as auth_router
from app.api.brands import router as brands_router
from app.api.facts import router as facts_router
from app.api.evidence import router as evidence_router
from app.api.rules import router as rules_router
from app.api.assets import router as assets_router
from app.api.audits import router as audits_router
from app.api.reviews import router as reviews_router
from app.api.time_machine import router as time_machine_router
from app.api.impact import router as impact_router
from app.api.simulator import router as simulator_router
from app.api.dashboard import router as dashboard_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized and seeded
    print("[Inkloom AI] Bootstrapping database schema...")
    Base.metadata.create_all(bind=sync_engine)
    seed_database()
    print("[Inkloom AI] System operational. BrandTrace Intelligence active.")
    yield

tags_metadata = [
    {"name": "Authentication & RBAC", "description": "Session authentication, demo role profiles, and RBAC authorization"},
    {"name": "Brands & Products", "description": "Brand profiles, products, campaigns, approved claims, and guidelines"},
    {"name": "Brand Facts", "description": "Approved brand claims, product facts, and evidence associations"},
    {"name": "Evidence Library", "description": "Evidence records, verification workflows, and expiry monitoring"},
    {"name": "Brand Rules", "description": "Policy constraints, required disclaimers, and compliance rules"},
    {"name": "Marketing Assets", "description": "Marketing copy, versioned asset revisions, and claim extraction"},
    {"name": "Content Audits", "description": "AI-assisted and deterministic compliance audits and BrandTrace lineage"},
    {"name": "Review & Approval", "description": "Human review queue, maker-checker separation, and approval decisions"},
    {"name": "Brand Time Machine", "description": "Sentence-level version diffing, finding deltas, and non-destructive restore"},
    {"name": "Brand Impact Map", "description": "Topological graph dependencies and blast-radius analysis"},
    {"name": "What-If Simulator", "description": "Isolated scenario projections and authorized promotion to production"},
    {"name": "Governance & Analytics", "description": "Compliance velocity, risk summaries, and WORM audit history"},
    {"name": "Health & System", "description": "System status, health probes, and runtime intelligence telemetry"},
]

app = FastAPI(
    title="Inkloom AI — Evidence-Driven Brand Governance API",
    version=settings.VERSION,
    description=(
        "**Inkloom AI with BrandTrace Intelligence** is an enterprise-grade brand compliance "
        "and content governance platform. It provides automated claim verification against approved brand knowledge, "
        "evidence provenance tracking, maker-checker review workflows, Brand Time Machine version diffing, "
        "Brand Impact Map topological graph analysis, and isolated What-If scenario simulations.\n\n"
        "### Key API Highlights\n"
        "- **BrandTrace Lineage:** Every claim links to supporting evidence, policy rules, and verification status.\n"
        "- **Maker-Checker Security:** Creators cannot self-approve; un-audited or critical-violation copy is blocked.\n"
        "- **What-If Simulation:** Test hypothetical regulatory/evidence changes without touching production data.\n"
        "- **Audit Trail:** SHA-256 verifiable append-only ledger for all governance events.\n\n"
        "*Hackathon Round 2 Submission — Team CodeSync (Tejas Gowda M & Tanmayi K T)*"
    ),
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
# Allowed Origins Configuration
# Explicitly allow the deployed production frontend, Render services, and local dev environments
default_origins = [
    # Production GitHub Pages frontend
    "https://tanmayikt98-coder.github.io",
    # Production Render frontends & backends
    "https://inkloom-frontend.onrender.com",
    "https://inkloom-ai-brand-governance.onrender.com",
    "https://inkloom-ai-brand-governance-1.onrender.com",
    "https://inkloom-backend-y97e.onrender.com",
    # Local development environments
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

# Allow dynamic injection from environment variables (e.g. FRONTEND_URL or CORS_ORIGINS on Render)
if getattr(settings, "FRONTEND_URL", None):
    default_origins.append(settings.FRONTEND_URL)

env_frontend = os.getenv("FRONTEND_URL", "")
if env_frontend:
    default_origins.append(env_frontend)

extra_cors = os.getenv("CORS_ORIGINS", "")
if extra_cors:
    default_origins.extend(extra_cors.split(","))

# Deduplicate origins and strip whitespace and trailing slashes (Origin headers never have trailing slashes)
seen_origins = set()
clean_origins = []
for orig in default_origins:
    cleaned = orig.strip().rstrip("/")
    if cleaned and cleaned not in seen_origins:
        seen_origins.add(cleaned)
        clean_origins.append(cleaned)

# Regex to support GitHub Pages preview/user domains, Render preview/deploy domains, and local hosts
cors_regex = r"^https://.*\.github\.io$|^https://.*\.onrender\.com$|^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=clean_origins,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "X-Demo-Role",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "*",
    ],
    expose_headers=["*"],
    max_age=86400,
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(brands_router, prefix=settings.API_V1_PREFIX)
app.include_router(facts_router, prefix=settings.API_V1_PREFIX)
app.include_router(evidence_router, prefix=settings.API_V1_PREFIX)
app.include_router(rules_router, prefix=settings.API_V1_PREFIX)
app.include_router(assets_router, prefix=settings.API_V1_PREFIX)
app.include_router(audits_router, prefix=settings.API_V1_PREFIX)
app.include_router(reviews_router, prefix=settings.API_V1_PREFIX)
app.include_router(time_machine_router, prefix=settings.API_V1_PREFIX)
app.include_router(impact_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulator_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)

@app.api_route("/health", methods=["GET", "HEAD"], tags=["Health & System"], summary="System Health Check")
@app.api_route("/api/health", methods=["GET", "HEAD"], tags=["Health & System"], summary="System Health Check (API Prefix)")
def health_check():
    return {
        "status": "healthy",
        "system": "Inkloom AI — Evidence-Driven Brand Governance",
        "intelligence": "BrandTrace Intelligence",
        "demo_mode": settings.DEMO_MODE,
        "ai_provider": settings.AI_PROVIDER,
        "docs": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
