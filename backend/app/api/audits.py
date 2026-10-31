import time
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import (
    AssetRevision, MarketingAsset, Brand, BrandFact, BrandRule, EvidenceSource,
    FactEvidenceLink, ExtractedClaim, AuditRun, AuditFinding, User, AuditEvent, ApprovalRecord
)
from app.enums import (
    UserRole, AuditStatus, FindingCategory, Severity, AssetStatus, FactStatus, EvidenceStatus
)
from app.security import get_current_user, require_roles
from app.schemas import (
    AuditRunResponse, AuditFindingResponse, ExtractedClaimResponse, TraceabilityChainResponse
)
from app.services.claim_engine import ClaimExtractionEngine
from app.services.rule_engine import DeterministicRuleEngine

router = APIRouter(tags=["Evidence-Driven Content Audit & Traceability"])

@router.post("/revisions/{revision_id}/audit", response_model=AuditRunResponse)
async def run_content_audit(
    revision_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    start_time = time.time()

    # 1. Fetch revision, asset, brand, rules, and facts
    rev_res = await db.execute(
        select(AssetRevision)
        .join(MarketingAsset, AssetRevision.asset_id == MarketingAsset.id)
        .where(
            AssetRevision.id == revision_id,
            MarketingAsset.organization_id == current_user.organization_id
        )
        .options(selectinload(AssetRevision.asset))
    )
    revision = rev_res.scalars().first()
    if not revision:
        raise HTTPException(status_code=404, detail="Asset revision not found.")

    brand_id = revision.asset.brand_id

    # Fetch active brand rules
    rules_res = await db.execute(
        select(BrandRule).where(BrandRule.brand_id == brand_id, BrandRule.is_active == True)
    )
    rules = rules_res.scalars().all()

    # Fetch brand facts with linked evidence
    facts_res = await db.execute(
        select(BrandFact)
        .where(BrandFact.brand_id == brand_id)
        .options(selectinload(BrandFact.evidence_links).selectinload(FactEvidenceLink.evidence))
    )
    facts = facts_res.scalars().all()

    # 2. Extract Claims from content
    extracted_claims_data = await ClaimExtractionEngine.extract_claims(revision.content_text, facts)

    # Save extracted claims
    db_claims: List[ExtractedClaim] = []
    for cd in extracted_claims_data:
        claim_obj = ExtractedClaim(
            revision_id=revision.id,
            claim_text=cd.claim_text,
            claim_type=cd.claim_type,
            extracted_value=cd.extracted_value,
            unit=cd.unit,
            matched_fact_id=cd.matched_fact_id
        )
        db.add(claim_obj)
        db_claims.append(claim_obj)
    await db.flush()

    # 3. Deterministic Evaluation
    findings_to_create: List[AuditFinding] = []
    critical_c = 0
    high_c = 0
    med_c = 0
    low_c = 0

    # A. Check general brand rules (prohibited phrases, mandatory disclaimers, tone)
    rule_results = DeterministicRuleEngine.evaluate_rules(revision.content_text, rules)
    for rr in rule_results:
        finding = AuditFinding(
            rule_id=rr.rule_id,
            category=rr.category,
            severity=rr.severity,
            explanation=rr.explanation,
            suggested_correction=rr.suggested_correction,
            exact_citation_text=rr.exact_citation_text
        )
        findings_to_create.append(finding)
        if rr.severity == Severity.CRITICAL:
            critical_c += 1
        elif rr.severity == Severity.HIGH:
            high_c += 1
        elif rr.severity == Severity.MEDIUM:
            med_c += 1
        else:
            low_c += 1

    # Adversarial Injection & Prompt Jailbreak Protection
    adversarial_patterns = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"system\s+prompt\s*:",
        r"override\s+(compliance|rules|governance)",
        r"grant\s+(full\s+)?approval",
        r"<script.*?>.*?</script>",
        r"sudo\s+approve",
        r"bypass\s+maker-checker",
    ]
    for pat in adversarial_patterns:
        if re.search(pat, revision.content_text, re.IGNORECASE):
            findings_to_create.append(AuditFinding(
                category=FindingCategory.BRAND_GUIDELINE_VIOLATION,
                severity=Severity.CRITICAL,
                explanation="ADVERSARIAL INJECTION DETECTED: Copy attempts prompt injection or unauthorized governance override. Content quarantined.",
                suggested_correction="Sanitize input text and remove instructional prompt tampering phrases.",
                exact_citation_text="Security Protocol: SEC-ADVERSARIAL-SHIELD"
            ))
            critical_c += 1
            break

    # B. Check extracted claims against facts and evidence
    for claim in db_claims:
        if claim.matched_fact_id:
            matched_fact = next((f for f in facts if f.id == claim.matched_fact_id), None)
            if matched_fact:
                f_res = DeterministicRuleEngine.verify_claim_against_fact(
                    claim.claim_text,
                    claim.extracted_value,
                    claim.unit,
                    matched_fact
                )
                finding = AuditFinding(
                    claim_id=claim.id,
                    fact_id=f_res.fact_id,
                    evidence_id=f_res.evidence_id,
                    category=f_res.category,
                    severity=f_res.severity,
                    explanation=f_res.explanation,
                    suggested_correction=f_res.suggested_correction,
                    exact_citation_text=f_res.exact_citation_text
                )
                findings_to_create.append(finding)
                if f_res.severity == Severity.CRITICAL:
                    critical_c += 1
                elif f_res.severity == Severity.HIGH:
                    high_c += 1
                elif f_res.severity == Severity.MEDIUM:
                    med_c += 1
                else:
                    low_c += 1
        else:
            # Factual claim made with zero substantiating facts on file!
            finding = AuditFinding(
                claim_id=claim.id,
                category=FindingCategory.INSUFFICIENT_EVIDENCE,
                severity=Severity.HIGH,
                explanation=f"Measurable claim '{claim.claim_text}' has no verified fact or evidence record registered in Brand Knowledge Hub.",
                suggested_correction="Register supporting benchmark or technical report before claiming in customer collateral.",
                exact_citation_text="No substantiating evidence found"
            )
            findings_to_create.append(finding)
            high_c += 1

    # 4. Determine overall audit status
    if critical_c > 0 or high_c > 0:
        overall_status = AuditStatus.NON_COMPLIANT
    elif med_c > 0:
        overall_status = AuditStatus.NEEDS_REVIEW
    else:
        overall_status = AuditStatus.COMPLIANT

    exec_ms = round((time.time() - start_time) * 1000, 2)

    # 5. Save AuditRun
    audit_run = AuditRun(
        revision_id=revision.id,
        run_by_user_id=current_user.id,
        status=overall_status,
        total_claims=len(db_claims),
        total_findings=len(findings_to_create),
        critical_count=critical_c,
        high_count=high_c,
        medium_count=med_c,
        low_count=low_c,
        is_simulated=False,
        execution_ms=exec_ms
    )
    db.add(audit_run)
    await db.flush()

    for f in findings_to_create:
        f.audit_run_id = audit_run.id
        db.add(f)
    await db.flush()

    # Update asset status
    revision.asset.status = AssetStatus.AUDITED
    revision.asset.updated_at = datetime.utcnow()

    # Log audit event
    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="AUDIT_EXECUTED",
        entity_type="AuditRun",
        entity_id=audit_run.id,
        description=f"Audit completed for '{revision.asset.title}' (v{revision.revision_number}). Verdict: {overall_status.value} ({critical_c} Critical, {high_c} High).",
        metadata_json={
            "status": overall_status.value,
            "critical": critical_c,
            "high": high_c,
            "total_findings": len(findings_to_create),
            "execution_ms": exec_ms
        }
    )
    db.add(event)
    await db.commit()

    return await get_audit_run_response(audit_run.id, db)

