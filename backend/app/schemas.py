from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.enums import (
    UserRole, FactStatus, EvidenceStatus, EvidenceType, RuleType, Severity,
    AssetType, AssetStatus, FindingCategory, AuditStatus, ApprovalDecision,
    ScenarioChangeType, ScenarioStatus, EntityType
)

# ----------------- Auth & RBAC -----------------
class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole

class UserResponse(UserBase):
    id: str
    organization_id: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DemoRoleSwitchRequest(BaseModel):
    role: UserRole

# ----------------- Brand & Knowledge Hub -----------------
class BrandCreate(BaseModel):
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None

class BrandResponse(BrandCreate):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class BrandFactCreate(BaseModel):
    claim_statement: str
    category: str = "performance"
    status: FactStatus = FactStatus.APPROVED
    metric_value: Optional[float] = None
    metric_unit: Optional[str] = None
    validity_start: Optional[datetime] = None
    validity_end: Optional[datetime] = None
    responsible_owner: Optional[str] = None
    notes: Optional[str] = None
    evidence_ids: Optional[List[str]] = []

class BrandFactUpdate(BaseModel):
    claim_statement: Optional[str] = None
    category: Optional[str] = None
    status: Optional[FactStatus] = None
    metric_value: Optional[float] = None
    metric_unit: Optional[str] = None
    validity_start: Optional[datetime] = None
    validity_end: Optional[datetime] = None
    responsible_owner: Optional[str] = None
    notes: Optional[str] = None

class EvidenceSourceCreate(BaseModel):
    title: str
    source_type: EvidenceType = EvidenceType.BENCHMARK_REPORT
    url: Optional[str] = None
    file_path: Optional[str] = None
    document_text: str
    publication_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    verification_status: EvidenceStatus = EvidenceStatus.VERIFIED
    responsible_owner: Optional[str] = None
    verification_notes: Optional[str] = None

class EvidenceSourceUpdate(BaseModel):
    title: Optional[str] = None
    source_type: Optional[EvidenceType] = None
    document_text: Optional[str] = None
    expiration_date: Optional[datetime] = None
    verification_status: Optional[EvidenceStatus] = None
    responsible_owner: Optional[str] = None
    verification_notes: Optional[str] = None

class EvidenceSourceResponse(BaseModel):
    id: str
    brand_id: str
    title: str
    source_type: EvidenceType
    url: Optional[str]
    file_path: Optional[str]
    document_text: str
    publication_date: Optional[datetime]
    upload_date: datetime
    expiration_date: Optional[datetime]
    verification_status: EvidenceStatus
    responsible_owner: Optional[str]
    verification_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class BrandFactResponse(BaseModel):
    id: str
    brand_id: str
    claim_statement: str
    category: str
    status: FactStatus
    metric_value: Optional[float]
    metric_unit: Optional[str]
    validity_start: Optional[datetime]
    validity_end: Optional[datetime]
    version: int
    responsible_owner: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    evidence_sources: List[EvidenceSourceResponse] = []
    dependent_asset_count: int = 0
    class Config:
        from_attributes = True

class BrandRuleCreate(BaseModel):
    rule_code: str
    name: str
    rule_type: RuleType
    check_pattern: str
    failure_message: str
    severity: Severity = Severity.HIGH
    is_active: bool = True

class BrandRuleResponse(BrandRuleCreate):
    id: str
    brand_id: str
    created_at: datetime
    class Config:
        from_attributes = True

# ----------------- Assets & Revisions -----------------
class AssetCreate(BaseModel):
    title: str
    asset_type: AssetType = AssetType.LANDING_PAGE
    campaign_name: Optional[str] = "General"
    content_text: str

class RevisionCreate(BaseModel):
    content_text: str
    change_summary: Optional[str] = None

class RevisionResponse(BaseModel):
    id: str
    asset_id: str
    revision_number: int
    content_text: str
    change_summary: Optional[str]
    author_id: str
    author_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class AssetResponse(BaseModel):
    id: str
    organization_id: str
    brand_id: str
    title: str
    asset_type: AssetType
    campaign_name: Optional[str]
    current_revision_id: Optional[str]
    status: AssetStatus
    author_id: str
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    latest_content: Optional[str] = None
    latest_revision_number: Optional[int] = None
    class Config:
        from_attributes = True

