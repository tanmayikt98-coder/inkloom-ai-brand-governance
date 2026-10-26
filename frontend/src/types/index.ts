export type UserRole =
  | "ORGANIZATION_ADMIN"
  | "BRAND_MANAGER"
  | "CONTENT_CREATOR"
  | "COMPLIANCE_ANALYST"
  | "REVIEWER_APPROVER"
  | "READ_ONLY_VIEWER"
  | "EVIDENCE_CUSTODIAN"
  | "CAMPAIGN_MANAGER"
  | "SYSTEM_SERVICE";

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  tagline?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type FactStatus = "APPROVED" | "PENDING" | "EXPIRED" | "SUPERSEDED" | "REJECTED";
export type EvidenceStatus = "VERIFIED" | "PENDING" | "EXPIRED" | "SUPERSEDED" | "REJECTED";
export type EvidenceType =
  | "BENCHMARK_REPORT"
  | "CERTIFICATION"
  | "AUDIT_DOCUMENT"
  | "LEGAL_OPINION"
  | "URL_REFERENCE"
  | "TECHNICAL_SPEC";

export interface EvidenceSource {
  id: string;
  brand_id: string;
  title: string;
  source_type: EvidenceType;
  url?: string;
  file_path?: string;
  document_text: string;
  publication_date?: string;
  upload_date: string;
  expiration_date?: string;
  verification_status: EvidenceStatus;
  responsible_owner?: string;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandFact {
  id: string;
  brand_id: string;
  claim_statement: string;
  category: string;
  status: FactStatus;
  metric_value?: number;
  metric_unit?: string;
  validity_start?: string;
  validity_end?: string;
  version: number;
  responsible_owner?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  evidence_sources: EvidenceSource[];
  dependent_asset_count: number;
}

export type RuleType = "FORBIDDEN_KEYWORD" | "REQUIRED_DISCLAIMER" | "NUMERIC_THRESHOLD" | "REGEX_PATTERN" | "TONE_VOICE";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface BrandRule {
  id: string;
  brand_id: string;
  rule_code: string;
  name: string;
  rule_type: RuleType;
  check_pattern: string;
  failure_message: string;
  severity: Severity;
  is_active: boolean;
  created_at: string;
}

export type AssetType =
  | "LANDING_PAGE"
  | "ADVERTISEMENT"
  | "SOCIAL_POST"
  | "EMAIL_CAMPAIGN"
  | "PRODUCT_DESCRIPTION"
  | "CAMPAIGN_BRIEF";

export type AssetStatus = "DRAFT" | "AUDITED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export interface MarketingAsset {
  id: string;
  organization_id: string;
  brand_id: string;
  title: string;
  asset_type: AssetType;
  campaign_name?: string;
  current_revision_id?: string;
  status: AssetStatus;
  author_id: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
  latest_content?: string;
  latest_revision_number?: number;
}

export interface AssetRevision {
  id: string;
  asset_id: string;
  revision_number: number;
  content_text: string;
  change_summary?: string;
  author_id: string;
  author_name?: string;
  created_at: string;
}

export type FindingCategory =
  | "SUPPORTED"
  | "UNSUPPORTED"
  | "CONTRADICTED"
  | "NEEDS_HUMAN_VERIFICATION"
  | "EXPIRED_EVIDENCE"
  | "MISSING_DISCLOSURE"
  | "BRAND_GUIDELINE_VIOLATION"
  | "INSUFFICIENT_EVIDENCE";

export type AuditStatus = "COMPLIANT" | "NON_COMPLIANT" | "NEEDS_REVIEW" | "INSUFFICIENT_EVIDENCE";

export interface AuditFinding {
  id: string;
  audit_run_id: string;
  claim_id?: string;
  rule_id?: string;
  fact_id?: string;
  evidence_id?: string;
  category: FindingCategory;
  severity: Severity;
  explanation: string;
  suggested_correction?: string;
  exact_citation_text?: string;
  rule_name?: string;
  fact_statement?: string;
  evidence_title?: string;
  evidence_status?: string;
  claim_text?: string;
  created_at: string;
}

export interface ExtractedClaim {
  id: string;
  revision_id: string;
  claim_text: string;
  claim_type: string;
  extracted_value?: number;
  unit?: string;
  matched_fact_id?: string;
  created_at: string;
}

export interface AuditRun {
  id: string;
  revision_id: string;
  run_by_user_id?: string;
  status: AuditStatus;
  total_claims: number;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  is_simulated: boolean;
  execution_ms: number;
  created_at: string;
  findings: AuditFinding[];
  claims: ExtractedClaim[];
}

export interface ReviewQueueItem {
  asset_id: string;
  title: string;
  asset_type: AssetType;
  campaign_name?: string;
  status: AssetStatus;
  author_id: string;
  author_name: string;
  current_revision_id: string;
  revision_number: number;
  audit_status?: AuditStatus;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  submitted_at: string;
}

