# Kalanzi Joseph: portfolio

React + FastAPI portfolio with an admin page, dark and light themes, and Docker.

## Run with Docker

```bash
cp .env.example .env        # then set ADMIN_PASSWORD and JWT_SECRET
docker compose up --build
```

- Site: http://localhost:8080
- Admin: http://localhost:8080/admin (sign in with the credentials from `.env`)

Content is stored in SQLite inside the `portfolio_data` volume, so it survives restarts and rebuilds.
The first start seeds sample content; edit or delete it from the admin page.

## Run locally without Docker

```bash
# backend
cd backend && pip install -r requirements.txt
ADMIN_PASSWORD=dev-password JWT_SECRET=dev-secret uvicorn app.main:app --reload

# frontend (new terminal)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## Notes

- Only the frontend container is published. The API is reachable only through nginx at `/api`.
- Put the site behind HTTPS (a reverse proxy such as Caddy or Traefik) before exposing it publicly.
- Set `ENABLE_DOCS=true` on the backend to expose the interactive API docs at `/api/docs`.

## CI/CD on AWS (Terraform + GitHub Actions)

- `infra/`: Terraform for ECR, ECS Fargate, load balancer, IAM, secrets and logs
- `infra/bootstrap/`: one-time setup of the Terraform state bucket and GitHub-to-AWS trust
- `.github/workflows/`: `ci.yml` (tests, Terraform fmt/validate, Docker build), `deploy.yml` (deploy on push to `main`), `destroy.yml` (manual teardown)
- Setup steps and the demo script: [docs/CICD_SETUP.md](docs/CICD_SETUP.md)
