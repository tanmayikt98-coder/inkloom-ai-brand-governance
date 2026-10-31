import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SyncSessionLocal, sync_engine, Base
from app.models import (
    Organization, User, Brand, BrandFact, BrandRule, EvidenceSource,
    FactEvidenceLink, MarketingAsset, AssetRevision, ExtractedClaim,
    AuditRun, AuditFinding, ApprovalRecord, DependencyEdge, WhatIfScenario,
    ScenarioResult, AuditEvent
)
from app.enums import (
    UserRole, FactStatus, EvidenceStatus, EvidenceType, RuleType, Severity,
    AssetType, AssetStatus, FindingCategory, AuditStatus, ApprovalDecision,
    ScenarioChangeType, ScenarioStatus, EntityType
)
from app.security import hash_password

def seed_database(db: Session = None, force: bool = False):
    # Ensure tables exist
    if force:
        Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)
    
    close_at_end = False
    if db is None:
        db = SyncSessionLocal()
        close_at_end = True

    try:
        # Check if already seeded unless forced
        if not force:
            existing_org = db.query(Organization).filter_by(slug="aurevia-corp").first()
            existing_novubio = db.query(Organization).filter_by(slug="novubio-pharma").first()
            if existing_org and existing_novubio:
                print("[Inkloom AI] Database already fully seeded with multi-tenant workspaces.")
                return

        print("[Inkloom AI] Seeding database with Aurevia brand knowledge, demo users, and assets...")

        # 1. Organization
        org = Organization(
            id="org-aurevia-001",
            name="Aurevia Technologies Inc.",
            slug="aurevia-corp"
        )
        db.add(org)
        db.flush()

        # 2. Demo Users for all 8 human roles
        default_pwd = hash_password("DemoPass123!")
        users = [
            User(id="user-admin-01", organization_id=org.id, email="admin@inkloom.ai", full_name="Elena Vance (Admin)", hashed_password=default_pwd, role=UserRole.ORGANIZATION_ADMIN),
            User(id="user-brand-02", organization_id=org.id, email="brand.manager@inkloom.ai", full_name="Marcus Sterling (Brand Mgr)", hashed_password=default_pwd, role=UserRole.BRAND_MANAGER),
            User(id="user-creator-03", organization_id=org.id, email="creator@inkloom.ai", full_name="Sarah Chen (Content Creator)", hashed_password=default_pwd, role=UserRole.CONTENT_CREATOR),
            User(id="user-compliance-04", organization_id=org.id, email="compliance@inkloom.ai", full_name="David Thorne (Compliance)", hashed_password=default_pwd, role=UserRole.COMPLIANCE_ANALYST),
            User(id="user-reviewer-05", organization_id=org.id, email="reviewer@inkloom.ai", full_name="Victoria Brooks (Approver)", hashed_password=default_pwd, role=UserRole.REVIEWER_APPROVER),
            User(id="user-viewer-06", organization_id=org.id, email="viewer@inkloom.ai", full_name="Robert Lang (Exec Viewer)", hashed_password=default_pwd, role=UserRole.READ_ONLY_VIEWER),
            User(id="user-custodian-07", organization_id=org.id, email="custodian@inkloom.ai", full_name="Amina Patel (Evidence Custodian)", hashed_password=default_pwd, role=UserRole.EVIDENCE_CUSTODIAN),
            User(id="user-campaign-08", organization_id=org.id, email="campaign@inkloom.ai", full_name="Liam Gallagher (Campaign Mgr)", hashed_password=default_pwd, role=UserRole.CAMPAIGN_MANAGER),
        ]
        db.add_all(users)
        db.flush()

        # 3. Brand
        brand = Brand(
            id="brand-aurevia-001",
            organization_id=org.id,
            name="Aurevia",
            tagline="Enterprise Intelligence with Deterministic Trust",
            description="Next-generation automated workflow and enterprise governance engine."
        )
        db.add(brand)
        db.flush()

        # 4. Evidence Sources
        now = datetime.utcnow()
        ev_benchmark = EvidenceSource(
            id="ev-bench-001",
            brand_id=brand.id,
            title="Aurevia Core Engine Benchmark Report 2026-Q1",
            source_type=EvidenceType.BENCHMARK_REPORT,
            url="https://evidence.aurevia.internal/benchmarks/2026-q1-core.pdf",
            document_text="EXECUTIVE BENCHMARK SUMMARY\nConducted by Apex Analytics Lab.\nTest run: 50,000 asynchronous workflow pipelines under 8x load concurrency.\nKey Finding: Aurevia reduces average processing time by 30.0% compared to industry baseline.\nConfidence interval: 99.4%. Standard deviation: 1.2%.\nValidity window: Active through December 31, 2026.",
            publication_date=now - timedelta(days=60),
            expiration_date=now + timedelta(days=305),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="Dr. Aris Thorne (Chief Scientist)",
            verification_notes="Verified via double-blind benchmark methodology. Audited by Apex Analytics."
        )
        ev_sla = EvidenceSource(
            id="ev-sla-002",
            brand_id=brand.id,
            title="Aurevia Global Cloud SLA Audit Q1 2026",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://evidence.aurevia.internal/audits/sla-2026.pdf",
            document_text="AUDIT CERTIFICATE\nIndependent auditor Datacenter Guard verifies that Aurevia platform maintained 99.99% system availability SLA across multi-region deployments in trailing 12 months.",
            publication_date=now - timedelta(days=90),
            expiration_date=now + timedelta(days=275),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="DevOps Compliance Office",
            verification_notes="Signed off by Datacenter Guard audit firm."
        )
        ev_expired = EvidenceSource(
            id="ev-legacy-003",
            brand_id=brand.id,
            title="Aurevia v1 Prototype Throughput Assessment (Deprecated)",
            source_type=EvidenceType.BENCHMARK_REPORT,
            url="https://evidence.aurevia.internal/legacy/v1-throughput.pdf",
            document_text="Legacy v1 test: Demonstrated 15% throughput uplift on single-threaded execution. Superceded by v2 multi-core engine.",
            publication_date=now - timedelta(days=400),
            expiration_date=now - timedelta(days=35), # Expired!
            verification_status=EvidenceStatus.EXPIRED,
            responsible_owner="Legacy Team",
            verification_notes="Expired on 2026-01-31. Do not use for new marketing copy."
        )
        db.add_all([ev_benchmark, ev_sla, ev_expired])
        db.flush()

        # 5. Brand Facts
        fact_perf = BrandFact(
            id="fact-perf-001",
            brand_id=brand.id,
            claim_statement="Aurevia reduces average processing time by 30%.",
            category="performance",
            status=FactStatus.APPROVED,
            metric_value=30.0,
            metric_unit="%",
            validity_start=now - timedelta(days=60),
            validity_end=now + timedelta(days=305),
            version=1,
            responsible_owner="Marcus Sterling",
            notes="Benchmark verified. Citable in enterprise collateral with mandatory performance disclaimer."
        )
        fact_sla = BrandFact(
            id="fact-sla-002",
            brand_id=brand.id,
            claim_statement="Aurevia maintains 99.99% system availability SLA.",
            category="reliability",
            status=FactStatus.APPROVED,
            metric_value=99.99,
            metric_unit="%",
            validity_start=now - timedelta(days=90),
            validity_end=now + timedelta(days=275),
            version=1,
            responsible_owner="Marcus Sterling",
            notes="Requires enterprise tier reference."
        )
        fact_legacy = BrandFact(
            id="fact-legacy-003",
            brand_id=brand.id,
            claim_statement="Aurevia v1 delivers 15% throughput uplift.",
            category="performance",
            status=FactStatus.EXPIRED,
            metric_value=15.0,
            metric_unit="%",
            validity_start=now - timedelta(days=400),
            validity_end=now - timedelta(days=35),
            version=1,
            responsible_owner="Legacy Team",
            notes="Expired evidence. Replaced by 30% core engine benchmark."
        )
        db.add_all([fact_perf, fact_sla, fact_legacy])
        db.flush()

        # 6. Fact-Evidence Links
        db.add_all([
            FactEvidenceLink(id="link-001", fact_id=fact_perf.id, evidence_id=ev_benchmark.id, exact_passage="Aurevia reduces average processing time by 30.0% compared to industry baseline.", confidence=1.0),
            FactEvidenceLink(id="link-002", fact_id=fact_sla.id, evidence_id=ev_sla.id, exact_passage="maintained 99.99% system availability SLA across multi-region deployments", confidence=1.0),
            FactEvidenceLink(id="link-003", fact_id=fact_legacy.id, evidence_id=ev_expired.id, exact_passage="Demonstrated 15% throughput uplift on single-threaded execution.", confidence=1.0)
        ])
        db.flush()

        # 7. Brand Rules
        rule_disclaimer = BrandRule(
            id="rule-disclaim-001",
            brand_id=brand.id,
            rule_code="RULE-DISCLAIM-01",
            name="Mandatory Performance Disclaimer",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern="Results may vary based on workload parameters and enterprise tier configuration.",
            failure_message="All customer-facing materials citing performance or latency metrics must include the approved disclosure notice.",
            severity=Severity.HIGH,
            is_active=True
        )
        rule_forbidden = BrandRule(
            id="rule-forbidden-002",
            brand_id=brand.id,
            rule_code="RULE-FORBIDDEN-01",
            name="Prohibited Absolute Guarantees",
            rule_type=RuleType.FORBIDDEN_KEYWORD,
            check_pattern="guaranteed 100% error-free, zero risk, unbeatable, absolute certainty, 100% risk-free",
            failure_message="Absolute claims and unverified risk-free guarantees are deceptive under FTC and consumer protection regulations.",
            severity=Severity.CRITICAL,
            is_active=True
        )
        rule_tone = BrandRule(
            id="rule-tone-003",
            brand_id=brand.id,
            rule_code="RULE-TONE-01",
            name="Tone of Voice Superlatives",
            rule_type=RuleType.FORBIDDEN_KEYWORD,
            check_pattern="world's best, unmatched anywhere, undisputed #1",
            failure_message="Superlatives must be verified by third-party analyst awards before publication.",
            severity=Severity.MEDIUM,
            is_active=True
        )
        db.add_all([rule_disclaimer, rule_forbidden, rule_tone])
        db.flush()

        # 8. Marketing Assets
        # Asset 1: Hero Asset (Initially has Revision 1: Non-compliant, and Revision 2: Corrected)
        asset_hero = MarketingAsset(
            id="asset-landing-001",
            organization_id=org.id,
            brand_id=brand.id,
            title="Aurevia Enterprise Launch Landing Page",
            asset_type=AssetType.LANDING_PAGE,
            campaign_name="Global Launch 2026",
            status=AssetStatus.IN_REVIEW,
            author_id="user-creator-03" # Sarah Chen
        )
        db.add(asset_hero)
        db.flush()

        rev1 = AssetRevision(
            id="rev-landing-001-v1",
            asset_id=asset_hero.id,
            revision_number=1,
            content_text="Welcome to Aurevia. Aurevia reduces average processing time by 50% across all enterprise workflows. It is guaranteed 100% error-free and delivers unbeatable performance for global enterprises.",
            change_summary="Initial marketing draft prepared for enterprise launch.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=2)
        )
        db.add(rev1)
        db.flush()

        # Claims for Rev 1
        claim1_v1 = ExtractedClaim(
            id="claim-hero-v1-01",
            revision_id=rev1.id,
            claim_text="Aurevia reduces average processing time by 50%",
            claim_type="NUMERIC_METRIC",
            extracted_value=50.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        claim1_v1_super = ExtractedClaim(
            id="claim-hero-v1-02",
            revision_id=rev1.id,
            claim_text="guaranteed 100% error-free and delivers unbeatable performance",
            claim_type="SUPERLATIVE_OR_GUARANTEE",
            extracted_value=None,
            unit=None
        )
        db.add_all([claim1_v1, claim1_v1_super])
        db.flush()

        # Audit Run for Rev 1 (Non-compliant)
        audit1 = AuditRun(
            id="audit-run-001-v1",
            revision_id=rev1.id,
            run_by_user_id="user-creator-03",
            status=AuditStatus.NON_COMPLIANT,
            total_claims=2,
            total_findings=3,
            critical_count=2,
            high_count=1,
            medium_count=0,
            low_count=0,
            execution_ms=18.4,
            created_at=now - timedelta(days=2)
        )
        db.add(audit1)
        db.flush()

        f1 = AuditFinding(
            id="finding-v1-01",
            audit_run_id=audit1.id,
            claim_id=claim1_v1.id,
            fact_id=fact_perf.id,
            evidence_id=ev_benchmark.id,
            category=FindingCategory.CONTRADICTED,
            severity=Severity.CRITICAL,
            explanation="Claimed performance of 50.0% exceeds approved benchmark of 30.0%. Contradicts official evidence in 'Aurevia Core Engine Benchmark Report 2026-Q1'.",
            suggested_correction="Correct figure to approved benchmark: 30.0% as documented in benchmark report.",
            exact_citation_text="Aurevia Core Engine Benchmark Report 2026-Q1 (Sec 3.2)"
        )
        f2 = AuditFinding(
            id="finding-v1-02",
            audit_run_id=audit1.id,
            rule_id=rule_forbidden.id,
            category=FindingCategory.BRAND_GUIDELINE_VIOLATION,
            severity=Severity.CRITICAL,
            explanation="Prohibited phrasing detected: 'guaranteed 100% error-free', 'unbeatable'. Absolute claims are deceptive under consumer protection regulations.",
            suggested_correction="Remove prohibited terms and replace with defensible, substantiated phrasing.",
            exact_citation_text="Rule: RULE-FORBIDDEN-01 (Prohibited Absolute Guarantees)"
        )
        f3 = AuditFinding(
            id="finding-v1-03",
            audit_run_id=audit1.id,
            rule_id=rule_disclaimer.id,
            category=FindingCategory.MISSING_DISCLOSURE,
            severity=Severity.HIGH,
            explanation="Required mandatory disclaimer is missing: 'Results may vary based on workload parameters and enterprise tier configuration.'",
            suggested_correction="Include the required disclosure statement in the footer or footnote.",
            exact_citation_text="Mandatory Brand Rule: RULE-DISCLAIM-01"
        )
        db.add_all([f1, f2, f3])
        db.flush()

        # Revision 2: The Corrected Revision (Ready for Maker-Checker review!)
        rev2 = AssetRevision(
            id="rev-landing-001-v2",
            asset_id=asset_hero.id,
            revision_number=2,
            content_text="Welcome to Aurevia. Aurevia reduces average processing time by 30% across verified benchmark workloads. Delivering robust enterprise reliability for global organizations. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Aligned performance metric with approved 30% benchmark, eliminated forbidden guarantees, and inserted required performance disclosure.",
            author_id="user-creator-03",
            created_at=now - timedelta(hours=3)
        )
        db.add(rev2)
        db.flush()

        # Claims for Rev 2
        claim2_v2 = ExtractedClaim(
            id="claim-hero-v2-01",
            revision_id=rev2.id,
            claim_text="Aurevia reduces average processing time by 30%",
            claim_type="NUMERIC_METRIC",
            extracted_value=30.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        db.add(claim2_v2)
        db.flush()

        # Audit Run for Rev 2 (COMPLIANT)
        audit2 = AuditRun(
            id="audit-run-001-v2",
            revision_id=rev2.id,
            run_by_user_id="user-creator-03",
            status=AuditStatus.COMPLIANT,
            total_claims=1,
            total_findings=1, # 1 Low severity (supported)
            critical_count=0,
            high_count=0,
            medium_count=0,
            low_count=1,
            execution_ms=12.1,
            created_at=now - timedelta(hours=3)
        )
        db.add(audit2)
        db.flush()

        f2_1 = AuditFinding(
            id="finding-v2-01",
            audit_run_id=audit2.id,
            claim_id=claim2_v2.id,
            fact_id=fact_perf.id,
            evidence_id=ev_benchmark.id,
            category=FindingCategory.SUPPORTED,
            severity=Severity.LOW,
            explanation="Claim strictly substantiated by approved benchmark of 30.0% in 'Aurevia Core Engine Benchmark Report 2026-Q1'.",
            suggested_correction=None,
            exact_citation_text="Aurevia Core Engine Benchmark Report 2026-Q1 (Verified)"
        )
        db.add(f2_1)
        db.flush()

        # Update hero asset's current revision to rev2
        asset_hero.current_revision_id = rev2.id
        db.flush()

        # Asset 2: Social Media Post (Approved, linked to Fact 1)
        asset_social = MarketingAsset(
            id="asset-social-002",
            organization_id=org.id,
            brand_id=brand.id,
            title="Global X/LinkedIn Launch Snippet",
            asset_type=AssetType.SOCIAL_POST,
            campaign_name="Global Launch 2026",
            status=AssetStatus.APPROVED,
            author_id="user-creator-03",
            created_at=now - timedelta(days=5)
        )
        db.add(asset_social)
        db.flush()

        rev_soc = AssetRevision(
            id="rev-soc-001",
            asset_id=asset_social.id,
            revision_number=1,
            content_text="Speed up your operations! Aurevia reduces average processing time by 30% for high-throughput enterprise teams. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Approved social launch post.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=5)
        )
        db.add(rev_soc)
        db.flush()

        asset_social.current_revision_id = rev_soc.id

        claim_soc = ExtractedClaim(
            id="claim-soc-01",
            revision_id=rev_soc.id,
            claim_text="Aurevia reduces average processing time by 30%",
            claim_type="NUMERIC_METRIC",
            extracted_value=30.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        db.add(claim_soc)
        db.flush()

        # Approval record for social post
        appr_soc = ApprovalRecord(
            id="appr-soc-001",
            asset_id=asset_social.id,
            revision_id=rev_soc.id,
            reviewer_id="user-reviewer-05", # Victoria Brooks (Checker != Maker)
            decision=ApprovalDecision.APPROVED,
            decision_reason="All claims match verified 2026 Q1 benchmark report. Mandatory disclaimer present.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=4)
        )
        db.add(appr_soc)
        db.flush()

        # Asset 3: Email Campaign (Approved, linked to Fact 1)
        asset_email = MarketingAsset(
            id="asset-email-003",
            organization_id=org.id,
            brand_id=brand.id,
            title="Q2 Executive Briefing Email Campaign",
            asset_type=AssetType.EMAIL_CAMPAIGN,
            campaign_name="Q2 Nurture",
            status=AssetStatus.APPROVED,
            author_id="user-creator-03",
            created_at=now - timedelta(days=7)
        )
        db.add(asset_email)
        db.flush()

        rev_email = AssetRevision(
            id="rev-email-001",
            asset_id=asset_email.id,
            revision_number=1,
            content_text="Executive Briefing: Modernize data processing with Aurevia. Aurevia reduces average processing time by 30% while maintaining 99.99% system availability SLA. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Approved executive briefing email.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=7)
        )
        db.add(rev_email)
        db.flush()
        asset_email.current_revision_id = rev_email.id

        claim_email1 = ExtractedClaim(
            id="claim-em-01",
            revision_id=rev_email.id,
            claim_text="Aurevia reduces average processing time by 30%",
            claim_type="NUMERIC_METRIC",
            extracted_value=30.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        claim_email2 = ExtractedClaim(
            id="claim-em-02",
            revision_id=rev_email.id,
            claim_text="maintaining 99.99% system availability SLA",
            claim_type="NUMERIC_METRIC",
            extracted_value=99.99,
            unit="%",
            matched_fact_id=fact_sla.id
        )
        db.add_all([claim_email1, claim_email2])
        db.flush()

        appr_email = ApprovalRecord(
            id="appr-email-001",
            asset_id=asset_email.id,
            revision_id=rev_email.id,
            reviewer_id="user-reviewer-05",
            decision=ApprovalDecision.APPROVED,
            decision_reason="Verified against Q1 Benchmark and SLA audit.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=6)
        )
        db.add(appr_email)
        db.flush()

        # 9. Dependency Edges (Traceable Knowledge Graph)
        deps = [
            DependencyEdge(id="dep-01", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_benchmark.id, target_type=EntityType.FACT, target_id=fact_perf.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-02", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_sla.id, target_type=EntityType.FACT, target_id=fact_sla.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-03", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_perf.id, target_type=EntityType.ASSET, target_id=asset_hero.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-04", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_perf.id, target_type=EntityType.ASSET, target_id=asset_social.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-05", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_perf.id, target_type=EntityType.ASSET, target_id=asset_email.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-06", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_disclaimer.id, target_type=EntityType.ASSET, target_id=asset_hero.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-07", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_forbidden.id, target_type=EntityType.ASSET, target_id=asset_hero.id, relation_type="GOVERNS", is_confirmed=True),
        ]
        db.add_all(deps)
        db.flush()

        # 10. Pre-seeded What-If Scenario
        scenario = WhatIfScenario(
            id="scenario-sample-001",
            brand_id=brand.id,
            created_by_user_id="user-brand-02",
            title="Q3 Benchmark Downgrade (30% to 20%)",
            description="Simulate regulatory risk and collateral impact if conservative re-benchmarking reduces official performance uplift from 30% to 20%.",
            change_type=ScenarioChangeType.UPDATE_FACT_METRIC,
            target_entity_id=fact_perf.id,
            proposed_payload_json={"metric_value": 20.0, "unit": "%"},
            status=ScenarioStatus.SIMULATED
        )
        db.add(scenario)
        db.flush()

        scen_result = ScenarioResult(
            id="scen-res-001",
            scenario_id=scenario.id,
            baseline_non_compliant_count=0,
            projected_non_compliant_count=3,
            affected_assets_count=3,
            projected_findings_json=[
                {"asset_id": asset_hero.id, "title": asset_hero.title, "finding": "Claims 30% but proposed benchmark drops to 20% (Contradicted)"},
                {"asset_id": asset_social.id, "title": asset_social.title, "finding": "Claims 30% in published tweet (Contradicted)"},
                {"asset_id": asset_email.id, "title": asset_email.title, "finding": "Claims 30% in executive briefing (Contradicted)"}
            ],
            summary_narrative="Simulating a reduction to 20% creates 3 direct collateral violations across Landing Page, Social, and Email assets."
        )
        db.add(scen_result)
        db.flush()

        # 11. Audit Events (WORM append-only log)
        events = [
            AuditEvent(id="evt-001", organization_id=org.id, actor_id="user-brand-02", event_type="FACT_CREATED", entity_type="BrandFact", entity_id=fact_perf.id, description="Brand Manager created approved Fact: 'Aurevia reduces average processing time by 30%'"),
            AuditEvent(id="evt-002", organization_id=org.id, actor_id="user-custodian-07", event_type="EVIDENCE_VERIFIED", entity_type="EvidenceSource", entity_id=ev_benchmark.id, description="Evidence Custodian verified 'Aurevia Core Engine Benchmark Report 2026-Q1'"),
            AuditEvent(id="evt-003", organization_id=org.id, actor_id="user-creator-03", event_type="ASSET_REVISION_CREATED", entity_type="MarketingAsset", entity_id=asset_hero.id, description="Content Creator submitted Revision 1 with non-compliant claims"),
            AuditEvent(id="evt-004", organization_id=org.id, actor_id="user-creator-03", event_type="AUDIT_RUN_EXECUTED", entity_type="AuditRun", entity_id=audit1.id, description="Audit engine flagged 2 Critical and 1 High severity finding on Rev 1"),
            AuditEvent(id="evt-005", organization_id=org.id, actor_id="user-creator-03", event_type="ASSET_REVISION_CREATED", entity_type="MarketingAsset", entity_id=asset_hero.id, description="Content Creator corrected claims and submitted Revision 2"),
            AuditEvent(id="evt-006", organization_id=org.id, actor_id="user-creator-03", event_type="AUDIT_RUN_EXECUTED", entity_type="AuditRun", entity_id=audit2.id, description="Audit engine confirmed Revision 2 COMPLIANT with approved benchmark"),
        ]
        db.add_all(events)
        db.flush()

        # 12. Seed Tenant 2: NovuBio Pharmaceuticals (FDA regulated)
        org2 = Organization(
            id="org-novubio-002",
            name="NovuBio Pharmaceuticals",
            slug="novubio-pharma"
        )
        db.add(org2)
        db.flush()

        user_novubio = User(
            id="user-novubio-admin",
            organization_id=org2.id,
            email="compliance@novubio.internal",
            full_name="Dr. Evelyn Vance (Chief Regulatory Officer)",
            hashed_password=default_pwd,
            role=UserRole.ORGANIZATION_ADMIN
        )
        db.add(user_novubio)
        db.flush()

        brand2 = Brand(
            id="brand-novubio-001",
            organization_id=org2.id,
            name="NovuBio Oncology",
            tagline="Precision Immuno-Therapeutics",
            description="Clinical-stage biopharmaceutical brand operating under FDA 21 CFR Part 202 regulations."
        )
        db.add(brand2)
        db.flush()

        ev_novubio = EvidenceSource(
            id="ev-novubio-001",
            brand_id=brand2.id,
            title="Phase III Clinical Efficacy Trial NB-420 Final Report (FDA Investigational Study)",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://fda.gov/cder/ndas/2026/nb420-phase3.pdf",
            document_text="CLINICAL STUDY FINDINGS: Multi-center double-blind randomized clinical trial of Compound NB-420 demonstrated 42.5% progression-free survival uplift compared to baseline standard of care (p < 0.001) across 1,200 enrolled patients. Approved for adult solid tumor oncology indications only.",
            publication_date=now - timedelta(days=45),
            expiration_date=now + timedelta(days=365),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="Medical Affairs Clinical Directorate",
            verification_notes="Certified under FDA 21 CFR Part 202 truth in prescription advertising."
        )
        db.add(ev_novubio)
        db.flush()

        fact_novubio = BrandFact(
            id="fact-novubio-001",
            brand_id=brand2.id,
            claim_statement="NB-420 delivers 42.5% progression-free survival rate improvement over control group.",
            category="clinical_efficacy",
            status=FactStatus.APPROVED,
            metric_value=42.5,
            metric_unit="%",
            validity_start=now - timedelta(days=45),
            validity_end=now + timedelta(days=365),
            responsible_owner="Medical Affairs",
            notes="Requires mandatory FDA indication and contraindication disclosures on all physician collateral."
        )
        db.add(fact_novubio)
        db.flush()

        rule_novubio = BrandRule(
            id="rule-fda-001",
            brand_id=brand2.id,
            rule_code="RULE-FDA-INDICATION",
            name="Mandatory FDA Black-Box Risk & Indication Statement",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern="Indicated for adults with refractory solid tumors. See full prescribing information for adverse reactions.",
            failure_message="All clinical promotional assets must include the full FDA-approved indication and adverse reaction warnings.",
            severity=Severity.CRITICAL,
            is_active=True
        )
        db.add(rule_novubio)
        db.flush()

        asset_novubio = MarketingAsset(
            id="asset-novubio-001",
            organization_id=org2.id,
            brand_id=brand2.id,
            title="NB-420 Healthcare Provider Clinical Monograph",
            asset_type=AssetType.PRODUCT_DESCRIPTION,
            campaign_name="HCP Clinical Launch 2026",
            status=AssetStatus.APPROVED,
            author_id=user_novubio.id
        )
        db.add(asset_novubio)
        db.flush()

        # 13. Seed Tenant 3: FinEdge Capital Group (SEC regulated)
        org3 = Organization(
            id="org-finedge-003",
            name="FinEdge Capital Group",
            slug="finedge-capital"
        )
        db.add(org3)
        db.flush()

        user_finedge = User(
            id="user-finedge-admin",
            organization_id=org3.id,
            email="legal@finedge.internal",
            full_name="Alexander Hayes (Chief Compliance Officer)",
            hashed_password=default_pwd,
            role=UserRole.ORGANIZATION_ADMIN
        )
        db.add(user_finedge)
        db.flush()

        brand3 = Brand(
            id="brand-finedge-001",
            organization_id=org3.id,
            name="FinEdge Prime",
            tagline="Algorithmic Wealth Intelligence & Custodial Clearing",
            description="Institutional digital asset custodian and clearinghouse operating under SEC Regulation S-K."
        )
        db.add(brand3)
        db.flush()

        ev_finedge = EvidenceSource(
            id="ev-finedge-001",
            brand_id=brand3.id,
            title="FinEdge Q4 SEC Regulation S-K Liquidity & Asset Custody Audit",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://sec.gov/edgar/data/finedge-q4-2025.pdf",
            document_text="SEC REGULATION S-K DISCLOSURE: FinEdge maintains 100% 1:1 segregated cold-storage reserve ratio for all custodial institutional balances. Verified by independent audit firm Deloitte & Touche LLP as of December 31, 2025.",
            publication_date=now - timedelta(days=70),
            expiration_date=now + timedelta(days=295),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="Institutional Custody Audit Desk",
            verification_notes="Signed audit opinion by Deloitte & Touche LLP."
        )
        db.add(ev_finedge)
        db.flush()

        fact_finedge = BrandFact(
            id="fact-finedge-001",
            brand_id=brand3.id,
            claim_statement="FinEdge maintains 100% 1:1 segregated reserve backing for all institutional custody accounts.",
            category="custodial_solvency",
            status=FactStatus.APPROVED,
            metric_value=100.0,
            metric_unit="%",
            validity_start=now - timedelta(days=70),
            validity_end=now + timedelta(days=295),
            responsible_owner="Compliance Desk",
            notes="Deloitte audited reserve report on record."
        )
        db.add(fact_finedge)
        db.flush()

        rule_finedge = BrandRule(
            id="rule-sec-001",
            brand_id=brand3.id,
            rule_code="RULE-SEC-RISK-NOTICE",
            name="Mandatory SEC Securities & Investment Risk Disclosure",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern="Past performance does not guarantee future results. Digital assets are subject to market volatility.",
            failure_message="All marketing and client collateral must display SEC risk disclosure.",
            severity=Severity.CRITICAL,
            is_active=True
        )
        db.add(rule_finedge)
        db.flush()

        asset_finedge = MarketingAsset(
            id="asset-finedge-001",
            organization_id=org3.id,
            brand_id=brand3.id,
            title="FinEdge Institutional Custody Overview Whitepaper",
            asset_type=AssetType.CAMPAIGN_BRIEF,
            campaign_name="Institutional Asset Protection 2026",
            status=AssetStatus.APPROVED,
            author_id=user_finedge.id
        )
        db.add(asset_finedge)
        db.flush()

        db.commit()
        print("[Inkloom AI] Multi-tenant demonstration workspaces seeded successfully (Aurevia, NovuBio, FinEdge).")

    except Exception as e:
        db.rollback()
        print(f"[Inkloom AI] Seed error: {e}")
        raise e
    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_database()
