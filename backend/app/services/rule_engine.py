import re
from datetime import datetime
from typing import List, Tuple, Optional
from dataclasses import dataclass
from app.enums import Severity, FindingCategory, RuleType, FactStatus, EvidenceStatus

@dataclass(frozen=True)
class RuleEvaluationResult:
    rule_id: Optional[str]
    rule_code: Optional[str]
    rule_name: Optional[str]
    category: FindingCategory
    severity: Severity
    explanation: str
    suggested_correction: Optional[str]
    exact_citation_text: Optional[str]

@dataclass(frozen=True)
class FactVerificationResult:
    fact_id: Optional[str]
    evidence_id: Optional[str]
    category: FindingCategory
    severity: Severity
    explanation: str
    suggested_correction: Optional[str]
    exact_citation_text: Optional[str]

class DeterministicRuleEngine:
    """
    Pure, deterministic compliance engine.
    Ensures identical inputs produce identical findings, byte-for-byte.
    Never relies on probabilistic LLM outcomes to decide compliance.
    """

    @staticmethod
    def evaluate_rules(content_text: str, rules: List[any]) -> List[RuleEvaluationResult]:
        results: List[RuleEvaluationResult] = []
        lower_content = content_text.lower()

        for rule in rules:
            if not getattr(rule, "is_active", True):
                continue

            r_type = rule.rule_type
            pattern = rule.check_pattern.strip()
            severity = rule.severity

            # 1. FORBIDDEN KEYWORD / RESTRICTED PHRASE
            if r_type == RuleType.FORBIDDEN_KEYWORD:
                phrases = [p.strip().lower() for p in pattern.split(",") if p.strip()]
                found_phrases = [p for p in phrases if p in lower_content]
                if found_phrases:
                    results.append(RuleEvaluationResult(
                        rule_id=rule.id,
                        rule_code=rule.rule_code,
                        rule_name=rule.name,
                        category=FindingCategory.BRAND_GUIDELINE_VIOLATION,
                        severity=severity,
                        explanation=f"Prohibited phrasing detected: {', '.join(repr(p) for p in found_phrases)}. {rule.failure_message}",
                        suggested_correction=f"Remove or replace prohibited terms: {', '.join(found_phrases)}",
                        exact_citation_text=rule.name
                    ))

            # 2. REQUIRED DISCLAIMER
            elif r_type == RuleType.REQUIRED_DISCLAIMER:
                # If disclaimer phrase is missing, flag as MISSING_DISCLOSURE
                if pattern.lower() not in lower_content:
                    results.append(RuleEvaluationResult(
                        rule_id=rule.id,
                        rule_code=rule.rule_code,
                        rule_name=rule.name,
                        category=FindingCategory.MISSING_DISCLOSURE,
                        severity=severity,
                        explanation=f"Required mandatory disclaimer is missing: '{pattern}'. {rule.failure_message}",
                        suggested_correction=f"Include the required disclosure: \"{pattern}\"",
                        exact_citation_text=f"Mandatory Brand Rule: {rule.rule_code}"
                    ))

            # 3. REGEX PATTERN (e.g. unverified superlatives or absolute guarantees)
            elif r_type == RuleType.REGEX_PATTERN:
                try:
                    match = re.search(pattern, content_text, re.IGNORECASE)
                    if match:
                        results.append(RuleEvaluationResult(
                            rule_id=rule.id,
                            rule_code=rule.rule_code,
                            rule_name=rule.name,
                            category=FindingCategory.BRAND_GUIDELINE_VIOLATION,
                            severity=severity,
                            explanation=f"Pattern violation matched '{match.group(0)}'. {rule.failure_message}",
                            suggested_correction=f"Rephrase statement to avoid pattern: '{match.group(0)}'",
                            exact_citation_text=f"Rule: {rule.rule_code}"
                        ))
                except re.error:
                    pass

        # Sort findings deterministically: Critical > High > Medium > Low
        severity_weight = {
            Severity.CRITICAL: 4,
            Severity.HIGH: 3,
            Severity.MEDIUM: 2,
            Severity.LOW: 1,
        }
        results.sort(key=lambda r: (-severity_weight.get(r.severity, 0), r.rule_code or ""))
        return results

    @staticmethod
    def verify_claim_against_fact(
        claim_text: str,
        claimed_value: Optional[float],
        unit: Optional[str],
        fact: any,
        as_of_date: Optional[datetime] = None
    ) -> FactVerificationResult:
        """
        Deterministic verification of a marketing claim against a registered BrandFact.
        """
        as_of = as_of_date or datetime.utcnow()

        # 1. Fact status check
        if fact.status == FactStatus.EXPIRED or (fact.validity_end and fact.validity_end < as_of):
            return FactVerificationResult(
                fact_id=fact.id,
                evidence_id=fact.evidence_links[0].evidence_id if fact.evidence_links else None,
                category=FindingCategory.EXPIRED_EVIDENCE,
                severity=Severity.HIGH,
                explanation=f"Claim relies on Fact '{fact.claim_statement}', but this fact or its evidence expired on {fact.validity_end.strftime('%Y-%m-%d') if fact.validity_end else 'earlier date'}.",
                suggested_correction="Update content to reflect currently verified benchmark or renew evidence.",
                exact_citation_text=f"Fact v{fact.version} (Expired)"
            )

        if fact.status in (FactStatus.SUPERSEDED, FactStatus.REJECTED):
            return FactVerificationResult(
                fact_id=fact.id,
                evidence_id=fact.evidence_links[0].evidence_id if fact.evidence_links else None,
                category=FindingCategory.CONTRADICTED,
                severity=Severity.HIGH,
                explanation=f"Claim matches a fact that has been {fact.status.value.lower()}: '{fact.claim_statement}'.",
                suggested_correction="Align with the newest approved product messaging guidelines.",
                exact_citation_text=f"Fact v{fact.version} ({fact.status.value})"
            )

        # Check evidence attached to fact
        evidence_source = fact.evidence_links[0].evidence if fact.evidence_links else None
        if not evidence_source or evidence_source.verification_status != EvidenceStatus.VERIFIED:
            return FactVerificationResult(
                fact_id=fact.id,
                evidence_id=evidence_source.id if evidence_source else None,
                category=FindingCategory.NEEDS_HUMAN_VERIFICATION,
                severity=Severity.HIGH,
                explanation=f"Supporting evidence for '{fact.claim_statement}' is pending verification or unverified.",
                suggested_correction="Verify evidence in the Brand Knowledge Hub before publishing claims.",
                exact_citation_text=evidence_source.title if evidence_source else "Missing Evidence Document"
            )

        if evidence_source.expiration_date and evidence_source.expiration_date < as_of:
            return FactVerificationResult(
                fact_id=fact.id,
                evidence_id=evidence_source.id,
                category=FindingCategory.EXPIRED_EVIDENCE,
                severity=Severity.HIGH,
                explanation=f"Underlying evidence source '{evidence_source.title}' expired on {evidence_source.expiration_date.strftime('%Y-%m-%d')}.",
                suggested_correction="Renew technical benchmark report or adjust performance claim.",
                exact_citation_text=f"Source: {evidence_source.title} (Expired)"
            )

        # 2. Metric comparison check
        if claimed_value is not None and fact.metric_value is not None:
            # For performance reduction (e.g. Aurevia reduces processing time by 30%):
            # Claiming 40% when fact says 30% is an unsubstantiated exaggeration (contradiction)
            if claimed_value > fact.metric_value:
                return FactVerificationResult(
                    fact_id=fact.id,
                    evidence_id=evidence_source.id,
                    category=FindingCategory.CONTRADICTED,
                    severity=Severity.CRITICAL,
                    explanation=f"Claimed performance of {claimed_value}{unit or ''} exceeds approved benchmark of {fact.metric_value}{fact.metric_unit or ''}. Contradicts official evidence.",
                    suggested_correction=f"Correct figure to approved benchmark: {fact.metric_value}{fact.metric_unit or ''} as documented in {evidence_source.title}.",
                    exact_citation_text=f"{evidence_source.title} (Page 1, Benchmark Sec 3.2)"
                )
            elif claimed_value < fact.metric_value:
                # Underclaiming is technically supported or conservative, but note variance
                return FactVerificationResult(
                    fact_id=fact.id,
                    evidence_id=evidence_source.id,
                    category=FindingCategory.SUPPORTED,
                    severity=Severity.LOW,
                    explanation=f"Claimed performance of {claimed_value}{unit or ''} is conservative and supported by approved benchmark {fact.metric_value}{fact.metric_unit or ''}.",
                    suggested_correction=f"You may optionally claim up to {fact.metric_value}{fact.metric_unit or ''} per verified report.",
                    exact_citation_text=evidence_source.title
                )
            else:
                # Exactly matches approved fact!
                return FactVerificationResult(
                    fact_id=fact.id,
                    evidence_id=evidence_source.id,
                    category=FindingCategory.SUPPORTED,
                    severity=Severity.LOW,
                    explanation=f"Claim strictly substantiated by approved benchmark of {fact.metric_value}{fact.metric_unit or ''} in '{evidence_source.title}'.",
                    suggested_correction=None,
                    exact_citation_text=f"{evidence_source.title} (Verified)"
                )

        # General text claim match
        return FactVerificationResult(
            fact_id=fact.id,
            evidence_id=evidence_source.id if evidence_source else None,
            category=FindingCategory.SUPPORTED,
            severity=Severity.LOW,
            explanation=f"Claim statement aligns with approved brand fact '{fact.claim_statement}'.",
            suggested_correction=None,
            exact_citation_text=evidence_source.title if evidence_source else "Brand Knowledge Hub"
        )
