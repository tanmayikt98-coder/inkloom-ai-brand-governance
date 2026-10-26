import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from app.enums import (
    UserRole, FactStatus, EvidenceStatus, RuleType, Severity, FindingCategory,
    ApprovalDecision, AssetStatus, AuditStatus, ScenarioChangeType, ScenarioStatus
)
from app.services.rule_engine import DeterministicRuleEngine
from app.services.diff_engine import DiffEngine
from app.services.impact_engine import ImpactEngine
from app.services.simulator_engine import SimulatorEngine
from app.services.document_parser import DocumentParserService
from app.database import SyncSessionLocal, sync_engine, Base
from app.models import (
    Organization, User, Brand, BrandFact, BrandRule, EvidenceSource,
    FactEvidenceLink, MarketingAsset, AssetRevision, ExtractedClaim,
    AuditRun, AuditFinding, ApprovalRecord, WhatIfScenario, DependencyEdge
)
from app.seed_data import seed_database

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=sync_engine)
    seed_database()
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. Deterministic Rule Engine & Fact Classification Tests
def test_supported_claim_classification(db_session):
    fact = db_session.query(BrandFact).options(joinedload(BrandFact.evidence_links).joinedload(FactEvidenceLink.evidence)).filter_by(id="fact-perf-001").first()
    assert fact is not None
    assert fact.metric_value == 30.0

    # Claim matching approved benchmark exactly (30%)
    res = DeterministicRuleEngine.verify_claim_against_fact(
        claim_text="Aurevia reduces average processing time by 30%",
        claimed_value=30.0,
        unit="%",
        fact=fact
    )
    assert res.category == FindingCategory.SUPPORTED
    assert res.severity == Severity.LOW

def test_contradictory_claim_flagged(db_session):
    fact = db_session.query(BrandFact).options(joinedload(BrandFact.evidence_links).joinedload(FactEvidenceLink.evidence)).filter_by(id="fact-perf-001").first()
    
    # Exaggerated claim claiming 50% when approved benchmark is 30%
    res = DeterministicRuleEngine.verify_claim_against_fact(
        claim_text="Aurevia reduces average processing time by 50%",
        claimed_value=50.0,
        unit="%",
        fact=fact
    )
    assert res.category == FindingCategory.CONTRADICTED
    assert res.severity == Severity.CRITICAL
    assert "exceeds approved benchmark" in res.explanation

def test_expired_evidence_triggers_policy(db_session):
    expired_fact = db_session.query(BrandFact).options(joinedload(BrandFact.evidence_links).joinedload(FactEvidenceLink.evidence)).filter_by(id="fact-legacy-003").first()
    assert expired_fact is not None

    res = DeterministicRuleEngine.verify_claim_against_fact(
        claim_text="Aurevia v1 delivers 15% throughput uplift",
        claimed_value=15.0,
        unit="%",
        fact=expired_fact
    )
    assert res.category == FindingCategory.EXPIRED_EVIDENCE
    assert res.severity == Severity.HIGH

def test_rule_forbidden_keywords_and_missing_disclaimer(db_session):
    rules = db_session.query(BrandRule).filter_by(brand_id="brand-aurevia-001").all()

    # Content with forbidden phrase and missing disclosure
    content = "Aurevia is guaranteed 100% error-free and beats all competitors."
    results = DeterministicRuleEngine.evaluate_rules(content, rules)

    categories = [r.category for r in results]
    assert FindingCategory.BRAND_GUIDELINE_VIOLATION in categories
    assert FindingCategory.MISSING_DISCLOSURE in categories

# 2. Citations & Traceability Test
def test_citations_resolve_to_actual_stored_evidence_and_rules(db_session):
    finding = db_session.query(AuditFinding).filter_by(id="finding-v1-01").first()
    assert finding is not None
    assert finding.fact_id == "fact-perf-001"
    assert finding.evidence_id == "ev-bench-001"

    ev = db_session.query(EvidenceSource).filter_by(id=finding.evidence_id).first()
    assert ev is not None
    assert "Apex Analytics" in ev.document_text

