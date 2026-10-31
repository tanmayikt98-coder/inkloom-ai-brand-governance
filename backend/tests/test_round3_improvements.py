import pytest
import time
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_round3_improvement1_bounding_boxes_and_hybrid_retrieval():
    """
    Improvement 1: Verifiable Multi-Modal Evidence Grounding & Bounding Box Provenance
    - Hybrid dense vector + BM25 retrieval
    - Bounding box coordinates (page_num, x0, y0, x1, y1)
    - Sub-400ms hybrid retrieval latency
    - Zero-hallucination adversarial benchmark
    """
    # 1. Test hybrid retrieval endpoint
    t0 = time.perf_counter()
    resp = client.post("/api/evidence/hybrid-retrieve", json={
        "query": "Aurevia reduces average processing time by 30%",
        "top_k": 3
    })
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_sub_400ms"] is True
    assert elapsed_ms < 400.0
    assert len(data["results"]) > 0
    
    first_res = data["results"][0]
    bbox = first_res["bounding_box"]
    assert "x0" in bbox and "y0" in bbox and "x1" in bbox and "y1" in bbox
    assert bbox["x1"] > bbox["x0"]
    assert bbox["y1"] > bbox["y0"]

    # 2. Test 50-sample adversarial ground-truth benchmark
    bench_resp = client.get("/api/evidence/adversarial-benchmark")
    assert bench_resp.status_code == 200
    bench_data = bench_resp.json()
    assert bench_data["total_samples"] == 50
    assert bench_data["valid_samples"] == 25
    assert bench_data["adversarial_samples"] == 25
    
    metrics = bench_data["metrics"]
    assert metrics["grounded_bounding_box_coverage_pct"] == 100.0
    assert metrics["hallucination_rate_pct"] == 0.0
    assert metrics["sub_400ms_compliance"] is True

    # 3. Test visual document layout endpoint
    ev_resp = client.get("/api/evidence/ev-bench-001/visual-document")
    assert ev_resp.status_code == 200
    ev_data = ev_resp.json()
    assert len(ev_data["passages"]) > 0
    assert ev_data["passages"][0]["bounding_box"]["page_width"] == 612.0


def test_round3_improvement2_automated_blast_radius_and_cascade():
    """
    Improvement 2: Automated Blast-Radius Notification & Cascade Re-Auditing
    - Immediate approval revocation executed within 2.0s
    - 100% of affected collateral re-audited automatically with diff report
    - Automated outbound webhook notification with direct re-approval deep link
    """
    # Trigger cascade on fact deprecation
    resp = client.post("/api/impact/cascade/trigger", json={
        "fact_id": "fact-perf-001",
        "action": "DEPRECATED",
        "reason": "Specification updated by engineering board."
    })
    assert resp.status_code == 200
    data = resp.json()

    # Criteria 1: Immediate approval revocation within 2.0s
    assert data["immediate_revocation_ms"] < 2000.0
    assert data["acceptance_criteria_met"]["immediate_revocation_under_2s"] is True

    # Criteria 2: 100% of affected collateral re-audited automatically with diff report
    assert data["affected_assets_count"] > 0
    assert len(data["re_audit_diff_reports"]) == data["affected_assets_count"]
    for diff in data["re_audit_diff_reports"]:
        assert diff["new_compliance"] == "NON_COMPLIANT (CRITICAL VIOLATION)"
        assert "direct_re_approval_url" in diff

    # Criteria 3: Automated outbound webhook notification with direct re-approval deep link
    webhook = data["dispatched_webhook"]
    assert webhook["status"] == "DISPATCHED_200_OK"
    assert "deep_link" in webhook
    assert "review-queue" in webhook["deep_link"]

    # Verify cascade history is preserved
    hist_resp = client.get("/api/impact/cascade/history")
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()) > 0


def test_round3_improvement3_cryptographic_worm_ledger_and_multitenancy():
    """
    Improvement 3: Cryptographic Audit Trail (WORM) & Multi-Tenant Organizational Boundaries
    - Strict tenant data isolation verified with 0% cross-tenant data leakage
    - Cryptographic verification endpoint validating complete ledger integrity in <1.0s
    - Exportable tamper-evident JSON-LD compliance certificate package
    """
    # 1. Multi-tenant isolation verification test
    iso_resp = client.get("/api/auth/multi-tenant/verify-isolation")
    assert iso_resp.status_code == 200
    iso_data = iso_resp.json()
    assert iso_data["isolation_verified"] is True
    assert iso_data["leak_rate_pct"] == 0.0
    assert len(iso_data["organizations_tested"]) >= 3

    # 2. List organizations and switch tenant context
    orgs_resp = client.get("/api/auth/organizations")
    assert orgs_resp.status_code == 200
    orgs = orgs_resp.json()
    assert len(orgs) >= 3

    # Switch to NovuBio tenant
    switch_resp = client.post("/api/auth/switch-tenant", json={
        "organization_id": "org-novubio-002"
    })
    assert switch_resp.status_code == 200
    switch_data = switch_resp.json()
    assert switch_data["user"]["organization_id"] == "org-novubio-002"

    # 3. Cryptographic WORM verification in <1.0 second
    verify_resp = client.post("/api/dashboard/audit-ledger/verify")
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert v_data["is_valid"] is True
    assert v_data["tamper_detected"] is False
    assert v_data["verification_latency_ms"] < 1000.0
    assert v_data["is_sub_second"] is True
    assert len(v_data["merkle_root"]) == 64 # SHA-256 hex string

    # 4. Exportable JSON-LD compliance certificate package
    cert_resp = client.get("/api/dashboard/audit-ledger/export-certificate")
    assert cert_resp.status_code == 200
    cert = cert_resp.json()
    assert "@context" in cert
    assert "VerifiableCredential" in cert["type"]
    assert "credentialSubject" in cert
    assert cert["credentialSubject"]["ledgerProof"]["integrityStatus"] == "MATHEMATICALLY_VERIFIED"
    assert "proof" in cert
    assert cert["proof"]["type"] == "JsonWebSignature2020"

    # 5. Merkle tree visual graph endpoint
    tree_resp = client.get("/api/dashboard/audit-ledger/merkle-tree")
    assert tree_resp.status_code == 200
    tree_data = tree_resp.json()
    assert tree_data["total_levels"] > 0
    assert len(tree_data["nodes"]) > 0

