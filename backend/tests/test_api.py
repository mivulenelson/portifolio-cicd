def test_health_reports_status_and_build_version(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "test-build"}


def test_portfolio_returns_seeded_sections(client):
    data = client.get("/api/portfolio").json()
    assert data["profile"]["name"]
    assert len(data["projects"]) >= 1
    assert len(data["skills"]) >= 1


def test_contact_form_accepts_valid_message(client):
    response = client.post(
        "/api/contact",
        json={"name": "Ada", "email": "ada@example.com", "message": "Hello, this is a test message."},
    )
    assert response.status_code == 201
    assert response.json() == {"ok": True}


def test_contact_form_rejects_invalid_email(client):
    response = client.post(
        "/api/contact",
        json={"name": "Ada", "email": "not-an-email", "message": "Hello, this is a test message."},
    )
    assert response.status_code == 422


def test_login_rejects_wrong_password(client):
    response = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert response.status_code == 401


def test_login_gives_token_that_unlocks_admin_routes(client):
    login = client.post("/api/auth/login", json={"username": "admin", "password": "test-password-123"})
    assert login.status_code == 200
    token = login.json()["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json() == {"username": "admin"}


def test_admin_routes_require_a_token(client):
    assert client.get("/api/admin/messages").status_code == 401