# ----------------- Audits, Findings & Citations -----------------
class AuditFindingResponse(BaseModel):
    id: str
    audit_run_id: str
    claim_id: Optional[str]
    rule_id: Optional[str]
    fact_id: Optional[str]
    evidence_id: Optional[str]
    category: FindingCategory
    severity: Severity
    explanation: str
    suggested_correction: Optional[str]
    exact_citation_text: Optional[str]
    rule_name: Optional[str] = None
    fact_statement: Optional[str] = None
    evidence_title: Optional[str] = None
    evidence_status: Optional[str] = None
    claim_text: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ExtractedClaimResponse(BaseModel):
    id: str
    revision_id: str
    claim_text: str
    claim_type: str
    extracted_value: Optional[float]
    unit: Optional[str]
    matched_fact_id: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class AuditRunResponse(BaseModel):
    id: str
    revision_id: str
    run_by_user_id: Optional[str]
    status: AuditStatus
    total_claims: int
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    is_simulated: bool
    execution_ms: float
    created_at: datetime
    findings: List[AuditFindingResponse] = []
    claims: List[ExtractedClaimResponse] = []
    class Config:
        from_attributes = True

# ----------------- Traceability Lineage -----------------
class TraceabilityChainResponse(BaseModel):
    asset_id: str
    asset_title: str
    revision_id: str
    revision_number: int
    claim_id: Optional[str]
    claim_text: Optional[str]
    finding_id: str
    finding_category: FindingCategory
    finding_severity: Severity
    finding_explanation: str
    suggested_correction: Optional[str]
    rule_id: Optional[str]
    rule_code: Optional[str]
    rule_name: Optional[str]
    fact_id: Optional[str]
    fact_statement: Optional[str]
    fact_status: Optional[str]
    evidence_id: Optional[str]
    evidence_title: Optional[str]
    evidence_type: Optional[str]
    evidence_status: Optional[str]
    exact_passage: Optional[str]
    latest_reviewer_id: Optional[str]
    latest_reviewer_name: Optional[str]
    latest_decision: Optional[str]
    latest_decision_reason: Optional[str]

# ----------------- Review Queue & Maker-Checker -----------------
class ApprovalDecisionRequest(BaseModel):
    decision: ApprovalDecision
    decision_reason: str = Field(..., min_length=5, description="Mandatory reason for audit decision")

class ApprovalRecordResponse(BaseModel):
    id: str
    asset_id: str
    revision_id: str
    audit_run_id: Optional[str]
    reviewer_id: str
    reviewer_name: Optional[str] = None
    decision: ApprovalDecision
    decision_reason: str
    separation_of_duties_verified: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ReviewQueueItem(BaseModel):
    asset_id: str
    title: str
    asset_type: AssetType
    campaign_name: Optional[str]
    status: AssetStatus
    author_id: str
    author_name: str
    current_revision_id: str
    revision_number: int
    audit_status: Optional[AuditStatus] = None
    critical_findings: int = 0
    high_findings: int = 0
    medium_findings: int = 0
    submitted_at: datetime

# ----------------- Brand Time Machine -----------------
class DiffChunk(BaseModel):
    type: str # "equal", "add", "remove"
    text: str

class ClaimDiffItem(BaseModel):
    claim_text: str
    status: str # "added", "removed", "persisted", "modified"
    old_value: Optional[float] = None
    new_value: Optional[float] = None

class FindingDiffItem(BaseModel):
    category: FindingCategory
    severity: Severity
    explanation: str
    status: str # "new_finding", "resolved", "persisted"

class TimeMachineComparisonResponse(BaseModel):
    base_revision_id: str
    base_revision_number: int
    target_revision_id: str
    target_revision_number: int
    text_diff: List[DiffChunk]
    claims_diff: List[ClaimDiffItem]
    findings_diff: List[FindingDiffItem]
    base_audit_status: Optional[AuditStatus]
    target_audit_status: Optional[AuditStatus]
    is_approval_valid: bool
    re_review_required: bool
    ai_generated_explanation: Optional[str] = None

