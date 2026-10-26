import copy
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.enums import ScenarioChangeType, ScenarioStatus, Severity, FindingCategory, FactStatus, EvidenceStatus, RuleType
from app.services.rule_engine import DeterministicRuleEngine
from app.services.impact_engine import ImpactEngine
from app.schemas import ScenarioSimulationResponse, AffectedAssetDetail

class SimulatorEngine:
    """
    Evaluates proposed brand governance changes in an isolated simulation sandbox.
    Re-runs deterministic rules and dependency graphs without touching production records.
    Provides verified promotion of approved scenarios into production.
    """

    @classmethod
    def simulate_scenario(
        cls,
        scenario_id: str,
        change_type: ScenarioChangeType,
        target_entity_id: str,
        proposed_payload: Dict[str, Any],
        production_facts: List[Any],
        production_evidence: List[Any],
        production_rules: List[Any],
        production_assets: List[Any]
    ) -> ScenarioSimulationResponse:
        """
        Creates an isolated clone of facts, rules, and evidence, applies proposed change,
        and re-runs the deterministic audit engine across all active marketing assets.
        """
        # 1. Baseline analysis: Count existing non-compliant assets
        baseline_non_compliant = sum(
            1 for a in production_assets if a.status in ("NON_COMPLIANT", "REJECTED", "CHANGES_REQUESTED")
        )

        # 2. Construct isolated proposed state
        sim_facts = copy.deepcopy(production_facts)
        sim_evidence = copy.deepcopy(production_evidence)
        sim_rules = copy.deepcopy(production_rules)

        # Apply hypothetical delta
        if change_type == ScenarioChangeType.UPDATE_FACT_METRIC:
            new_metric = proposed_payload.get("metric_value")
            for f in sim_facts:
                if f.id == target_entity_id:
                    f.metric_value = float(new_metric) if new_metric is not None else f.metric_value
                    break

        elif change_type == ScenarioChangeType.EXPIRE_EVIDENCE:
            sim_expiry = datetime(2026, 1, 1) # Force past expiration
            for ev in sim_evidence:
                if ev.id == target_entity_id:
                    ev.expiration_date = sim_expiry
                    ev.verification_status = EvidenceStatus.EXPIRED
                    break

        elif change_type == ScenarioChangeType.ADD_RESTRICTED_PHRASE:
            new_phrase = proposed_payload.get("restricted_phrase", "")
            # Add a synthetic rule to simulated rule set
            synthetic_rule = type('RuleStub', (), {
                'id': 'sim_rule_synthetic',
                'rule_code': 'RULE-SIM-RESTRICT',
                'name': f"Restricted: {new_phrase}",
                'rule_type': RuleType.FORBIDDEN_KEYWORD,
                'check_pattern': new_phrase,
                'failure_message': f"Usage of '{new_phrase}' is strictly restricted under proposed brand policy.",
                'severity': Severity.HIGH,
                'is_active': True
            })()
            sim_rules.append(synthetic_rule)

        elif change_type == ScenarioChangeType.ADD_MANDATORY_DISCLAIMER:
            new_disclaimer = proposed_payload.get("disclaimer_text", "")
            synthetic_disclaimer_rule = type('RuleStub', (), {
                'id': 'sim_rule_disclaimer',
                'rule_code': 'RULE-SIM-DISCLAIM',
                'name': f"Mandatory Disclosure: {new_disclaimer[:30]}",
                'rule_type': RuleType.REQUIRED_DISCLAIMER,
                'check_pattern': new_disclaimer,
                'failure_message': f"All public collateral must contain '{new_disclaimer}'.",
                'severity': Severity.HIGH,
                'is_active': True
            })()
            sim_rules.append(synthetic_disclaimer_rule)

        elif change_type == ScenarioChangeType.RETIRE_FACT:
            for f in sim_facts:
                if f.id == target_entity_id:
                    f.status = FactStatus.SUPERSEDED
                    break

        # 3. Re-evaluate all assets against simulated state
        projected_findings: List[Dict[str, Any]] = []
        affected_asset_details: List[AffectedAssetDetail] = []
        projected_non_compliant_count = 0

        for asset in production_assets:
            content = getattr(asset, "latest_content", "") or ""
            current_rev = next((r for r in getattr(asset, "revisions", []) if r.id == asset.current_revision_id), None)
            if current_rev and not content:
                content = current_rev.content_text

            asset_has_new_violation = False

            # Rule check
            rule_results = DeterministicRuleEngine.evaluate_rules(content, sim_rules)
            for rr in rule_results:
                projected_findings.append({
                    "asset_id": asset.id,
                    "asset_title": asset.title,
                    "type": "RULE_VIOLATION",
                    "code": rr.rule_code,
                    "category": rr.category.value,
                    "severity": rr.severity.value,
                    "explanation": f"[SIMULATED] {rr.explanation}",
                    "suggested_correction": rr.suggested_correction
                })
                asset_has_new_violation = True

            # Fact check
            if current_rev:
                for claim in getattr(current_rev, "claims", []):
                    matched_fact = next((f for f in sim_facts if f.id == claim.matched_fact_id), None)
                    if matched_fact:
                        f_res = DeterministicRuleEngine.verify_claim_against_fact(
                            claim.claim_text,
                            claim.extracted_value,
                            claim.unit,
                            matched_fact
                        )
                        if f_res.category != FindingCategory.SUPPORTED:
                            projected_findings.append({
                                "asset_id": asset.id,
                                "asset_title": asset.title,
                                "type": "CLAIM_CONTRADICTION",
                                "claim_text": claim.claim_text,
                                "category": f_res.category.value,
                                "severity": f_res.severity.value,
                                "explanation": f"[SIMULATED] {f_res.explanation}",
                                "suggested_correction": f_res.suggested_correction
                            })
                            asset_has_new_violation = True

            if asset_has_new_violation:
                projected_non_compliant_count += 1
                affected_asset_details.append(AffectedAssetDetail(
                    asset_id=asset.id,
                    asset_title=asset.title,
                    asset_type=asset.asset_type,
                    campaign=asset.campaign_name,
                    impact_level=Severity.HIGH,
                    dependency_type="SIMULATED_GOVERNANCE_BREACH",
                    reason=f"Projected to violate governance under simulated scenario {change_type.value}.",
                    action_required="Must revise asset content or acquire updated substantiation if this scenario is promoted."
                ))

        net_new = max(projected_non_compliant_count - baseline_non_compliant, 0)
        
        # Transparent qualitative risk narrative
        risk_summary = (
            f"Simulation indicates {len(affected_asset_details)} asset(s) would be directly impacted, "
            f"with {net_new} net-new non-compliant collateral items. "
            f"Primary exposure stems from {change_type.value.lower().replace('_', ' ')}."
        )

        suggested_actions = [
            f"Review {len(affected_asset_details)} dependent marketing asset(s) before promoting this change.",
            "Schedule content revision sprints for affected campaign assets.",
            "Verify with Legal & Brand Teams whether existing collateral requires immediate deprecation or grace-period notice."
        ]

        return ScenarioSimulationResponse(
            scenario_id=scenario_id,
            status=ScenarioStatus.SIMULATED,
            baseline_non_compliant_assets=baseline_non_compliant,
            projected_non_compliant_assets=projected_non_compliant_count,
            net_new_violations=net_new,
            affected_assets_count=len(affected_asset_details),
            affected_assets=affected_asset_details,
            risk_summary=risk_summary,
            suggested_actions=suggested_actions,
            simulated_findings=projected_findings
        )
