import pytest
from fastapi.testclient import TestClient
from main import app
from app.seed_data import seed_database

@pytest.fixture(scope="module")
def client():
    seed_database(force=True)
    with TestClient(app) as c:
        yield c

class TestCORSConfiguration:
    """
    Validates CORS preflight (OPTIONS) and actual request behavior for
    the deployed GitHub Pages production frontend, Render services, local dev,
    and untrusted origins.
    """

    DEPLOYED_FRONTEND_ORIGIN = "https://tanmayikt98-coder.github.io"

    def test_preflight_options_dashboard_overview_allowed(self, client):
        """Preflight OPTIONS request to /api/dashboard/overview must return 200 with appropriate CORS headers."""
        response = client.options(
            "/api/dashboard/overview",
            headers={
                "Origin": self.DEPLOYED_FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type,x-demo-role,authorization",
            }
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == self.DEPLOYED_FRONTEND_ORIGIN
        assert response.headers.get("access-control-allow-credentials") == "true"
        allow_methods = response.headers.get("access-control-allow-methods", "")
        assert "GET" in allow_methods
        allow_headers = response.headers.get("access-control-allow-headers", "").lower()
        assert "x-demo-role" in allow_headers
        assert "content-type" in allow_headers

    def test_preflight_options_auth_me_allowed(self, client):
        """Preflight OPTIONS request to /api/auth/me must return 200."""
        response = client.options(
            "/api/auth/me",
            headers={
                "Origin": self.DEPLOYED_FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "x-demo-role,authorization",
            }
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == self.DEPLOYED_FRONTEND_ORIGIN
        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_actual_get_dashboard_overview_with_cors_headers(self, client):
        """Actual GET request from production frontend origin must return 200 with Access-Control-Allow-Origin."""
        response = client.get(
            "/api/dashboard/overview",
            headers={
                "Origin": self.DEPLOYED_FRONTEND_ORIGIN,
                "X-Demo-Role": "BRAND_MANAGER",
                "Content-Type": "application/json",
            }
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == self.DEPLOYED_FRONTEND_ORIGIN
        assert response.headers.get("access-control-allow-credentials") == "true"
        data = response.json()
        assert "total_brands" in data
        assert "total_facts" in data

    def test_actual_post_switch_demo_role_with_cors_headers(self, client):
        """POST request from production frontend must return 200 with Access-Control-Allow-Origin."""
        response = client.post(
            "/api/auth/switch-demo-role",
            json={"role": "CONTENT_CREATOR"},
            headers={
                "Origin": self.DEPLOYED_FRONTEND_ORIGIN,
                "Content-Type": "application/json",
            }
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == self.DEPLOYED_FRONTEND_ORIGIN
        assert response.headers.get("access-control-allow-credentials") == "true"
        assert "access_token" in response.json()

    def test_local_dev_origins_allowed(self, client):
        """Local development origins must succeed during preflight."""
        for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
            response = client.options(
                "/api/dashboard/overview",
                headers={
                    "Origin": local_origin,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "x-demo-role,content-type",
                }
            )
            assert response.status_code == 200
            assert response.headers.get("access-control-allow-origin") == local_origin

    def test_regex_matching_github_io_and_render_subdomains(self, client):
        """Subdomains under .github.io and .onrender.com must be allowed via regex."""
        for preview_origin in ["https://preview-branch.github.io", "https://inkloom-custom.onrender.com"]:
            response = client.options(
                "/api/dashboard/overview",
                headers={
                    "Origin": preview_origin,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "content-type",
                }
            )
            assert response.status_code == 200
            assert response.headers.get("access-control-allow-origin") == preview_origin

    def test_disallowed_origin_preflight_rejected(self, client):
        """Untrusted origin preflight must be rejected with HTTP 400 Disallowed CORS origin."""
        response = client.options(
            "/api/dashboard/overview",
            headers={
                "Origin": "https://malicious-phishing-site.com",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "content-type",
            }
        )
        assert response.status_code == 400
        assert "Disallowed CORS" in response.text

    def test_disallowed_origin_actual_get_omits_allow_origin(self, client):
        """Untrusted origin actual request must NOT receive Access-Control-Allow-Origin header."""
        response = client.get(
            "/api/dashboard/overview",
            headers={
                "Origin": "https://malicious-phishing-site.com",
                "X-Demo-Role": "BRAND_MANAGER",
            }
        )
        assert response.headers.get("access-control-allow-origin") is None

    def test_health_check_endpoint(self, client):
        """Health check returns 200 without requiring auth."""
        res1 = client.get("/health")
        assert res1.status_code == 200
        assert res1.json()["status"] == "healthy"

        res2 = client.get("/api/health")
        assert res2.status_code == 200
        assert res2.json()["status"] == "healthy"