# ----------------- Brand Impact Map -----------------
class GraphNode(BaseModel):
    id: str
    label: str
    type: EntityType # FACT, EVIDENCE, RULE, ASSET, CLAIM, FINDING
    status: Optional[str] = None
    severity: Optional[str] = None
    category: Optional[str] = None
    meta: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: str
    is_confirmed: bool = True
    weight: float = 1.0

class ImpactGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int

class AffectedAssetDetail(BaseModel):
    asset_id: str
    asset_title: str
    asset_type: AssetType
    campaign: Optional[str]
    impact_level: Severity
    dependency_type: str # "DIRECT_CLAIM", "EVIDENCE_EXPIRY", "RULE_GOVERNANCE"
    reason: str
    action_required: str

class ImpactAnalysisResponse(BaseModel):
    root_entity_id: str
    root_entity_type: EntityType
    direct_affected_count: int
    indirect_affected_count: int
    affected_assets: List[AffectedAssetDetail]
    blast_radius_score: float # 0 to 100

# ----------------- What-If Simulator -----------------
class WhatIfScenarioCreate(BaseModel):
    title: str
    description: Optional[str] = None
    change_type: ScenarioChangeType
    target_entity_id: str
    proposed_payload: Dict[str, Any]

class WhatIfScenarioResponse(BaseModel):
    id: str
    brand_id: str
    title: str
    description: Optional[str]
    change_type: ScenarioChangeType
    target_entity_id: str
    proposed_payload_json: Dict[str, Any]
    status: ScenarioStatus
    created_at: datetime
    latest_result: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class ScenarioSimulationResponse(BaseModel):
    scenario_id: str
    status: ScenarioStatus
    baseline_non_compliant_assets: int
    projected_non_compliant_assets: int
    net_new_violations: int
    affected_assets_count: int
    affected_assets: List[AffectedAssetDetail]
    risk_summary: str
    suggested_actions: List[str]
    simulated_findings: List[Dict[str, Any]]

# ----------------- Overview Dashboard -----------------
class DashboardOverviewResponse(BaseModel):
    total_brands: int
    total_facts: int
    total_evidence_sources: int
    total_assets: int
    pending_reviews_count: int
    compliant_assets_count: int
    non_compliant_assets_count: int
    expired_evidence_count: int
    recent_audits: List[AuditRunResponse] = []
    high_risk_assets: List[AffectedAssetDetail] = []

# ----------------- Campaigns & Governance Analytics -----------------
class CampaignAssetSummary(BaseModel):
    asset_id: str
    title: str
    asset_type: AssetType
    status: AssetStatus
    revision_number: int

class CampaignItem(BaseModel):
    campaign_name: str
    total_assets: int
    compliant_assets: int
    pending_assets: int
    non_compliant_assets: int
    compliance_score: float
    risk_level: Severity
    target_deadline: Optional[str] = None
    assets: List[CampaignAssetSummary] = []

class GovernanceReportsResponse(BaseModel):
    compliance_rate: float
    evidence_health_score: float
    total_audits_completed: int
    avg_turnaround_hours: float
    findings_by_severity: Dict[str, int]
    findings_by_category: Dict[str, int]
    campaigns_analyzed: int
    active_rules_count: int

