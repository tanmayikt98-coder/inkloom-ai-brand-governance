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
            facts_count = db.query(BrandFact).count()
            if existing_org and existing_novubio and facts_count >= 10:
                print("[Inkloom AI] Database already fully seeded with 12 facts and multi-tenant workspaces.")
                return

        print("[Inkloom AI] Seeding comprehensive enterprise dataset for Aurevia (12 facts, 8 evidence, 6 rules, 9 assets, 3 scenarios)...")
        if force:
            pass
        else:
            # Wipe existing Aurevia records cleanly to prevent duplicates
            db.query(AuditEvent).delete()
            db.query(ScenarioResult).delete()
            db.query(WhatIfScenario).delete()
            db.query(DependencyEdge).delete()
            db.query(ApprovalRecord).delete()
            db.query(AuditFinding).delete()
            db.query(AuditRun).delete()
            db.query(ExtractedClaim).delete()
            db.query(AssetRevision).delete()
            db.query(MarketingAsset).delete()
            db.query(BrandRule).delete()
            db.query(FactEvidenceLink).delete()
            db.query(BrandFact).delete()
            db.query(EvidenceSource).delete()
            db.query(Brand).delete()
            db.query(User).delete()
            db.query(Organization).delete()
            db.flush()

        # 1. Organization: Aurevia Technologies Inc.
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
            description="Next-generation automated workflow and enterprise governance engine operating under FTC 16 CFR Part 255 standards."
        )
        db.add(brand)
        db.flush()

        now = datetime.utcnow()

        # 4. Evidence Sources (8 Evidence Documents)
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
            verification_notes="Verified via double-blind benchmark methodology. Audited by Apex Analytics. Tier 1 Authority."
        )
        ev_sla = EvidenceSource(
            id="ev-sla-002",
            brand_id=brand.id,
            title="Aurevia Global Cloud SLA Audit Q1 2026",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://evidence.aurevia.internal/audits/sla-2026.pdf",
            document_text="AUDIT CERTIFICATE\nIndependent auditor Datacenter Guard verifies that Aurevia platform maintained 99.99% system availability SLA across multi-region deployments in trailing 12 months with zero unhandled catastrophic outages.",
            publication_date=now - timedelta(days=90),
            expiration_date=now + timedelta(days=275),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="DevOps Compliance Office",
            verification_notes="Signed off by Datacenter Guard audit firm. Tier 1 Authority."
        )
        ev_soc2 = EvidenceSource(
            id="ev-soc2-003",
            brand_id=brand.id,
            title="SOC 2 Type II & ISO 27001 Security Attestation 2026",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://evidence.aurevia.internal/security/soc2-type2-2026.pdf",
            document_text="SECURITY ATTESTATION REPORT\nIssued by Ernst & Cyber LLP.\nAurevia Enterprise Platform satisfies Trust Services Criteria for Security, Availability, and Confidentiality. ISO 27001:2022 certified with zero non-conformities.",
            publication_date=now - timedelta(days=75),
            expiration_date=now + timedelta(days=290),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="Chief Information Security Officer",
            verification_notes="Annual attestation valid through Q1 2027."
        )
        ev_telemetry = EvidenceSource(
            id="ev-telemetry-004",
            brand_id=brand.id,
            title="Multi-Region Distributed Concurrency & Latency Whitepaper",
            source_type=EvidenceType.BENCHMARK_REPORT,
            url="https://evidence.aurevia.internal/whitepapers/latency-2026.pdf",
            document_text="SYSTEM PERFORMANCE DISCLOSURE\nTelemetry partition 42: Aurevia achieves sub-15ms p99 query latency across 10 million telemetry events and supports 50,000 concurrent deterministic workflow transactions without queue degradation.",
            publication_date=now - timedelta(days=40),
            expiration_date=now + timedelta(days=325),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="Cloud Performance Engineering",
            verification_notes="Verified by Distributed Systems Laboratory."
        )
        ev_tco = EvidenceSource(
            id="ev-tco-005",
            brand_id=brand.id,
            title="Enterprise TCO & Infrastructure Cloud Efficiency Study 2026",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://evidence.aurevia.internal/studies/tco-efficiency-2026.pdf",
            document_text="ECONOMIC IMPACT ANALYSIS\nConducted across 28 global enterprise deployments. Aurevia lowers operational cloud spend by 22% via smart autoscaling and resource reclamation algorithms.",
            publication_date=now - timedelta(days=50),
            expiration_date=now + timedelta(days=315),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="Financial Operations Desk",
            verification_notes="Peer-reviewed customer case analytics."
        )
        ev_esg = EvidenceSource(
            id="ev-esg-006",
            brand_id=brand.id,
            title="Clean Energy Compute Verification & Carbon Neutrality Certificate",
            source_type=EvidenceType.AUDIT_DOCUMENT,
            url="https://evidence.aurevia.internal/sustainability/carbon-cert-2026.pdf",
            document_text="ENVIRONMENTAL SUSTAINABILITY DISCLOSURE\nGreenTech Labs certifies that Aurevia compute clusters run on 100% renewable electricity with net-zero carbon intensity (Scope 1 and Scope 2 compliant).",
            publication_date=now - timedelta(days=80),
            expiration_date=now + timedelta(days=285),
            verification_status=EvidenceStatus.VERIFIED,
            responsible_owner="ESG Steering Committee",
            verification_notes="Audited according to GHG Protocol standards."
        )
        ev_legacy = EvidenceSource(
            id="ev-legacy-007",
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
        ev_beta_conflicting = EvidenceSource(
            id="ev-beta-008",
            brand_id=brand.id,
            title="Aurevia Engine v2 Beta Trial Performance Assessment (Conflicting Draft)",
            source_type=EvidenceType.BENCHMARK_REPORT,
            url="https://evidence.aurevia.internal/drafts/beta-v2-prelim.pdf",
            document_text="PRELIMINARY INTERNAL DRAFT: Early uncalibrated beta test telemetry indicated processing time reduction of 25.0%. Contradicts formal certified 30.0% benchmark by Apex Analytics.",
            publication_date=now - timedelta(days=95),
            expiration_date=now + timedelta(days=120),
            verification_status=EvidenceStatus.PENDING,
            responsible_owner="Internal Beta Test Working Group",
            verification_notes="CONFLICT DETECTED: Discrepancy with Apex Analytics 30% report. Tier 3 Internal Draft vs Tier 1 Certified Audit."
        )
        db.add_all([ev_benchmark, ev_sla, ev_soc2, ev_telemetry, ev_tco, ev_esg, ev_legacy, ev_beta_conflicting])
        db.flush()

        # 5. Brand Facts (12 Approved/Active Facts)
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
            responsible_owner="DevOps Compliance Office",
            notes="Requires enterprise tier reference."
        )
        fact_sec = BrandFact(
            id="fact-sec-003",
            brand_id=brand.id,
            claim_statement="Aurevia is SOC 2 Type II and ISO 27001 certified.",
            category="compliance",
            status=FactStatus.APPROVED,
            metric_value=27001.0,
            metric_unit="standard",
            validity_start=now - timedelta(days=75),
            validity_end=now + timedelta(days=290),
            version=1,
            responsible_owner="Chief Information Security Officer",
            notes="Ernst & Cyber LLP attestation."
        )
        fact_latency = BrandFact(
            id="fact-latency-004",
            brand_id=brand.id,
            claim_statement="Sub-15ms p99 query latency across 10 million telemetry events.",
            category="performance",
            status=FactStatus.APPROVED,
            metric_value=15.0,
            metric_unit="ms",
            validity_start=now - timedelta(days=40),
            validity_end=now + timedelta(days=325),
            version=1,
            responsible_owner="Cloud Performance Engineering",
            notes="P99 benchmark verified."
        )
        fact_concur = BrandFact(
            id="fact-concur-005",
            brand_id=brand.id,
            claim_statement="Supports 50,000 concurrent deterministic workflow transactions.",
            category="scalability",
            status=FactStatus.APPROVED,
            metric_value=50000.0,
            metric_unit="workflows",
            validity_start=now - timedelta(days=40),
            validity_end=now + timedelta(days=325),
            version=1,
            responsible_owner="Cloud Performance Engineering",
            notes="High concurrency verified."
        )
        fact_cost = BrandFact(
            id="fact-cost-006",
            brand_id=brand.id,
            claim_statement="Lowers operational cloud spend by 22% via smart autoscaling.",
            category="financial",
            status=FactStatus.APPROVED,
            metric_value=22.0,
            metric_unit="%",
            validity_start=now - timedelta(days=50),
            validity_end=now + timedelta(days=315),
            version=1,
            responsible_owner="Financial Operations Desk",
            notes="Requires forward-looking disclaimer."
        )
        fact_encrypt = BrandFact(
            id="fact-encrypt-007",
            brand_id=brand.id,
            claim_statement="Zero-trust AES-256 and TLS 1.3 encryption at rest and in transit.",
            category="security",
            status=FactStatus.APPROVED,
            metric_value=256.0,
            metric_unit="bits",
            validity_start=now - timedelta(days=75),
            validity_end=now + timedelta(days=290),
            version=1,
            responsible_owner="Chief Information Security Officer",
            notes="FIPS 140-3 compliant encryption."
        )
        fact_disaster = BrandFact(
            id="fact-disaster-008",
            brand_id=brand.id,
            claim_statement="Recovery Time Objective (RTO) under 60 seconds with active-active replication.",
            category="reliability",
            status=FactStatus.APPROVED,
            metric_value=60.0,
            metric_unit="seconds",
            validity_start=now - timedelta(days=90),
            validity_end=now + timedelta(days=275),
            version=1,
            responsible_owner="Site Reliability Team",
            notes="Automated failover verified in chaos engineering tests."
        )
        fact_integration = BrandFact(
            id="fact-integration-009",
            brand_id=brand.id,
            claim_statement="Out-of-the-box integration with 120+ enterprise data connectors.",
            category="ecosystem",
            status=FactStatus.APPROVED,
            metric_value=120.0,
            metric_unit="connectors",
            validity_start=now - timedelta(days=60),
            validity_end=now + timedelta(days=305),
            version=1,
            responsible_owner="Partner Solutions Desk",
            notes="Includes Snowflake, Databricks, Salesforce, SAP, and Postgres."
        )
        fact_retention = BrandFact(
            id="fact-retention-010",
            brand_id=brand.id,
            claim_statement="Maintains 99.2% annual customer net retention rate across Fortune 500.",
            category="business",
            status=FactStatus.APPROVED,
            metric_value=99.2,
            metric_unit="%",
            validity_start=now - timedelta(days=60),
            validity_end=now + timedelta(days=305),
            version=1,
            responsible_owner="Revenue Operations",
            notes="Audited FY2025 ARR retention."
        )
        fact_energy = BrandFact(
            id="fact-energy-011",
            brand_id=brand.id,
            claim_statement="Certified Carbon Neutral cloud compute infrastructure powered by 100% renewables.",
            category="sustainability",
            status=FactStatus.APPROVED,
            metric_value=100.0,
            metric_unit="%",
            validity_start=now - timedelta(days=80),
            validity_end=now + timedelta(days=285),
            version=1,
            responsible_owner="ESG Steering Committee",
            notes="Requires GreenTech certificate citation."
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
        db.add_all([
            fact_perf, fact_sla, fact_sec, fact_latency, fact_concur, fact_cost,
            fact_encrypt, fact_disaster, fact_integration, fact_retention, fact_energy, fact_legacy
        ])
        db.flush()

        # 6. Fact-Evidence Links
        db.add_all([
            FactEvidenceLink(id="link-001", fact_id=fact_perf.id, evidence_id=ev_benchmark.id, exact_passage="Aurevia reduces average processing time by 30.0% compared to industry baseline.", confidence=1.0),
            FactEvidenceLink(id="link-002", fact_id=fact_sla.id, evidence_id=ev_sla.id, exact_passage="maintained 99.99% system availability SLA across multi-region deployments", confidence=1.0),
            FactEvidenceLink(id="link-003", fact_id=fact_sec.id, evidence_id=ev_soc2.id, exact_passage="Aurevia Enterprise Platform satisfies Trust Services Criteria for Security, Availability, and Confidentiality. ISO 27001:2022 certified", confidence=1.0),
            FactEvidenceLink(id="link-004", fact_id=fact_latency.id, evidence_id=ev_telemetry.id, exact_passage="sub-15ms p99 query latency across 10 million telemetry events", confidence=1.0),
            FactEvidenceLink(id="link-005", fact_id=fact_concur.id, evidence_id=ev_telemetry.id, exact_passage="supports 50,000 concurrent deterministic workflow transactions", confidence=1.0),
            FactEvidenceLink(id="link-006", fact_id=fact_cost.id, evidence_id=ev_tco.id, exact_passage="Aurevia lowers operational cloud spend by 22% via smart autoscaling", confidence=1.0),
            FactEvidenceLink(id="link-007", fact_id=fact_encrypt.id, evidence_id=ev_soc2.id, exact_passage="Trust Services Criteria for Security, Availability, and Confidentiality", confidence=0.98),
            FactEvidenceLink(id="link-008", fact_id=fact_disaster.id, evidence_id=ev_sla.id, exact_passage="maintained 99.99% system availability SLA across multi-region deployments in trailing 12 months with zero unhandled catastrophic outages", confidence=0.99),
            FactEvidenceLink(id="link-009", fact_id=fact_energy.id, evidence_id=ev_esg.id, exact_passage="Aurevia compute clusters run on 100% renewable electricity with net-zero carbon intensity", confidence=1.0),
            FactEvidenceLink(id="link-010", fact_id=fact_legacy.id, evidence_id=ev_legacy.id, exact_passage="Demonstrated 15% throughput uplift on single-threaded execution.", confidence=1.0),
        ])
        db.flush()

        # 7. Brand Rules & Disclaimers (6 Rules)
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
        rule_security = BrandRule(
            id="rule-security-004",
            brand_id=brand.id,
            rule_code="RULE-SEC-01",
            name="Mandatory Security Audit Citation",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern="SOC 2 Type II audit report available under enterprise NDA.",
            failure_message="Claims asserting enterprise SOC2 or ISO compliance must provide notice of confidential NDA audit report availability.",
            severity=Severity.MEDIUM,
            is_active=True
        )
        rule_financial = BrandRule(
            id="rule-financial-005",
            brand_id=brand.id,
            rule_code="RULE-FIN-01",
            name="TCO Forward-Looking Statement Disclaimer",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern="Savings estimates based on customer study averages. Actual cloud cost savings depend on architecture.",
            failure_message="Materials citing 22% cloud savings must display the standard financial disclaimer.",
            severity=Severity.HIGH,
            is_active=True
        )
        rule_esg = BrandRule(
            id="rule-esg-006",
            brand_id=brand.id,
            rule_code="RULE-ESG-01",
            name="Carbon Neutrality Substantiation Requirement",
            rule_type=RuleType.REQUIRED_DISCLAIMER,
            check_pattern="Verified by GreenTech Labs under GHG Protocol standards.",
            failure_message="Environmental sustainability claims require explicit GreenTech Labs audit attribution.",
            severity=Severity.MEDIUM,
            is_active=True
        )
        db.add_all([rule_disclaimer, rule_forbidden, rule_tone, rule_security, rule_financial, rule_esg])
        db.flush()

        # 8. Marketing Assets (9 Assets across different types)
        # Asset 1: Landing Page (Has Revision 1 non-compliant & Revision 2 compliant)
        asset_hero = MarketingAsset(
            id="asset-landing-001",
            organization_id=org.id,
            brand_id=brand.id,
            title="Aurevia Enterprise Launch Landing Page",
            asset_type=AssetType.LANDING_PAGE,
            campaign_name="Global Launch 2026",
            status=AssetStatus.IN_REVIEW,
            author_id="user-creator-03"
        )
        db.add(asset_hero)
        db.flush()

        rev1_hero = AssetRevision(
            id="rev-landing-001-v1",
            asset_id=asset_hero.id,
            revision_number=1,
            content_text="Welcome to Aurevia. Aurevia reduces average processing time by 50% across all enterprise workflows. It is guaranteed 100% error-free and delivers unbeatable performance for global enterprises.",
            change_summary="Initial marketing draft prepared for enterprise launch.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=2)
        )
        db.add(rev1_hero)
        db.flush()

        claim1_v1 = ExtractedClaim(
            id="claim-hero-v1-01",
            revision_id=rev1_hero.id,
            claim_text="Aurevia reduces average processing time by 50%",
            claim_type="NUMERIC_METRIC",
            extracted_value=50.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        claim1_v1_super = ExtractedClaim(
            id="claim-hero-v1-02",
            revision_id=rev1_hero.id,
            claim_text="guaranteed 100% error-free and delivers unbeatable performance",
            claim_type="SUPERLATIVE_OR_GUARANTEE",
            extracted_value=None,
            unit=None
        )
        db.add_all([claim1_v1, claim1_v1_super])
        db.flush()

        audit1_hero = AuditRun(
            id="audit-run-001-v1",
            revision_id=rev1_hero.id,
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
        db.add(audit1_hero)
        db.flush()

        db.add_all([
            AuditFinding(
                id="finding-v1-01",
                audit_run_id=audit1_hero.id,
                claim_id=claim1_v1.id,
                fact_id=fact_perf.id,
                evidence_id=ev_benchmark.id,
                category=FindingCategory.CONTRADICTED,
                severity=Severity.CRITICAL,
                explanation="Claimed performance of 50.0% exceeds approved benchmark of 30.0%. Contradicts official evidence in 'Aurevia Core Engine Benchmark Report 2026-Q1'.",
                suggested_correction="Correct figure to approved benchmark: 30.0% as documented in benchmark report.",
                exact_citation_text="Aurevia Core Engine Benchmark Report 2026-Q1 (Sec 3.2)"
            ),
            AuditFinding(
                id="finding-v1-02",
                audit_run_id=audit1_hero.id,
                rule_id=rule_forbidden.id,
                category=FindingCategory.BRAND_GUIDELINE_VIOLATION,
                severity=Severity.CRITICAL,
                explanation="Prohibited phrasing detected: 'guaranteed 100% error-free', 'unbeatable'. Absolute claims are deceptive under consumer protection regulations.",
                suggested_correction="Remove prohibited terms and replace with defensible, substantiated phrasing.",
                exact_citation_text="Rule: RULE-FORBIDDEN-01 (Prohibited Absolute Guarantees)"
            ),
            AuditFinding(
                id="finding-v1-03",
                audit_run_id=audit1_hero.id,
                rule_id=rule_disclaimer.id,
                category=FindingCategory.MISSING_DISCLOSURE,
                severity=Severity.HIGH,
                explanation="Required mandatory disclaimer is missing: 'Results may vary based on workload parameters and enterprise tier configuration.'",
                suggested_correction="Include the required disclosure statement in the footer or footnote.",
                exact_citation_text="Mandatory Brand Rule: RULE-DISCLAIM-01"
            )
        ])
        db.flush()

        rev2_hero = AssetRevision(
            id="rev-landing-001-v2",
            asset_id=asset_hero.id,
            revision_number=2,
            content_text="Welcome to Aurevia. Aurevia reduces average processing time by 30% across verified benchmark workloads. Delivering robust enterprise reliability for global organizations. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Aligned performance metric with approved 30% benchmark, eliminated forbidden guarantees, and inserted required performance disclosure.",
            author_id="user-creator-03",
            created_at=now - timedelta(hours=3)
        )
        db.add(rev2_hero)
        db.flush()

        claim2_hero = ExtractedClaim(
            id="claim-hero-v2-01",
            revision_id=rev2_hero.id,
            claim_text="Aurevia reduces average processing time by 30%",
            claim_type="NUMERIC_METRIC",
            extracted_value=30.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        db.add(claim2_hero)
        db.flush()

        audit2_hero = AuditRun(
            id="audit-run-001-v2",
            revision_id=rev2_hero.id,
            run_by_user_id="user-creator-03",
            status=AuditStatus.COMPLIANT,
            total_claims=1,
            total_findings=1,
            critical_count=0,
            high_count=0,
            medium_count=0,
            low_count=1,
            execution_ms=12.1,
            created_at=now - timedelta(hours=3)
        )
        db.add(audit2_hero)
        db.flush()

        db.add(AuditFinding(
            id="finding-v2-01",
            audit_run_id=audit2_hero.id,
            claim_id=claim2_hero.id,
            fact_id=fact_perf.id,
            evidence_id=ev_benchmark.id,
            category=FindingCategory.SUPPORTED,
            severity=Severity.LOW,
            explanation="Claim strictly substantiated by approved benchmark of 30.0% in 'Aurevia Core Engine Benchmark Report 2026-Q1'.",
            suggested_correction=None,
            exact_citation_text="Aurevia Core Engine Benchmark Report 2026-Q1 (Verified)"
        ))
        db.flush()
        asset_hero.current_revision_id = rev2_hero.id

        # Asset 2: Social Media Post (Has Rev 1 and Rev 2 - Approved)
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

        rev_soc_v1 = AssetRevision(
            id="rev-soc-001-v1",
            asset_id=asset_social.id,
            revision_number=1,
            content_text="Speed up your operations! Aurevia delivers 40% faster execution with 100% risk-free guarantees.",
            change_summary="Initial social post draft.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=5, hours=4)
        )
        rev_soc_v2 = AssetRevision(
            id="rev-soc-001",
            asset_id=asset_social.id,
            revision_number=2,
            content_text="Speed up your operations! Aurevia reduces average processing time by 30% for high-throughput enterprise teams. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Approved social launch post with substantiated benchmark and disclaimer.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=5)
        )
        db.add_all([rev_soc_v1, rev_soc_v2])
        db.flush()
        asset_social.current_revision_id = rev_soc_v2.id

        claim_soc = ExtractedClaim(
            id="claim-soc-01",
            revision_id=rev_soc_v2.id,
            claim_text="Aurevia reduces average processing time by 30%",
            claim_type="NUMERIC_METRIC",
            extracted_value=30.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        db.add(claim_soc)
        db.flush()

        appr_soc = ApprovalRecord(
            id="appr-soc-001",
            asset_id=asset_social.id,
            revision_id=rev_soc_v2.id,
            reviewer_id="user-reviewer-05",
            decision=ApprovalDecision.APPROVED,
            decision_reason="All claims match verified 2026 Q1 benchmark report. Mandatory disclaimer present.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=4)
        )
        db.add(appr_soc)
        db.flush()

        # Asset 3: Email Campaign (Has Rev 1 and Rev 2 - Approved)
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

        rev_email_v1 = AssetRevision(
            id="rev-email-001-v1",
            asset_id=asset_email.id,
            revision_number=1,
            content_text="Modernize data processing with Aurevia. Aurevia reduces average processing time by 30% with 100% uptime guaranteed.",
            change_summary="Draft email with absolute uptime claim.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=7, hours=6)
        )
        rev_email_v2 = AssetRevision(
            id="rev-email-001",
            asset_id=asset_email.id,
            revision_number=2,
            content_text="Executive Briefing: Modernize data processing with Aurevia. Aurevia reduces average processing time by 30% while maintaining 99.99% system availability SLA. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Approved executive briefing email with precise 99.99% SLA.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=7)
        )
        db.add_all([rev_email_v1, rev_email_v2])
        db.flush()
        asset_email.current_revision_id = rev_email_v2.id

        claim_email1 = ExtractedClaim(
            id="claim-em-01",
            revision_id=rev_email_v2.id,
            claim_text="Aurevia reduces average processing time by 30%",
            claim_type="NUMERIC_METRIC",
            extracted_value=30.0,
            unit="%",
            matched_fact_id=fact_perf.id
        )
        claim_email2 = ExtractedClaim(
            id="claim-em-02",
            revision_id=rev_email_v2.id,
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
            revision_id=rev_email_v2.id,
            reviewer_id="user-reviewer-05",
            decision=ApprovalDecision.APPROVED,
            decision_reason="Verified against Q1 Benchmark and SLA audit. Maker-checker separation enforced.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=6)
        )
        db.add(appr_email)
        db.flush()

        # Asset 4: Architecture Brochure (Revisions 1 & 2 - CHANGES_REQUESTED)
        asset_brochure = MarketingAsset(
            id="asset-brochure-004",
            organization_id=org.id,
            brand_id=brand.id,
            title="Aurevia Technical Architecture Data Sheet",
            asset_type=AssetType.PRODUCT_DESCRIPTION,
            campaign_name="Enterprise Enablement",
            status=AssetStatus.CHANGES_REQUESTED,
            author_id="user-creator-03",
            created_at=now - timedelta(days=3)
        )
        db.add(asset_brochure)
        db.flush()

        rev_brochure_v1 = AssetRevision(
            id="rev-brochure-001-v1",
            asset_id=asset_brochure.id,
            revision_number=1,
            content_text="Aurevia Technical Architecture: Supports 50,000 concurrent deterministic workflow transactions with sub-15ms p99 query latency. Unbeatable performance across multi-cloud regions.",
            change_summary="Initial data sheet draft.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=3, hours=5)
        )
        rev_brochure_v2 = AssetRevision(
            id="rev-brochure-001",
            asset_id=asset_brochure.id,
            revision_number=2,
            content_text="Aurevia Technical Architecture: Supports 50,000 concurrent deterministic workflow transactions with sub-15ms p99 query latency across 10 million telemetry events. Operates with zero-trust AES-256 and TLS 1.3 encryption.",
            change_summary="Removed superlative 'unbeatable'. Pending mandatory NDA citation.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=3)
        )
        db.add_all([rev_brochure_v1, rev_brochure_v2])
        db.flush()
        asset_brochure.current_revision_id = rev_brochure_v2.id

        appr_brochure = ApprovalRecord(
            id="appr-brochure-001",
            asset_id=asset_brochure.id,
            revision_id=rev_brochure_v2.id,
            reviewer_id="user-compliance-04",
            decision=ApprovalDecision.CHANGES_REQUESTED,
            decision_reason="Missing mandatory security disclosure: 'SOC 2 Type II audit report available under enterprise NDA.' (RULE-SEC-01). Please add disclosure.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=2)
        )
        db.add(appr_brochure)
        db.flush()

        # Asset 5: Security Brief (CAMPAIGN_BRIEF - APPROVED)
        asset_sec = MarketingAsset(
            id="asset-brief-005",
            organization_id=org.id,
            brand_id=brand.id,
            title="Q3 Enterprise Security & Compliance Whitepaper Brief",
            asset_type=AssetType.CAMPAIGN_BRIEF,
            campaign_name="Enterprise Enablement",
            status=AssetStatus.APPROVED,
            author_id="user-compliance-04",
            created_at=now - timedelta(days=4)
        )
        db.add(asset_sec)
        db.flush()

        rev_sec = AssetRevision(
            id="rev-brief-005-v1",
            asset_id=asset_sec.id,
            revision_number=1,
            content_text="Aurevia Security Brief: Aurevia is SOC 2 Type II and ISO 27001 certified. Engineered with zero-trust AES-256 and TLS 1.3 encryption at rest and in transit. SOC 2 Type II audit report available under enterprise NDA.",
            change_summary="Approved security brief with verified certifications and disclosure.",
            author_id="user-compliance-04",
            created_at=now - timedelta(days=4)
        )
        db.add(rev_sec)
        db.flush()
        asset_sec.current_revision_id = rev_sec.id

        # Asset 6: Press Release (CAMPAIGN_BRIEF - ESCALATED / NEEDS_REVIEW)
        asset_press = MarketingAsset(
            id="asset-press-006",
            organization_id=org.id,
            brand_id=brand.id,
            title="Global Cloud Infrastructure Partnership Press Release",
            asset_type=AssetType.CAMPAIGN_BRIEF,
            campaign_name="Global Launch 2026",
            status=AssetStatus.IN_REVIEW,
            author_id="user-creator-03",
            created_at=now - timedelta(hours=18)
        )
        db.add(asset_press)
        db.flush()

        rev_press = AssetRevision(
            id="rev-press-006-v1",
            asset_id=asset_press.id,
            revision_number=1,
            content_text="FOR IMMEDIATE RELEASE: Aurevia announces native integration with 120+ enterprise data connectors while lowering operational cloud spend by 22% via smart autoscaling. Savings estimates based on customer study averages. Actual cloud cost savings depend on architecture.",
            change_summary="New joint press release awaiting multi-stakeholder legal clearance.",
            author_id="user-creator-03",
            created_at=now - timedelta(hours=18)
        )
        db.add(rev_press)
        db.flush()
        asset_press.current_revision_id = rev_press.id

        # Asset 7: Pricing Page (LANDING_PAGE - IN_REVIEW / PENDING)
        asset_pricing = MarketingAsset(
            id="asset-pricing-007",
            organization_id=org.id,
            brand_id=brand.id,
            title="Enterprise Tier Pricing & SLA Commitment Page",
            asset_type=AssetType.LANDING_PAGE,
            campaign_name="Enterprise Enablement",
            status=AssetStatus.IN_REVIEW,
            author_id="user-creator-03",
            created_at=now - timedelta(hours=10)
        )
        db.add(asset_pricing)
        db.flush()

        rev_pricing = AssetRevision(
            id="rev-pricing-007-v1",
            asset_id=asset_pricing.id,
            revision_number=1,
            content_text="Aurevia Enterprise Tier: Guaranteed Recovery Time Objective (RTO) under 60 seconds with active-active replication and 99.99% system availability SLA across all private cloud VPCs. Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Enterprise SLA and disaster recovery commitment copy.",
            author_id="user-creator-03",
            created_at=now - timedelta(hours=10)
        )
        db.add(rev_pricing)
        db.flush()
        asset_pricing.current_revision_id = rev_pricing.id

        # Asset 8: Concurrency Social Announcement (SOCIAL_POST - APPROVED)
        asset_concur = MarketingAsset(
            id="asset-social-008",
            organization_id=org.id,
            brand_id=brand.id,
            title="Tech Leaders Q2 Cloud Concurrency Announcement",
            asset_type=AssetType.SOCIAL_POST,
            campaign_name="Global Launch 2026",
            status=AssetStatus.APPROVED,
            author_id="user-creator-03",
            created_at=now - timedelta(days=6)
        )
        db.add(asset_concur)
        db.flush()

        rev_concur = AssetRevision(
            id="rev-soc-008-v1",
            asset_id=asset_concur.id,
            revision_number=1,
            content_text="Powering millions: Aurevia now supports 50,000 concurrent deterministic workflow transactions with sub-15ms p99 query latency! Results may vary based on workload parameters and enterprise tier configuration.",
            change_summary="Approved high-scale technical milestone announcement.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=6)
        )
        db.add(rev_concur)
        db.flush()
        asset_concur.current_revision_id = rev_concur.id

        appr_concur = ApprovalRecord(
            id="appr-concur-001",
            asset_id=asset_concur.id,
            revision_id=rev_concur.id,
            reviewer_id="user-reviewer-05",
            decision=ApprovalDecision.APPROVED,
            decision_reason="Verified against Multi-Region Concurrency Whitepaper (ev-telemetry-004). Mandatory disclaimer verified.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=5)
        )
        db.add(appr_concur)
        db.flush()

        # Asset 9: ESG Newsletter (EMAIL_CAMPAIGN - APPROVED)
        asset_esg = MarketingAsset(
            id="asset-email-009",
            organization_id=org.id,
            brand_id=brand.id,
            title="ESG & Green Cloud Computing Customer Newsletter",
            asset_type=AssetType.EMAIL_CAMPAIGN,
            campaign_name="Sustainability 2026",
            status=AssetStatus.APPROVED,
            author_id="user-creator-03",
            created_at=now - timedelta(days=8)
        )
        db.add(asset_esg)
        db.flush()

        rev_esg = AssetRevision(
            id="rev-email-009-v1",
            asset_id=asset_esg.id,
            revision_number=1,
            content_text="Building a sustainable future: Aurevia runs on Certified Carbon Neutral cloud compute infrastructure powered by 100% renewables. Verified by GreenTech Labs under GHG Protocol standards.",
            change_summary="Approved customer sustainability update with full GreenTech certification attribution.",
            author_id="user-creator-03",
            created_at=now - timedelta(days=8)
        )
        db.add(rev_esg)
        db.flush()
        asset_esg.current_revision_id = rev_esg.id

        appr_esg = ApprovalRecord(
            id="appr-esg-001",
            asset_id=asset_esg.id,
            revision_id=rev_esg.id,
            reviewer_id="user-reviewer-05",
            decision=ApprovalDecision.APPROVED,
            decision_reason="Substantiated by GreenTech Labs Carbon Neutrality Certificate (ev-esg-006). Attestation verified.",
            separation_of_duties_verified=True,
            created_at=now - timedelta(days=7)
        )
        db.add(appr_esg)
        db.flush()

        # 9. Topological Dependency Graph Edges (Connecting all 8 evidence to 12 facts, facts to 9 assets, and rules to assets)
        deps = [
            # Evidence -> Fact (SUBSTANTIATES)
            DependencyEdge(id="dep-01", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_benchmark.id, target_type=EntityType.FACT, target_id=fact_perf.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-02", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_sla.id, target_type=EntityType.FACT, target_id=fact_sla.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-03", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_soc2.id, target_type=EntityType.FACT, target_id=fact_sec.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-04", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_soc2.id, target_type=EntityType.FACT, target_id=fact_encrypt.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-05", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_telemetry.id, target_type=EntityType.FACT, target_id=fact_latency.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-06", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_telemetry.id, target_type=EntityType.FACT, target_id=fact_concur.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-07", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_tco.id, target_type=EntityType.FACT, target_id=fact_cost.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-08", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_sla.id, target_type=EntityType.FACT, target_id=fact_disaster.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-09", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_esg.id, target_type=EntityType.FACT, target_id=fact_energy.id, relation_type="SUBSTANTIATES", is_confirmed=True),
            DependencyEdge(id="dep-10", brand_id=brand.id, source_type=EntityType.EVIDENCE, source_id=ev_legacy.id, target_type=EntityType.FACT, target_id=fact_legacy.id, relation_type="SUBSTANTIATES", is_confirmed=True),

            # Fact -> Asset (GROUNDS_ASSET)
            DependencyEdge(id="dep-11", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_perf.id, target_type=EntityType.ASSET, target_id=asset_hero.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-12", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_perf.id, target_type=EntityType.ASSET, target_id=asset_social.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-13", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_perf.id, target_type=EntityType.ASSET, target_id=asset_email.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-14", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_sla.id, target_type=EntityType.ASSET, target_id=asset_email.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-15", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_sla.id, target_type=EntityType.ASSET, target_id=asset_pricing.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-16", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_concur.id, target_type=EntityType.ASSET, target_id=asset_brochure.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-17", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_latency.id, target_type=EntityType.ASSET, target_id=asset_brochure.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-18", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_sec.id, target_type=EntityType.ASSET, target_id=asset_sec.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-19", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_encrypt.id, target_type=EntityType.ASSET, target_id=asset_sec.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-20", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_cost.id, target_type=EntityType.ASSET, target_id=asset_press.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-21", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_integration.id, target_type=EntityType.ASSET, target_id=asset_press.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-22", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_disaster.id, target_type=EntityType.ASSET, target_id=asset_pricing.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-23", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_concur.id, target_type=EntityType.ASSET, target_id=asset_concur.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-24", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_latency.id, target_type=EntityType.ASSET, target_id=asset_concur.id, relation_type="GROUNDS_ASSET", is_confirmed=True),
            DependencyEdge(id="dep-25", brand_id=brand.id, source_type=EntityType.FACT, source_id=fact_energy.id, target_type=EntityType.ASSET, target_id=asset_esg.id, relation_type="GROUNDS_ASSET", is_confirmed=True),

            # Rule -> Asset (GOVERNS)
            DependencyEdge(id="dep-26", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_disclaimer.id, target_type=EntityType.ASSET, target_id=asset_hero.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-27", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_forbidden.id, target_type=EntityType.ASSET, target_id=asset_hero.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-28", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_disclaimer.id, target_type=EntityType.ASSET, target_id=asset_social.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-29", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_disclaimer.id, target_type=EntityType.ASSET, target_id=asset_email.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-30", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_security.id, target_type=EntityType.ASSET, target_id=asset_sec.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-31", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_security.id, target_type=EntityType.ASSET, target_id=asset_brochure.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-32", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_financial.id, target_type=EntityType.ASSET, target_id=asset_press.id, relation_type="GOVERNS", is_confirmed=True),
            DependencyEdge(id="dep-33", brand_id=brand.id, source_type=EntityType.RULE, source_id=rule_esg.id, target_type=EntityType.ASSET, target_id=asset_esg.id, relation_type="GOVERNS", is_confirmed=True),
        ]
        db.add_all(deps)
        db.flush()

        # 10. Pre-seeded What-If Scenarios (3 Scenarios)
        scenario1 = WhatIfScenario(
            id="scenario-sample-001",
            brand_id=brand.id,
            created_by_user_id="user-brand-02",
            title="Q3 Benchmark Downgrade (30% to 20%)",
            description="Simulate regulatory risk and blast radius if updated re-benchmarking reduces official performance uplift claim from 30% to 20%.",
            change_type=ScenarioChangeType.UPDATE_FACT_METRIC,
            target_entity_id=fact_perf.id,
            proposed_payload_json={"metric_value": 20.0, "unit": "%"},
            status=ScenarioStatus.SIMULATED
        )
        scenario2 = WhatIfScenario(
            id="scenario-sample-002",
            brand_id=brand.id,
            created_by_user_id="user-compliance-04",
            title="SOC 2 Recertification Audit Scope Adjustment",
            description="Project collateral blast radius if ISO 27001 recertification is partitioned into a separate scope, requiring revised security citations across enterprise briefs.",
            change_type=ScenarioChangeType.ADD_MANDATORY_DISCLAIMER,
            target_entity_id=rule_security.id,
            proposed_payload_json={"severity": "CRITICAL", "check_pattern": "SOC 2 Type II and ISO 27001 audit attestation certificates available under mutual enterprise NDA."},
            status=ScenarioStatus.SIMULATED
        )
        scenario3 = WhatIfScenario(
            id="scenario-sample-003",
            brand_id=brand.id,
            created_by_user_id="user-reviewer-05",
            title="Strict FTC Cloud ESG Greenwashing Rule Enforcement",
            description="Stress-test all marketing collateral against strict FTC Green Guides mandates requiring third-party carbon audit numbers in headline copy.",
            change_type=ScenarioChangeType.ADD_RESTRICTED_PHRASE,
            target_entity_id=brand.id,
            proposed_payload_json={"rule_code": "RULE-ESG-STRICT", "name": "Strict FTC Scope 1/2/3 Carbon Attestation", "severity": "CRITICAL"},
            status=ScenarioStatus.SIMULATED
        )
        db.add_all([scenario1, scenario2, scenario3])
        db.flush()

        scen_result1 = ScenarioResult(
            id="scen-res-001",
            scenario_id=scenario1.id,
            baseline_non_compliant_count=0,
            projected_non_compliant_count=3,
            affected_assets_count=3,
            projected_findings_json=[
                {"asset_id": asset_hero.id, "title": asset_hero.title, "finding": "Claims 30% but proposed benchmark drops to 20% (Contradicted Fact)"},
                {"asset_id": asset_social.id, "title": asset_social.title, "finding": "Claims 30% in published LinkedIn launch post (Contradicted Fact)"},
                {"asset_id": asset_email.id, "title": asset_email.title, "finding": "Claims 30% in executive briefing email (Contradicted Fact)"}
            ],
            summary_narrative="Simulating a reduction to 20% creates 3 direct collateral violations across Landing Page, Social, and Email assets."
        )
        scen_result2 = ScenarioResult(
            id="scen-res-002",
            scenario_id=scenario2.id,
            baseline_non_compliant_count=1,
            projected_non_compliant_count=2,
            affected_assets_count=2,
            projected_findings_json=[
                {"asset_id": asset_sec.id, "title": asset_sec.title, "finding": "Requires updated NDA attestation phrasing (RULE-SEC-01)"},
                {"asset_id": asset_brochure.id, "title": asset_brochure.title, "finding": "Missing mutual enterprise NDA clause in technical specification"}
            ],
            summary_narrative="Scope adjustment elevates 2 enterprise technical assets into the compliance review queue."
        )
        scen_result3 = ScenarioResult(
            id="scen-res-003",
            scenario_id=scenario3.id,
            baseline_non_compliant_count=0,
            projected_non_compliant_count=1,
            affected_assets_count=1,
            projected_findings_json=[
                {"asset_id": asset_esg.id, "title": asset_esg.title, "finding": "Requires explicit GHG Protocol Scope 1 and Scope 2 numeric breakdown"}
            ],
            summary_narrative="Strict ESG rule triggers instant re-audit on Customer Newsletter with clear remediating draft."
        )
        db.add_all([scen_result1, scen_result2, scen_result3])
        db.flush()

        # 11. Audit Events (Dense WORM append-only event narrative)
        events = [
            AuditEvent(id="evt-001", organization_id=org.id, actor_id="user-brand-02", event_type="BRAND_INITIALIZED", entity_type="Brand", entity_id=brand.id, description="Brand Manager established enterprise governance workspace for Aurevia"),
            AuditEvent(id="evt-002", organization_id=org.id, actor_id="user-custodian-07", event_type="EVIDENCE_VERIFIED", entity_type="EvidenceSource", entity_id=ev_benchmark.id, description="Evidence Custodian verified Apex Analytics Core Engine Benchmark Report (30.0%)"),
            AuditEvent(id="evt-003", organization_id=org.id, actor_id="user-custodian-07", event_type="EVIDENCE_VERIFIED", entity_type="EvidenceSource", entity_id=ev_sla.id, description="Evidence Custodian verified Datacenter Guard 99.99% Cloud SLA Audit"),
            AuditEvent(id="evt-004", organization_id=org.id, actor_id="user-custodian-07", event_type="EVIDENCE_VERIFIED", entity_type="EvidenceSource", entity_id=ev_soc2.id, description="Evidence Custodian archived Ernst & Cyber SOC 2 Type II and ISO 27001 certificate"),
            AuditEvent(id="evt-005", organization_id=org.id, actor_id="user-brand-02", event_type="FACT_CREATED", entity_type="BrandFact", entity_id=fact_perf.id, description="Brand Manager created approved Fact: 'Aurevia reduces average processing time by 30%'"),
            AuditEvent(id="evt-006", organization_id=org.id, actor_id="user-brand-02", event_type="FACT_APPROVED", entity_type="BrandFact", entity_id=fact_sla.id, description="Approved Fact: 'Aurevia maintains 99.99% system availability SLA'"),
            AuditEvent(id="evt-007", organization_id=org.id, actor_id="user-compliance-04", event_type="RULE_PUBLISHED", entity_type="BrandRule", entity_id=rule_disclaimer.id, description="Compliance Analyst published mandatory performance disclaimer (RULE-DISCLAIM-01)"),
            AuditEvent(id="evt-008", organization_id=org.id, actor_id="user-compliance-04", event_type="RULE_PUBLISHED", entity_type="BrandRule", entity_id=rule_forbidden.id, description="Compliance Analyst published prohibited absolute guarantee constraints (RULE-FORBIDDEN-01)"),
            AuditEvent(id="evt-009", organization_id=org.id, actor_id="user-creator-03", event_type="ASSET_DRAFTED", entity_type="MarketingAsset", entity_id=asset_hero.id, description="Content Creator drafted Aurevia Enterprise Launch Landing Page (Rev 1)"),
            AuditEvent(id="evt-010", organization_id=org.id, actor_id="user-creator-03", event_type="AUDIT_EXECUTED", entity_type="AuditRun", entity_id=audit1_hero.id, description="Deterministic audit engine flagged 2 Critical and 1 High severity finding on Rev 1 (50% claim contradicts 30% benchmark)"),
            AuditEvent(id="evt-011", organization_id=org.id, actor_id="user-creator-03", event_type="AUTO_FIX_APPLIED", entity_type="AssetRevision", entity_id=rev2_hero.id, description="Content Creator applied Auto-Fix Diff Studio suggestion to conform claims with 30% benchmark and added disclaimer"),
            AuditEvent(id="evt-012", organization_id=org.id, actor_id="user-creator-03", event_type="AUDIT_EXECUTED", entity_type="AuditRun", entity_id=audit2_hero.id, description="Re-audit confirmed Revision 2 COMPLIANT with zero critical violations. Submitted to Review Queue"),
            AuditEvent(id="evt-013", organization_id=org.id, actor_id="user-reviewer-05", event_type="MAKER_CHECKER_VERIFIED", entity_type="ApprovalRecord", entity_id=appr_soc.id, description="Approver verified maker-checker separation for Social Post (Creator Sarah Chen != Reviewer Victoria Brooks)"),
            AuditEvent(id="evt-014", organization_id=org.id, actor_id="user-reviewer-05", event_type="APPROVAL_GRANTED", entity_type="MarketingAsset", entity_id=asset_social.id, description="Victoria Brooks approved Global X/LinkedIn Launch Snippet with Brand Clearance Certificate"),
            AuditEvent(id="evt-015", organization_id=org.id, actor_id="user-reviewer-05", event_type="APPROVAL_GRANTED", entity_type="MarketingAsset", entity_id=asset_email.id, description="Victoria Brooks approved Q2 Executive Briefing Email Campaign with cryptographic attestation"),
            AuditEvent(id="evt-016", organization_id=org.id, actor_id="user-compliance-04", event_type="CHANGES_REQUESTED", entity_type="MarketingAsset", entity_id=asset_brochure.id, description="Compliance Analyst requested changes on Architecture Brochure: missing SOC 2 NDA citation"),
            AuditEvent(id="evt-017", organization_id=org.id, actor_id="user-custodian-07", event_type="EVIDENCE_CONFLICT_FLAGGED", entity_type="EvidenceSource", entity_id=ev_beta_conflicting.id, description="Evidence Custodian detected conflicting draft ev-beta-008 (25% vs official 30%). Flagged for Conflict Resolution"),
            AuditEvent(id="evt-018", organization_id=org.id, actor_id="user-admin-01", event_type="WORM_BLOCK_COMMITTED", entity_type="WormLedger", entity_id="block-011", description="WORM Ledger calculated SHA-256 Merkle root over all active governance blocks"),
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
        print("[Inkloom AI] Enterprise dataset successfully seeded! 12 facts, 8 evidence, 6 rules, 9 assets, 3 scenarios across 3 tenants.")

    except Exception as e:
        db.rollback()
        print(f"[Inkloom AI] Seed error: {e}")
        raise e
    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    seed_database(force=True)