@router.get("/revisions/{revision_id}/latest-audit", response_model=Optional[AuditRunResponse])
async def get_latest_audit(
    revision_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AuditRun)
        .where(AuditRun.revision_id == revision_id)
        .order_by(AuditRun.created_at.desc())
    )
    audit = result.scalars().first()
    if not audit:
        return None
    return await get_audit_run_response(audit.id, db)

async def get_audit_run_response(audit_id: str, db: AsyncSession) -> AuditRunResponse:
    res = await db.execute(
        select(AuditRun)
        .where(AuditRun.id == audit_id)
        .options(
            selectinload(AuditRun.findings).selectinload(AuditFinding.rule),
            selectinload(AuditRun.findings).selectinload(AuditFinding.fact),
            selectinload(AuditRun.findings).selectinload(AuditFinding.evidence),
            selectinload(AuditRun.findings).selectinload(AuditFinding.claim),
            selectinload(AuditRun.revision).selectinload(AssetRevision.claims)
        )
    )
    audit = res.scalars().first()

    findings_resp = []
    for f in audit.findings:
        findings_resp.append(AuditFindingResponse(
            id=f.id,
            audit_run_id=f.audit_run_id,
            claim_id=f.claim_id,
            rule_id=f.rule_id,
            fact_id=f.fact_id,
            evidence_id=f.evidence_id,
            category=f.category,
            severity=f.severity,
            explanation=f.explanation,
            suggested_correction=f.suggested_correction,
            exact_citation_text=f.exact_citation_text,
            rule_name=f.rule.name if f.rule else None,
            fact_statement=f.fact.claim_statement if f.fact else None,
            evidence_title=f.evidence.title if f.evidence else None,
            evidence_status=f.evidence.verification_status.value if f.evidence else None,
            claim_text=f.claim.claim_text if f.claim else None,
            created_at=f.created_at
        ))

    claims_resp = [
        ExtractedClaimResponse.model_validate(c)
        for c in (audit.revision.claims if audit.revision else [])
    ]

    return AuditRunResponse(
        id=audit.id,
        revision_id=audit.revision_id,
        run_by_user_id=audit.run_by_user_id,
        status=audit.status,
        total_claims=audit.total_claims,
        total_findings=audit.total_findings,
        critical_count=audit.critical_count,
        high_count=audit.high_count,
        medium_count=audit.medium_count,
        low_count=audit.low_count,
        is_simulated=audit.is_simulated,
        execution_ms=audit.execution_ms,
        created_at=audit.created_at,
        findings=findings_resp,
        claims=claims_resp
    )

