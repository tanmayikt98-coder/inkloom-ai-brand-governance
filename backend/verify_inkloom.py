#!/usr/bin/env python3
"""
Inkloom AI end-to-end verification. Standard library only. No mocks: every check
is a real HTTP request to your running services.

  python verify_inkloom.py                  read-only checks (safe on your data)
  python verify_inkloom.py --write          also creates ONE test brand/asset/revisions
                                            (named zz-verify-<timestamp>; no delete API exists)
  python verify_inkloom.py --check-persist  run AFTER restarting the backend: confirms the
                                            records created by --write are still in the database
"""
import argparse, json, pathlib, re, sys, time, urllib.error, urllib.request

B = "http://127.0.0.1:8000"   # backend, direct
F = "http://127.0.0.1:5173"   # frontend, Vite proxy
STATE = pathlib.Path(__file__).with_name(".inkloom_verify_state.json")
tally = {"PASS": 0, "FAIL": 0, "SKIP": 0}

# Endpoints used by frontend/src/services/api.ts (path relative to the /api prefix)
CONTRACT = [
    ("GET", "/auth/me"), ("GET", "/auth/demo-users"), ("POST", "/auth/switch-demo-role"),
    ("GET", "/brands"), ("GET", "/brands/{id}"), ("POST", "/brands"),
    ("GET", "/brands/{id}/facts"), ("POST", "/brands/{id}/facts"), ("PUT", "/facts/{id}"),
    ("GET", "/brands/{id}/evidence"), ("POST", "/brands/{id}/evidence"),
    ("POST", "/brands/{id}/evidence/upload"), ("PUT", "/evidence/{id}"),
    ("GET", "/brands/{id}/rules"), ("POST", "/brands/{id}/rules"), ("PUT", "/rules/{id}"),
    ("GET", "/brands/{id}/assets"), ("GET", "/assets/{id}"), ("POST", "/brands/{id}/assets"),
    ("GET", "/assets/{id}/revisions"), ("POST", "/assets/{id}/revisions"),
    ("POST", "/revisions/{id}/audit"), ("GET", "/revisions/{id}/latest-audit"),
    ("GET", "/traceability/{id}"),
    ("GET", "/reviews/queue"), ("POST", "/assets/{id}/submit"), ("POST", "/assets/{id}/decide"),
    ("GET", "/time-machine/compare"), ("POST", "/assets/{id}/restore/{id}"),
    ("GET", "/brands/{id}/impact-graph"), ("GET", "/impact/analyze"),
    ("GET", "/brands/{id}/scenarios"), ("POST", "/brands/{id}/scenarios"),
    ("POST", "/scenarios/{id}/run"), ("POST", "/scenarios/{id}/promote"),
    ("GET", "/dashboard/overview"), ("GET", "/dashboard/audit-events"),
    ("GET", "/brands/{id}/campaigns"),
    ("GET", "/reports/governance-analytics"), ("GET", "/reports/export-summary"),
]

