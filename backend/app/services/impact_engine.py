from typing import List, Dict, Any, Set, Tuple
from collections import defaultdict
from app.enums import EntityType, Severity, AssetType, FactStatus, EvidenceStatus
from app.schemas import GraphNode, GraphEdge, ImpactGraphResponse, AffectedAssetDetail, ImpactAnalysisResponse

class ImpactEngine:
    """
    Builds the Brand Impact Graph and performs dependency & blast-radius analysis.
    Traverses relationships: Evidence -> Fact -> Claim -> Asset Revision -> Marketing Asset -> Findings
    """

    @staticmethod
    def build_graph(
        facts: List[Any],
        evidence_sources: List[Any],
        rules: List[Any],
        assets: List[Any],
        dependencies: List[Any]
    ) -> ImpactGraphResponse:
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        seen_nodes: Set[str] = set()

        # 1. Evidence Nodes
        for ev in evidence_sources:
            node_id = f"evidence_{ev.id}"
            if node_id not in seen_nodes:
                seen_nodes.add(node_id)
                nodes.append(GraphNode(
                    id=node_id,
                    label=ev.title,
                    type=EntityType.EVIDENCE,
                    status=ev.verification_status.value,
                    category=ev.source_type.value,
                    meta={"owner": ev.responsible_owner or "Unassigned", "exp": str(ev.expiration_date or "None")}
                ))

        # 2. Fact Nodes & Links from Evidence
        for fact in facts:
            node_id = f"fact_{fact.id}"
            if node_id not in seen_nodes:
                seen_nodes.add(node_id)
                nodes.append(GraphNode(
                    id=node_id,
                    label=f"Fact v{fact.version}: {fact.claim_statement[:50]}...",
                    type=EntityType.FACT,
                    status=fact.status.value,
                    category=fact.category,
                    meta={"metric": f"{fact.metric_value}{fact.metric_unit or ''}" if fact.metric_value else "None"}
                ))
            
            # Edges from linked evidence
            for link in getattr(fact, "evidence_links", []):
                ev_id = f"evidence_{link.evidence_id}"
                if ev_id in seen_nodes:
                    edges.append(GraphEdge(
                        id=f"e_{ev_id}_{node_id}",
                        source=ev_id,
                        target=node_id,
                        relation="SUBSTANTIATES",
                        is_confirmed=True,
                        weight=1.0
                    ))

        # 3. Rule Nodes
        for rule in rules:
            node_id = f"rule_{rule.id}"
            if node_id not in seen_nodes:
                seen_nodes.add(node_id)
                nodes.append(GraphNode(
                    id=node_id,
                    label=f"{rule.rule_code}: {rule.name}",
                    type=EntityType.RULE,
                    status="ACTIVE" if rule.is_active else "INACTIVE",
                    severity=rule.severity.value,
                    category=rule.rule_type.value,
                    meta={"pattern": rule.check_pattern[:30]}
                ))

        # 4. Asset & Revision & Claim Nodes
        for asset in assets:
            asset_node_id = f"asset_{asset.id}"
            if asset_node_id not in seen_nodes:
                seen_nodes.add(asset_node_id)
                nodes.append(GraphNode(
                    id=asset_node_id,
                    label=asset.title,
                    type=EntityType.ASSET,
                    status=asset.status.value,
                    category=asset.asset_type.value,
                    meta={"campaign": asset.campaign_name or "General"}
                ))

            # Connect rules to asset if asset is governed
            for rule in rules:
                if rule.is_active:
                    edges.append(GraphEdge(
                        id=f"e_rule_{rule.id}_{asset_node_id}",
                        source=f"rule_{rule.id}",
                        target=asset_node_id,
                        relation="GOVERNS",
                        is_confirmed=True,
                        weight=0.5
                    ))

            # Connect claims from current revision
            for rev in getattr(asset, "revisions", []):
                if rev.id == asset.current_revision_id:
                    for cl in getattr(rev, "claims", []):
                        cl_node_id = f"claim_{cl.id}"
                        if cl_node_id not in seen_nodes:
                            seen_nodes.add(cl_node_id)
                            nodes.append(GraphNode(
                                id=cl_node_id,
                                label=f"Claim: {cl.claim_text[:40]}...",
                                type=EntityType.CLAIM,
                                status="ACTIVE",
                                meta={"value": cl.extracted_value, "unit": cl.unit}
                            ))
                        # Edge: Claim -> Asset
                        edges.append(GraphEdge(
                            id=f"e_{cl_node_id}_{asset_node_id}",
                            source=cl_node_id,
                            target=asset_node_id,
                            relation="ASSERTED_IN",
                            is_confirmed=True,
                            weight=1.0
                        ))
                        # Edge: Fact -> Claim
                        if cl.matched_fact_id:
                            fact_node_id = f"fact_{cl.matched_fact_id}"
                            if fact_node_id in seen_nodes:
                                edges.append(GraphEdge(
                                    id=f"e_{fact_node_id}_{cl_node_id}",
                                    source=fact_node_id,
                                    target=cl_node_id,
                                    relation="GROUNDS",
                                    is_confirmed=True,
                                    weight=1.0
                                ))

        # 5. Stored custom or inferred dependency edges
        for dep in dependencies:
            s_id = f"{dep.source_type.value.lower()}_{dep.source_id}"
            t_id = f"{dep.target_type.value.lower()}_{dep.target_id}"
            if s_id in seen_nodes and t_id in seen_nodes:
                edges.append(GraphEdge(
                    id=f"dep_{dep.id}",
                    source=s_id,
                    target=t_id,
                    relation=dep.relation_type,
                    is_confirmed=dep.is_confirmed,
                    weight=dep.weight
                ))

        return ImpactGraphResponse(
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges)
        )

    @classmethod
    def analyze_impact(
        cls,
        entity_id: str,
        entity_type: EntityType,
        facts: List[Any],
        assets: List[Any],
        rules: List[Any]
    ) -> ImpactAnalysisResponse:
        """
        Traverses downstream dependencies to compute blast radius and identify affected assets.
        """
        direct_affected: List[AffectedAssetDetail] = []
        indirect_affected: List[AffectedAssetDetail] = []
        seen_asset_ids: Set[str] = set()

        norm_type = entity_type.value if hasattr(entity_type, "value") else str(entity_type).upper()

        if norm_type in ("FACT", "ENTITYTYPE.FACT"):
            # Check all assets whose active revision claims match this fact
            target_fact = next((f for f in facts if f.id == entity_id), None)
            fact_statement = target_fact.claim_statement if target_fact else "Fact"

            for asset in assets:
                has_direct_claim = False
                revs = getattr(asset, "revisions", [])
                target_rev = next((r for r in revs if r.id == asset.current_revision_id), None)
                if not target_rev and revs:
                    target_rev = revs[-1]

                # Check claims on target revision or any revision of this asset
                if target_rev:
                    for cl in getattr(target_rev, "claims", []):
                        if cl.matched_fact_id == entity_id:
                            has_direct_claim = True
                            break
                if not has_direct_claim:
                    for r in revs:
                        for cl in getattr(r, "claims", []):
                            if cl.matched_fact_id == entity_id:
                                has_direct_claim = True
                                break

                if has_direct_claim and asset.id not in seen_asset_ids:
                    seen_asset_ids.add(asset.id)
                    direct_affected.append(AffectedAssetDetail(
                        asset_id=asset.id,
                        asset_title=asset.title,
                        asset_type=asset.asset_type,
                        campaign=asset.campaign_name,
                        impact_level=Severity.HIGH,
                        dependency_type="DIRECT_CLAIM",
                        reason=f"Directly asserts claims grounded in Fact: '{fact_statement[:45]}...'",
                        action_required="Audit revision and verify performance figures before next publication."
                    ))

        elif norm_type in ("EVIDENCE", "ENTITYTYPE.EVIDENCE"):
            # Find facts supported by this evidence, then assets depending on those facts
            linked_facts = [f for f in facts if any(l.evidence_id == entity_id for l in getattr(f, "evidence_links", []))]
            linked_fact_ids = {f.id for f in linked_facts}

            for asset in assets:
                asset_affected = False
                revs = getattr(asset, "revisions", [])
                target_rev = next((r for r in revs if r.id == asset.current_revision_id), None)
                if not target_rev and revs:
                    target_rev = revs[-1]
                if target_rev:
                    for cl in getattr(target_rev, "claims", []):
                        if cl.matched_fact_id in linked_fact_ids:
                            asset_affected = True
                            break
                if not asset_affected:
                    for r in revs:
                        for cl in getattr(r, "claims", []):
                            if cl.matched_fact_id in linked_fact_ids:
                                asset_affected = True
                                break

                if asset_affected and asset.id not in seen_asset_ids:
                    seen_asset_ids.add(asset.id)
                    direct_affected.append(AffectedAssetDetail(
                        asset_id=asset.id,
                        asset_title=asset.title,
                        asset_type=asset.asset_type,
                        campaign=asset.campaign_name,
                        impact_level=Severity.HIGH,
                        dependency_type="EVIDENCE_EXPIRY",
                        reason="Relies on claims substantiated by this evidence source.",
                        action_required="Re-substantiate claims or retire asset revision."
                    ))

        elif entity_type == EntityType.RULE:
            target_rule = next((r for r in rules if r.id == entity_id), None)
            rule_name = target_rule.name if target_rule else "Rule"
            for asset in assets:
                if asset.id not in seen_asset_ids:
                    seen_asset_ids.add(asset.id)
                    indirect_affected.append(AffectedAssetDetail(
                        asset_id=asset.id,
                        asset_title=asset.title,
                        asset_type=asset.asset_type,
                        campaign=asset.campaign_name,
                        impact_level=Severity.MEDIUM,
                        dependency_type="RULE_GOVERNANCE",
                        reason=f"Asset governed by rule '{rule_name}'. Rule modifications may trigger new violations.",
                        action_required="Re-run automated compliance audit against updated rule definition."
                    ))

        total_affected = len(direct_affected) + len(indirect_affected)
        total_assets = max(len(assets), 1)
        blast_radius = min(round((total_affected / total_assets) * 100, 1), 100.0)

        all_affected = direct_affected + indirect_affected
        return ImpactAnalysisResponse(
            root_entity_id=entity_id,
            root_entity_type=entity_type,
            direct_affected_count=len(direct_affected),
            indirect_affected_count=len(indirect_affected),
            affected_assets=all_affected,
            blast_radius_score=blast_radius
        )
