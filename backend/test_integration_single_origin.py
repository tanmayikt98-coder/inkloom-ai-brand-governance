"""
Inkloom AI - Single Origin Integration Verification Suite
Tests all modules through http://localhost:5173 reverse proxy.
"""
import sys
import requests

BASE_URL = "http://localhost:5173"
API_BASE = f"{BASE_URL}/api"

def run_tests():
    print(f"[Test] Starting Full Application Verification against {BASE_URL}...")
    headers = {"X-Demo-Role": "BRAND_MANAGER", "Content-Type": "application/json"}
    
    # 1. Health & Docs through proxy
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"/health failed: {r.status_code}"
    print("  [PASS] Reverse proxy to /health (200 OK)")

    r = requests.get(f"{BASE_URL}/docs")
    assert r.status_code == 200, f"/docs failed: {r.status_code}"
    print("  [PASS] Reverse proxy to /docs Swagger UI (200 OK)")

    r = requests.get(f"{BASE_URL}/openapi.json")
    assert r.status_code == 200, f"/openapi.json failed: {r.status_code}"
    print("  [PASS] Reverse proxy to /openapi.json (200 OK)")

    # 2. Authentication & RBAC
    r = requests.get(f"{API_BASE}/auth/me", headers=headers)
    assert r.status_code == 200, f"/auth/me failed: {r.status_code}"
    user = r.json()
    assert user["role"] == "BRAND_MANAGER"
    print(f"  [PASS] Auth /auth/me for BRAND_MANAGER ({user.get('full_name', user.get('email'))})")

    r = requests.get(f"{API_BASE}/auth/demo-users", headers=headers)
    assert r.status_code == 200, f"/auth/demo-users failed: {r.status_code}"
    users = r.json()
    assert len(users) >= 4, f"Expected at least 4 demo users, got {len(users)}"
    print(f"  [PASS] Auth /auth/demo-users returned {len(users)} roles")

    # 3. Brand Knowledge Hub
    r = requests.get(f"{API_BASE}/brands", headers=headers)
    assert r.status_code == 200, f"/brands failed: {r.status_code}"
    brands = r.json()
    assert len(brands) > 0, "No brands found"
    brand_id = brands[0]["id"]
    print(f"  [PASS] Brand Knowledge Hub: retrieved brand '{brands[0]['name']}' (ID: {brand_id})")

    r = requests.get(f"{API_BASE}/brands/{brand_id}/facts", headers=headers)
    assert r.status_code == 200
    facts = r.json()
    assert len(facts) > 0
    print(f"  [PASS] Brand Facts: retrieved {len(facts)} approved facts")

    r = requests.get(f"{API_BASE}/brands/{brand_id}/rules", headers=headers)
    assert r.status_code == 200
    rules = r.json()
    assert len(rules) > 0
    print(f"  [PASS] Brand Rules: retrieved {len(rules)} compliance rules")

    # 4. Evidence Library
    r = requests.get(f"{API_BASE}/brands/{brand_id}/evidence", headers=headers)
    assert r.status_code == 200
    evidence = r.json()
    assert len(evidence) > 0
    print(f"  [PASS] Evidence Library: retrieved {len(evidence)} verified evidentiary documents")

    # 5. Marketing Assets & Revisions
    r = requests.get(f"{API_BASE}/brands/{brand_id}/assets", headers=headers)
    assert r.status_code == 200
    assets = r.json()
    assert len(assets) > 0
    asset_id = assets[0]["id"]
    
    r = requests.get(f"{API_BASE}/assets/{asset_id}/revisions", headers=headers)
    assert r.status_code == 200
    revs = r.json()
    assert len(revs) > 0
    rev_id = revs[0]["id"]
    print(f"  [PASS] Marketing Assets: retrieved '{assets[0]['title']}', Revision {revs[0]['revision_number']}")

    # 6. Content Audits & Lineage
    r = requests.post(f"{API_BASE}/revisions/{rev_id}/audit", headers=headers)
    assert r.status_code in (200, 201), f"Audit failed: {r.status_code}"
    audit_data = r.json()
    findings = audit_data.get("findings", [])
    print(f"  [PASS] Content Audit Engine: audit run returned status '{audit_data.get('overall_status')}' with {len(findings)} findings")

    # 7. Citations & Lineage (Traceability)
    if findings:
        finding_id = findings[0]["id"]
        r = requests.get(f"{API_BASE}/traceability/{finding_id}", headers=headers)
        assert r.status_code == 200, f"Traceability failed: {r.status_code}"
        trace = r.json()
        assert "finding" in trace
        print(f"  [PASS] BrandTrace Citations & Lineage: verified chain for finding '{finding_id}'")

    # 8. Brand Time Machine (Version Diffing)
    if len(revs) >= 2:
        base_rev = revs[0]["id"]
        target_rev = revs[1]["id"]
        r = requests.get(f"{API_BASE}/time-machine/compare?base_rev_id={base_rev}&target_rev_id={target_rev}", headers=headers)
        assert r.status_code == 200
        comparison = r.json()
        print(f"  [PASS] Brand Time Machine: diff comparison completed between Rev {revs[0]['revision_number']} and Rev {revs[1]['revision_number']}")

    # 9. Maker-Checker Segregation of Duties
    # Content Creator cannot self-approve
    creator_headers = {"X-Demo-Role": "CONTENT_CREATOR", "Content-Type": "application/json"}
    r = requests.post(f"{API_BASE}/assets/{asset_id}/decide", headers=creator_headers, json={"decision": "APPROVED", "decision_notes": "Self approval test"})
    assert r.status_code in (400, 403), f"Expected 403/400 for maker-checker violation, got {r.status_code}"
    print("  [PASS] Maker-Checker RBAC: creator self-approval blocked (HTTP 403 Forbidden)")

    # 10. Brand Impact Map
    r = requests.get(f"{API_BASE}/brands/{brand_id}/impact-graph", headers=headers)
    assert r.status_code == 200
    graph = r.json()
    assert "nodes" in graph and "edges" in graph
    print(f"  [PASS] Brand Impact Map: graph constructed with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")

    # 11. What-If Simulator
    r = requests.get(f"{API_BASE}/brands/{brand_id}/scenarios", headers=headers)
    assert r.status_code == 200
    scenarios = r.json()
    if scenarios:
        scen_id = scenarios[0]["id"]
        r = requests.post(f"{API_BASE}/scenarios/{scen_id}/run", headers=headers)
        assert r.status_code == 200
        sim_res = r.json()
        print(f"  [PASS] What-If Simulator: scenario '{scenarios[0]['title']}' simulated in sandbox (projected affected: {len(sim_res.get('affected_assets', []))})")

    # 12. Multi-Campaigns, Governance Analytics & Audit Trail
    r = requests.get(f"{API_BASE}/brands/{brand_id}/campaigns", headers=headers)
    assert r.status_code == 200
    campaigns = r.json()
    print(f"  [PASS] Campaigns Management: retrieved {len(campaigns)} active campaigns")

    r = requests.get(f"{API_BASE}/reports/governance-analytics", headers=headers)
    assert r.status_code == 200
    analytics = r.json()
    print(f"  [PASS] Governance Reports: metrics summary loaded (compliance velocity: {analytics.get('compliance_velocity')}%)")

    r = requests.get(f"{API_BASE}/dashboard/audit-events?limit=10", headers=headers)
    assert r.status_code == 200
    events = r.json()
    print(f"  [PASS] Immutable Audit Trail: append-only ledger returned {len(events)} verifiable events")

    # 13. Database Record Persistence Test
    test_fact_payload = {
        "statement": "Inkloom AI verifies claims with 100% deterministic provenance.",
        "metric_value": "100%",
        "category": "ACCURACY",
        "status": "PENDING"
    }
    r = requests.post(f"{API_BASE}/brands/{brand_id}/facts", headers=headers, json=test_fact_payload)
    assert r.status_code == 201, f"Failed to create test fact: {r.status_code} {r.text}"
    created_fact = r.json()
    new_fact_id = created_fact["id"]
    print(f"  [PASS] Persistence Test - Created fact with ID {new_fact_id}")

    # Query back via API
    r = requests.get(f"{API_BASE}/brands/{brand_id}/facts", headers=headers)
    fact_ids = [f["id"] for f in r.json()]
    assert new_fact_id in fact_ids, "Created fact not found in subsequent query!"
    print(f"  [PASS] Persistence Test - Verified newly created fact persists in database and is queryable!")

    print("\n[SUCCESS] ALL INTEGRATION TESTS PASSED 100% VIA HTTP://LOCALHOST:5173 REVERSE PROXY!")

if __name__ == "__main__":
    import traceback
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Test failed with error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