def req(base, method, path, body=None, headers=None, timeout=30):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Accept": "application/json"}
    if body is not None:
        h["Content-Type"] = "application/json"
    h.update(headers or {})
    r = urllib.request.Request(base + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:  # connection refused, timeout, ...
        return None, str(e).encode()

def j(raw):
    try:
        return json.loads(raw)
    except Exception:
        return None

def check(name, ok, detail=""):
    tag = "PASS" if ok else "FAIL"
    tally[tag] += 1
    print(f"[{tag}] {name}" + (f" - {detail}" if detail else ""))
    return ok

def skip(name, why):
    tally["SKIP"] += 1
    print(f"[SKIP] {name} - {why}")

def call(name, method, path, body=None, hdr=None, base=None):
    s, raw = req(base or F, method, path, body, hdr)
    ok = s in (200, 201)
    check(name, ok, f"HTTP {s}" if ok else f"HTTP {s}: {raw[:200].decode(errors='replace')}")
    return j(raw) if ok else None

def login(role):
    hdr = {"X-Demo-Role": role}
    s, raw = req(F, "POST", "/api/auth/switch-demo-role", {"role": role}, hdr)
    d = j(raw) if s == 200 else None
    if isinstance(d, dict) and d.get("access_token"):
        hdr["Authorization"] = "Bearer " + d["access_token"]
    return hdr

norm = lambda p: re.sub(r"\{[^}]+\}", "{}", p)

def persist_check():
    if not STATE.exists():
        print("No state file. Run with --write first, then restart the backend.")
        return 1
    st = json.loads(STATE.read_text())
    hdr = login("BRAND_MANAGER")
    print(f"== Persistence check for {st['brand_name']} ==")
    brands = call("GET /api/brands", "GET", "/api/brands", hdr=hdr) or []
    check("test brand still in database", any(b.get("id") == st["brand_id"] for b in brands))
    a = call("GET asset", "GET", f"/api/assets/{st['asset_id']}", hdr=hdr)
    check("test asset still in database", bool(a))
    revs = call("GET revisions", "GET", f"/api/assets/{st['asset_id']}/revisions", hdr=hdr) or []
    check("revisions persisted", len(revs) >= st["revision_count"], f"{len(revs)} found, expected >= {st['revision_count']}")
    au = call("GET latest-audit", "GET", f"/api/revisions/{st['revision_id']}/latest-audit", hdr=hdr)
    check("audit run persisted", au is not None)
    print(f"\nPASS={tally['PASS']} FAIL={tally['FAIL']} SKIP={tally['SKIP']}")
    return 1 if tally["FAIL"] else 0

def main():
    global B, F
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--check-persist", action="store_true")
    ap.add_argument("--backend", default=B)
    ap.add_argument("--frontend", default=F)
    a = ap.parse_args()
    B, F = a.backend.rstrip("/"), a.frontend.rstrip("/")
    if a.check_persist:
        return persist_check()

    print("== 1. Backend directly (:8000) ==")
    spec_raw = None
    for p in ("/health", "/docs", "/redoc", "/openapi.json"):
        s, raw = req(B, "GET", p)
        check(f"backend {p}", s == 200, f"HTTP {s}")
        if p == "/openapi.json" and s == 200:
            spec_raw = raw

    print("\n== 2. Through the Vite proxy (:5173) ==")
    for p in ("/health", "/api/health", "/docs", "/redoc", "/openapi.json"):
        s, raw = req(F, "GET", p)
        check(f"proxy {p}", s == 200, f"HTTP {s}")
        if p == "/openapi.json" and s == 200 and spec_raw:
            check("proxied openapi.json matches backend", j(raw) == j(spec_raw))

    print("\n== 3. Do the routes api.ts calls actually exist? ==")
    spec = j(spec_raw) if spec_raw else None
    if not spec:
        skip("route contract", "backend openapi.json unavailable")
    else:
        paths = spec.get("paths", {})
        have = {norm(p): {m.upper() for m in v} for p, v in paths.items()}
        prefix = next((p[: -len("/auth/demo-users")] for p in paths if p.endswith("/auth/demo-users")), None)
        check("backend API prefix is exactly /api (no duplicate or missing prefix)", prefix == "/api", f"detected {prefix!r}")
        for m, p in CONTRACT:
            check(f"route exists: {m} /api{p}", m in have.get(norm("/api" + p), set()))

    print("\n== 4. Real data through the proxy (read-only) ==")
    users = call("GET demo-users", "GET", "/api/auth/demo-users")
    roles = sorted({u.get("role") for u in users if isinstance(u, dict) and u.get("role")}) if users else []
    hdr = login("BRAND_MANAGER")
    call("GET auth/me", "GET", "/api/auth/me", hdr=hdr)
    brands = call("GET brands (database read)", "GET", "/api/brands", hdr=hdr)
    if not brands:
        skip("brand-dependent checks", "no brands returned: database empty, unseeded, or unreachable")
    else:
        bid = brands[0]["id"]
        G = lambda path: call(f"GET /api{path}", "GET", "/api" + path, hdr=hdr)
        G(f"/brands/{bid}")
        G(f"/brands/{bid}/facts"); G(f"/brands/{bid}/evidence"); G(f"/brands/{bid}/rules")
        assets = G(f"/brands/{bid}/assets")
        G(f"/brands/{bid}/scenarios"); G(f"/brands/{bid}/campaigns")
        graph = G(f"/brands/{bid}/impact-graph")
        G("/dashboard/overview"); G(f"/dashboard/overview?brand_id={bid}"); G("/dashboard/audit-events?limit=5")
        G("/reports/governance-analytics"); G("/reports/export-summary")

        served = None
        for r in (roles or ["BRAND_MANAGER"]):
            s, _ = req(F, "GET", "/api/reviews/queue", headers=login(r))
            if s == 200:
                served = r
                break
        check("GET /api/reviews/queue (any demo role)", served is not None, f"served to role {served}" if served else "no role got HTTP 200")

        if isinstance(graph, dict) and graph.get("nodes"):
            n = graph["nodes"][0]
            et = n.get("type") or n.get("entity_type") or n.get("node_type")
            if n.get("id") and et:
                G(f"/impact/analyze?entity_id={n['id']}&entity_type={et}")
            else:
                skip("impact/analyze", f"cannot infer id/type from node keys {list(n)}")
        else:
            skip("impact/analyze", "impact graph has no nodes")

        if assets:
            aid = assets[0]["id"]
            G(f"/assets/{aid}")
            revs = G(f"/assets/{aid}/revisions") or []
            fid = None
            for rv in revs:
                s, raw = req(F, "GET", f"/api/revisions/{rv['id']}/latest-audit", headers=hdr)
                au = j(raw) if s == 200 else None
                if isinstance(au, dict) and au.get("findings"):
                    fid = au["findings"][0].get("id")
                    break
            if fid:
                G(f"/traceability/{fid}")
            else:
                skip("traceability", "no audited revision with findings in existing data")
            if len(revs) >= 2:
                G(f"/time-machine/compare?base_rev_id={revs[0]['id']}&target_rev_id={revs[1]['id']}")
            else:
                skip("time-machine compare", "first asset has fewer than 2 revisions")
        else:
            skip("asset/revision/time-machine checks", "no assets in first brand")

        if a.write:
            print("\n== 5. Write path (creates test records) ==")
            name = f"zz-verify-{int(time.time())}"
            nb = call("POST create brand", "POST", "/api/brands",
                      {"name": name, "tagline": "verify", "description": "created by verify_inkloom.py"}, hdr=hdr)
            atype = assets[0].get("asset_type") if assets else None
            if not (nb and nb.get("id")):
                skip("rest of write path", "brand creation failed")
            elif not atype:
                skip("asset/revision write path", "no existing asset to copy a valid asset_type from")
            else:
                nid = nb["id"]
                na = call("POST create asset", "POST", f"/api/brands/{nid}/assets",
                          {"title": "verify asset", "asset_type": atype, "content_text": "Verification copy v1."}, hdr=hdr)
                if na and na.get("id"):
                    call("POST create revision", "POST", f"/api/assets/{na['id']}/revisions",
                         {"content_text": "Verification copy v2.", "change_summary": "verify"}, hdr=hdr)
                    revs = call("GET revisions of new asset", "GET", f"/api/assets/{na['id']}/revisions", hdr=hdr) or []
                    check("new asset has >= 2 revisions", len(revs) >= 2, f"{len(revs)} found")
                    if revs:
                        last = revs[-1]["id"]
                        call("POST run audit", "POST", f"/api/revisions/{last}/audit", hdr=hdr)
                        call("GET latest-audit", "GET", f"/api/revisions/{last}/latest-audit", hdr=hdr)
                        if len(revs) >= 2:
                            call("GET time-machine compare", "GET",
                                 f"/api/time-machine/compare?base_rev_id={revs[0]['id']}&target_rev_id={revs[1]['id']}", hdr=hdr)
                            call("POST restore revision", "POST", f"/api/assets/{na['id']}/restore/{revs[0]['id']}", hdr=hdr)
                        STATE.write_text(json.dumps({"brand_id": nid, "brand_name": name, "asset_id": na["id"],
                                                     "revision_id": last, "revision_count": len(revs)}))
                        print(f"\nSaved {STATE.name}. Now restart the backend and run:  python verify_inkloom.py --check-persist")

    print(f"\nPASS={tally['PASS']} FAIL={tally['FAIL']} SKIP={tally['SKIP']}")
    print("Not covered here (test in the UI): review submit/decide, scenario create/run/promote, evidence upload.")
    return 1 if tally["FAIL"] else 0

if __name__ == "__main__":
    sys.exit(main())
