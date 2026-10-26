import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base
from app.enums import (
    UserRole, FactStatus, EvidenceStatus, EvidenceType, RuleType, Severity,
    AssetType, AssetStatus, FindingCategory, AuditStatus, ApprovalDecision,
    ScenarioChangeType, ScenarioStatus, EntityType
)

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    brands = relationship("Brand", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("MarketingAsset", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.CONTENT_CREATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(100), nullable=False)
    tagline = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="brands")
    facts = relationship("BrandFact", back_populates="brand", cascade="all, delete-orphan")
    rules = relationship("BrandRule", back_populates="brand", cascade="all, delete-orphan")
    evidence_sources = relationship("EvidenceSource", back_populates="brand", cascade="all, delete-orphan")
    assets = relationship("MarketingAsset", back_populates="brand", cascade="all, delete-orphan")
    scenarios = relationship("WhatIfScenario", back_populates="brand", cascade="all, delete-orphan")
    dependencies = relationship("DependencyEdge", back_populates="brand", cascade="all, delete-orphan")


class BrandFact(Base):
    __tablename__ = "brand_facts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False, index=True)
    claim_statement = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default="performance")
    status = Column(SQLEnum(FactStatus), nullable=False, default=FactStatus.APPROVED)
    metric_value = Column(Float, nullable=True) # e.g. 30.0 for 30%
    metric_unit = Column(String(20), nullable=True) # e.g. "%", "ms", "x"
    validity_start = Column(DateTime, nullable=True)
    validity_end = Column(DateTime, nullable=True)
    version = Column(Integer, default=1)
    responsible_owner = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    brand = relationship("Brand", back_populates="facts")
    evidence_links = relationship("FactEvidenceLink", back_populates="fact", cascade="all, delete-orphan")


class BrandRule(Base):
    __tablename__ = "brand_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False, index=True)
    rule_code = Column(String(50), nullable=False) # e.g. RULE-DISCLAIM-01, RULE-FORBIDDEN-01
    name = Column(String(150), nullable=False)
    rule_type = Column(SQLEnum(RuleType), nullable=False)
    check_pattern = Column(Text, nullable=False) # forbidden keywords (comma separated) or disclaimer phrase or regex
    failure_message = Column(Text, nullable=False)
    severity = Column(SQLEnum(Severity), nullable=False, default=Severity.HIGH)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    brand = relationship("Brand", back_populates="rules")


class EvidenceSource(Base):
    __tablename__ = "evidence_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    source_type = Column(SQLEnum(EvidenceType), nullable=False, default=EvidenceType.BENCHMARK_REPORT)
    url = Column(String(500), nullable=True)
    file_path = Column(String(500), nullable=True)
    document_text = Column(Text, nullable=False) # Extracted raw or structured text
    publication_date = Column(DateTime, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    expiration_date = Column(DateTime, nullable=True)
    verification_status = Column(SQLEnum(EvidenceStatus), nullable=False, default=EvidenceStatus.VERIFIED)
    responsible_owner = Column(String(100), nullable=True)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    brand = relationship("Brand", back_populates="evidence_sources")
    fact_links = relationship("FactEvidenceLink", back_populates="evidence", cascade="all, delete-orphan")


class FactEvidenceLink(Base):
    __tablename__ = "fact_evidence_links"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fact_id = Column(String(36), ForeignKey("brand_facts.id"), nullable=False, index=True)
    evidence_id = Column(String(36), ForeignKey("evidence_sources.id"), nullable=False, index=True)
    exact_passage = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    fact = relationship("BrandFact", back_populates="evidence_links")
    evidence = relationship("EvidenceSource", back_populates="fact_links")


class MarketingAsset(Base):
    __tablename__ = "marketing_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    asset_type = Column(SQLEnum(AssetType), nullable=False, default=AssetType.LANDING_PAGE)
    campaign_name = Column(String(150), nullable=True)
    current_revision_id = Column(String(36), nullable=True)
    status = Column(SQLEnum(AssetStatus), nullable=False, default=AssetStatus.DRAFT)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="assets")
    brand = relationship("Brand", back_populates="assets")
    author = relationship("User")
    revisions = relationship("AssetRevision", back_populates="asset", cascade="all, delete-orphan")
    approval_records = relationship("ApprovalRecord", back_populates="asset", cascade="all, delete-orphan")


class AssetRevision(Base):
    __tablename__ = "asset_revisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("marketing_assets.id"), nullable=False, index=True)
    revision_number = Column(Integer, nullable=False, default=1)
    content_text = Column(Text, nullable=False)
    change_summary = Column(Text, nullable=True)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("MarketingAsset", back_populates="revisions")
    author = relationship("User")
    claims = relationship("ExtractedClaim", back_populates="revision", cascade="all, delete-orphan")
    audit_runs = relationship("AuditRun", back_populates="revision", cascade="all, delete-orphan")