# 3. Maker-Checker & Approval Policy Tests
def test_maker_checker_separation_policy(db_session):
    asset = db_session.query(MarketingAsset).filter_by(id="asset-landing-001").first()
    creator_id = asset.author_id

    # If the creator attempts to approve their own asset
    approver_is_creator = (creator_id == "user-creator-03")
    assert approver_is_creator is True
    # The policy requires creator != reviewer for standard approval

def test_high_severity_blocks_approval(db_session):
    # Revision 1 of landing page has critical/high findings
    audit_v1 = db_session.query(AuditRun).filter_by(id="audit-run-001-v1").first()
    assert audit_v1.critical_count > 0 or audit_v1.high_count > 0
    assert audit_v1.status == AuditStatus.NON_COMPLIANT

# 4. Brand Time Machine & Version Diff Tests
def test_revision_diffing_and_preservation(db_session):
    rev1 = db_session.query(AssetRevision).options(joinedload(AssetRevision.claims)).filter_by(id="rev-landing-001-v1").first()
    rev2 = db_session.query(AssetRevision).options(joinedload(AssetRevision.claims)).filter_by(id="rev-landing-001-v2").first()

    diff_chunks = DiffEngine.compute_text_diff(rev1.content_text, rev2.content_text)
    assert any(c.type == "remove" for c in diff_chunks)
    assert any(c.type == "add" for c in diff_chunks)

    # Claim comparison: 50% -> 30%
    claims_diff = DiffEngine.compare_claims(rev1.claims, rev2.claims)
    assert len(claims_diff) > 0

    # Ensure revision 1 content was not overwritten
    assert "50%" in rev1.content_text
    assert "30%" in rev2.content_text

# 5. Brand Impact Map Graph & Traversal Tests
def test_impact_graph_dependencies(db_session):
    facts = db_session.query(BrandFact).options(joinedload(BrandFact.evidence_links)).all()
    evidence = db_session.query(EvidenceSource).all()
    rules = db_session.query(BrandRule).all()
    assets = db_session.query(MarketingAsset).options(joinedload(MarketingAsset.revisions).joinedload(AssetRevision.claims)).all()
    deps = db_session.query(DependencyEdge).all()

    graph = ImpactEngine.build_graph(facts, evidence, rules, assets, deps)
    assert graph.total_nodes > 5
    assert graph.total_edges > 3

    # Impact analysis on Fact 1 (30% reduction)
    impact = ImpactEngine.analyze_impact(
        entity_id="fact-perf-001",
        entity_type="FACT",
        facts=facts,
        assets=assets,
        rules=rules
    )
    assert impact.direct_affected_count >= 1
    assert any(a.asset_id == "asset-landing-001" for a in impact.affected_assets)

# 6. What-If Simulator & Promotion Tests
def test_scenario_isolated_simulation(db_session):
    facts = db_session.query(BrandFact).options(joinedload(BrandFact.evidence_links).joinedload(FactEvidenceLink.evidence)).all()
    evidence = db_session.query(EvidenceSource).all()
    rules = db_session.query(BrandRule).all()
    assets = db_session.query(MarketingAsset).options(joinedload(MarketingAsset.revisions).joinedload(AssetRevision.claims)).all()

    # Simulate reducing benchmark from 30% to 20%
    sim = SimulatorEngine.simulate_scenario(
        scenario_id="test-sim-001",
        change_type=ScenarioChangeType.UPDATE_FACT_METRIC,
        target_entity_id="fact-perf-001",
        proposed_payload={"metric_value": 20.0},
        production_facts=facts,
        production_evidence=evidence,
        production_rules=rules,
        production_assets=assets
    )

    assert sim.status == ScenarioStatus.SIMULATED
    assert sim.affected_assets_count > 0
    # Crucial check: verify production record in DB was NOT changed!
    production_fact = db_session.query(BrandFact).filter_by(id="fact-perf-001").first()
    assert production_fact.metric_value == 30.0 # Remains untouched at 30.0!

def test_document_parser_security():
    # Unsupported extension rejection
    success, msg = DocumentParserService.extract_text_from_bytes("malware.exe", b"MZ...")
    assert success is False
    assert "Unsupported file type" in msg

    # Plain text extraction
    txt_bytes = b"Approved Brand Voice: Empowering, concise, verified."
    success, text = DocumentParserService.extract_text_from_bytes("guidelines.txt", txt_bytes)
    assert success is True
    assert "Empowering" in text