# ----------------- Round 3: Multi-Modal Bounding Box & Provenance -----------------
class BoundingBoxCoordinates(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float
    page_width: float = 612.0
    page_height: float = 792.0

class VisualPassageItem(BaseModel):
    passage_id: str
    page_num: int
    text: str
    bounding_box: BoundingBoxCoordinates
    confidence: Optional[float] = 1.0

class VisualDocumentResponse(BaseModel):
    evidence_id: str
    title: str
    source_type: str
    total_pages: int
    passages: List[VisualPassageItem]
    document_text: str

class HybridRetrievalRequest(BaseModel):
    query: str
    top_k: int = 5
    dense_weight: float = 0.65

class HybridRetrievalResponse(BaseModel):
    query: str
    latency_ms: float
    is_sub_400ms: bool
    total_passages_indexed: int
    results: List[Dict[str, Any]]

class AdversarialBenchmarkResponse(BaseModel):
    benchmark_title: str
    total_samples: int
    valid_samples: int
    adversarial_samples: int
    metrics: Dict[str, Any]
    acceptance_criteria_results: Dict[str, str]
    sample_results: List[Dict[str, Any]]

# ----------------- Round 3: Automated Blast-Radius & Cascade -----------------
class CascadeTriggerRequest(BaseModel):
    fact_id: str
    action: str = "DEPRECATED" # DEPRECATED, MODIFIED_METRIC, EXPIRED
    new_metric_value: Optional[float] = None
    reason: Optional[str] = None

class CascadeTriggerResponse(BaseModel):
    cascade_id: str
    timestamp: str
    target_fact_id: str
    target_fact_claim: str
    trigger_action: str
    total_execution_ms: float
    immediate_revocation_ms: float
    acceptance_criteria_met: Dict[str, Any]
    affected_assets_count: int
    revoked_assets: List[Dict[str, Any]]
    re_audit_diff_reports: List[Dict[str, Any]]
    dispatched_webhook: Dict[str, Any]

# ----------------- Round 3: Cryptographic WORM Ledger & Multi-Tenancy -----------------
class WormLedgerBlockResponse(BaseModel):
    index: int
    timestamp: str
    event_type: str
    entity_type: str
    entity_id: str
    actor_name: str
    description: str
    previous_hash: str
    entry_hash: str
    signature: str
    metadata: Optional[Dict[str, Any]] = None

class WormVerificationResponse(BaseModel):
    is_valid: bool
    tamper_detected: bool
    blocks_verified: int
    merkle_root: str
    merkle_tree_depth: int
    verification_latency_ms: float
    is_sub_second: bool
    cryptographic_algorithm: str
    regulatory_status: str

class TenantOrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    brand_count: int
    asset_count: int
    active_framework: str

class TenantSwitchRequest(BaseModel):
    organization_id: str

class TenantIsolationVerificationResponse(BaseModel):
    isolation_verified: bool
    leak_rate_pct: float
    total_cross_checks: int
    organizations_tested: List[str]
    isolation_report: Dict[str, Any]

# ----------------- High-Value Enterprise Additions -----------------
class BrandClearanceCertificateResponse(BaseModel):
    certificate_id: str
    asset_id: str
    asset_title: str
    asset_type: str
    revision_number: int
    content_text: str
    content_sha256: str
    attestation_fingerprint: str
    reviewed_by: str
    reviewer_role: str
    decision: str
    decision_reason: str
    separation_of_duties_verified: bool
    is_state_locked: bool
    timestamp_utc: str
    governance_framework: str
    cited_facts: List[Dict[str, Any]]
    evidence_lineage: List[Dict[str, Any]]
    immutable_block_reference: str

class EvidenceConflictItem(BaseModel):
    conflict_id: str
    claim_topic: str
    primary_source_id: str
    primary_source_title: str
    primary_metric: float
    primary_tier: str
    conflicting_source_id: str
    conflicting_source_title: str
    conflicting_metric: float
    conflicting_tier: str
    variance_pct: float
    detected_discrepancy: str
    recommended_action: str
    status: str

class EvidenceConflictResolutionRequest(BaseModel):
    conflict_id: str
    action: str  # "ENFORCE_TIER_1" or "CREATE_DISCREPANCY_TICKET"
    justification: str

class IntegrationSimulationRequest(BaseModel):
    platform: str  # "github", "figma", "slack"
    asset_id: Optional[str] = None
    event_type: Optional[str] = None

class IntegrationSimulationResponse(BaseModel):
    simulation_id: str
    platform: str
    event_type: str
    timestamp: str
    status: str
    governance_decision: str  # "BLOCKED" or "APPROVED"
    summary_message: str
    raw_payload: Dict[str, Any]
    details: Dict[str, Any]