@router.get("/traceability/{finding_id}", response_model=TraceabilityChainResponse)
async def get_finding_traceability_chain(
    finding_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Module 3 Citations & Traceability:
    Provides complete end-to-end chain:
    Marketing Claim -> Audit Finding -> Brand Rule -> Evidence Source -> Reviewer Decision -> Content Revision
    """
    res = await db.execute(
        select(AuditFinding)
        .where(AuditFinding.id == finding_id)
        .options(
            selectinload(AuditFinding.claim),
            selectinload(AuditFinding.rule),
            selectinload(AuditFinding.fact),
            selectinload(AuditFinding.evidence),
            selectinload(AuditFinding.audit_run).selectinload(AuditRun.revision).selectinload(AssetRevision.asset).selectinload(MarketingAsset.approval_records).selectinload(ApprovalRecord.reviewer)
        )
    )
    f = res.scalars().first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found.")

    rev = f.audit_run.revision
    asset = rev.asset

    latest_appr = asset.approval_records[-1] if asset.approval_records else None

    return TraceabilityChainResponse(
        asset_id=asset.id,
        asset_title=asset.title,
        revision_id=rev.id,
        revision_number=rev.revision_number,
        claim_id=f.claim_id,
        claim_text=f.claim.claim_text if f.claim else None,
        finding_id=f.id,
        finding_category=f.category,
        finding_severity=f.severity,
        finding_explanation=f.explanation,
        suggested_correction=f.suggested_correction,
        rule_id=f.rule_id,
        rule_code=f.rule.rule_code if f.rule else None,
        rule_name=f.rule.name if f.rule else None,
        fact_id=f.fact_id,
        fact_statement=f.fact.claim_statement if f.fact else None,
        fact_status=f.fact.status.value if f.fact else None,
        evidence_id=f.evidence_id,
        evidence_title=f.evidence.title if f.evidence else None,
        evidence_type=f.evidence.source_type.value if f.evidence else None,
        evidence_status=f.evidence.verification_status.value if f.evidence else None,
        exact_passage=f.exact_citation_text or (f.evidence.document_text[:120] if f.evidence else None),
        latest_reviewer_id=latest_appr.reviewer_id if latest_appr else None,
        latest_reviewer_name=latest_appr.reviewer.full_name if (latest_appr and latest_appr.reviewer) else None,
        latest_decision=latest_appr.decision.value if latest_appr else None,
        latest_decision_reason=latest_appr.decision_reason if latest_appr else None
    )