class ExtractedClaim(Base):
    __tablename__ = "extracted_claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    revision_id = Column(String(36), ForeignKey("asset_revisions.id"), nullable=False, index=True)
    claim_text = Column(Text, nullable=False)
    claim_type = Column(String(50), nullable=False, default="NUMERIC_METRIC")
    extracted_value = Column(Float, nullable=True)
    unit = Column(String(20), nullable=True)
    matched_fact_id = Column(String(36), ForeignKey("brand_facts.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    revision = relationship("AssetRevision", back_populates="claims")
    matched_fact = relationship("BrandFact")
    findings = relationship("AuditFinding", back_populates="claim", cascade="all, delete-orphan")


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    revision_id = Column(String(36), ForeignKey("asset_revisions.id"), nullable=False, index=True)
    run_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(SQLEnum(AuditStatus), nullable=False, default=AuditStatus.NEEDS_REVIEW)
    total_claims = Column(Integer, default=0)
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    is_simulated = Column(Boolean, default=False)
    execution_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    revision = relationship("AssetRevision", back_populates="audit_runs")
    run_by_user = relationship("User")
    findings = relationship("AuditFinding", back_populates="audit_run", cascade="all, delete-orphan")


class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    audit_run_id = Column(String(36), ForeignKey("audit_runs.id"), nullable=False, index=True)
    claim_id = Column(String(36), ForeignKey("extracted_claims.id"), nullable=True, index=True)
    rule_id = Column(String(36), ForeignKey("brand_rules.id"), nullable=True, index=True)
    fact_id = Column(String(36), ForeignKey("brand_facts.id"), nullable=True, index=True)
    evidence_id = Column(String(36), ForeignKey("evidence_sources.id"), nullable=True, index=True)
    category = Column(SQLEnum(FindingCategory), nullable=False)
    severity = Column(SQLEnum(Severity), nullable=False, default=Severity.MEDIUM)
    explanation = Column(Text, nullable=False)
    suggested_correction = Column(Text, nullable=True)
    exact_citation_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    audit_run = relationship("AuditRun", back_populates="findings")
    claim = relationship("ExtractedClaim", back_populates="findings")
    rule = relationship("BrandRule")
    fact = relationship("BrandFact")
    evidence = relationship("EvidenceSource")


class ApprovalRecord(Base):
    __tablename__ = "approval_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("marketing_assets.id"), nullable=False, index=True)
    revision_id = Column(String(36), ForeignKey("asset_revisions.id"), nullable=False, index=True)
    audit_run_id = Column(String(36), ForeignKey("audit_runs.id"), nullable=True)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision = Column(SQLEnum(ApprovalDecision), nullable=False)
    decision_reason = Column(Text, nullable=False)
    separation_of_duties_verified = Column(Boolean, default=True) # Maker != Checker
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("MarketingAsset", back_populates="approval_records")
    reviewer = relationship("User")


class DependencyEdge(Base):
    __tablename__ = "dependency_edges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False, index=True)
    source_type = Column(SQLEnum(EntityType), nullable=False)
    source_id = Column(String(36), nullable=False, index=True)
    target_type = Column(SQLEnum(EntityType), nullable=False)
    target_id = Column(String(36), nullable=False, index=True)
    relation_type = Column(String(50), nullable=False) # e.g. EVIDENCES, GOVERNS, CONTAINS_CLAIM, DEPENDS_ON, VIOLATES
    is_confirmed = Column(Boolean, default=True) # True = confirmed by rule/data, False = inferred semantically
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    brand = relationship("Brand", back_populates="dependencies")


class WhatIfScenario(Base):
    __tablename__ = "what_if_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("brands.id"), nullable=False, index=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    change_type = Column(SQLEnum(ScenarioChangeType), nullable=False)
    target_entity_id = Column(String(36), nullable=False)
    proposed_payload_json = Column(JSON, nullable=False)
    status = Column(SQLEnum(ScenarioStatus), nullable=False, default=ScenarioStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)

    brand = relationship("Brand", back_populates="scenarios")
    created_by_user = relationship("User")
    results = relationship("ScenarioResult", back_populates="scenario", cascade="all, delete-orphan")


class ScenarioResult(Base):
    __tablename__ = "scenario_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(36), ForeignKey("what_if_scenarios.id"), nullable=False, index=True)
    baseline_non_compliant_count = Column(Integer, default=0)
    projected_non_compliant_count = Column(Integer, default=0)
    affected_assets_count = Column(Integer, default=0)
    projected_findings_json = Column(JSON, nullable=True)
    summary_narrative = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    scenario = relationship("WhatIfScenario", back_populates="results")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    event_type = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    description = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User")