export type ApprovalDecision = "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export interface ApprovalRecord {
  id: string;
  asset_id: string;
  revision_id: string;
  audit_run_id?: string;
  reviewer_id: string;
  reviewer_name?: string;
  decision: ApprovalDecision;
  decision_reason: string;
  separation_of_duties_verified: boolean;
  created_at: string;
}

export interface DiffChunk {
  type: "equal" | "add" | "remove";
  text: string;
}

export interface ClaimDiffItem {
  claim_text: string;
  status: "added" | "removed" | "persisted" | "modified";
  old_value?: number;
  new_value?: number;
}

export interface FindingDiffItem {
  category: FindingCategory;
  severity: Severity;
  explanation: string;
  status: "new_finding" | "resolved" | "persisted";
}

export interface TimeMachineComparison {
  base_revision_id: string;
  base_revision_number: number;
  target_revision_id: string;
  target_revision_number: number;
  text_diff: DiffChunk[];
  claims_diff: ClaimDiffItem[];
  findings_diff: FindingDiffItem[];
  base_audit_status?: AuditStatus;
  target_audit_status?: AuditStatus;
  is_approval_valid: boolean;
  re_review_required: boolean;
  ai_generated_explanation?: string;
}

export type EntityType = "FACT" | "EVIDENCE" | "RULE" | "ASSET" | "CLAIM" | "FINDING" | "DECISION";

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  status?: string;
  severity?: string;
  category?: string;
  meta: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  is_confirmed: boolean;
  weight: number;
}

export interface ImpactGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface AffectedAssetDetail {
  asset_id: string;
  asset_title: string;
  asset_type: AssetType;
  campaign?: string;
  impact_level: Severity;
  dependency_type: string;
  reason: string;
  action_required: string;
}

export interface ImpactAnalysis {
  root_entity_id: string;
  root_entity_type: EntityType;
  direct_affected_count: number;
  indirect_affected_count: number;
  affected_assets: AffectedAssetDetail[];
  blast_radius_score: number;
}

export type ScenarioChangeType =
  | "UPDATE_FACT_METRIC"
  | "EXPIRE_EVIDENCE"
  | "ADD_RESTRICTED_PHRASE"
  | "ADD_MANDATORY_DISCLAIMER"
  | "RETIRE_FACT";

export type ScenarioStatus = "DRAFT" | "SIMULATED" | "PROMOTED" | "DISCARDED";

export interface WhatIfScenario {
  id: string;
  brand_id: string;
  title: string;
  description?: string;
  change_type: ScenarioChangeType;
  target_entity_id: string;
  proposed_payload_json: Record<string, any>;
  status: ScenarioStatus;
  created_at: string;
  latest_result?: {
    baseline_non_compliant_count: number;
    projected_non_compliant_count: number;
    affected_assets_count: number;
    summary_narrative: string;
  };
}

export interface ScenarioSimulationResult {
  scenario_id: string;
  status: ScenarioStatus;
  baseline_non_compliant_assets: number;
  projected_non_compliant_assets: number;
  net_new_violations: number;
  affected_assets_count: number;
  affected_assets: AffectedAssetDetail[];
  risk_summary: string;
  suggested_actions: string[];
  simulated_findings: any[];
}

export interface DashboardOverview {
  total_brands: number;
  total_facts: number;
  total_evidence_sources: number;
  total_assets: number;
  pending_reviews_count: number;
  compliant_assets_count: number;
  non_compliant_assets_count: number;
  expired_evidence_count: number;
  recent_audits: AuditRun[];
  high_risk_assets: AffectedAssetDetail[];
}

export interface TraceabilityChain {
  asset_id: string;
  asset_title: string;
  revision_id: string;
  revision_number: number;
  claim_id?: string;
  claim_text?: string;
  finding_id: string;
  finding_category: FindingCategory;
  finding_severity: Severity;
  finding_explanation: string;
  suggested_correction?: string;
  rule_id?: string;
  rule_code?: string;
  rule_name?: string;
  fact_id?: string;
  fact_statement?: string;
  fact_status?: string;
  evidence_id?: string;
  evidence_title?: string;
  evidence_type?: string;
  evidence_status?: string;
  exact_passage?: string;
  latest_reviewer_id?: string;
  latest_reviewer_name?: string;
  latest_decision?: string;
  latest_decision_reason?: string;
}

export interface AuditEventItem {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CampaignAssetSummary {
  asset_id: string;
  title: string;
  asset_type: AssetType;
  status: AssetStatus;
  revision_number: number;
}

export interface CampaignItem {
  campaign_name: string;
  total_assets: number;
  compliant_assets: number;
  pending_assets: number;
  non_compliant_assets: number;
  compliance_score: number;
  risk_level: Severity;
  target_deadline?: string;
  assets: CampaignAssetSummary[];
}

export interface GovernanceReportsResponse {
  compliance_rate: number;
  evidence_health_score: number;
  total_audits_completed: number;
  avg_turnaround_hours: number;
  findings_by_severity: Record<string, number>;
  findings_by_category: Record<string, number>;
  campaigns_analyzed: number;
  active_rules_count: number;
}

