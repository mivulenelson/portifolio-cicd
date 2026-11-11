import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas, security
from .database import Base, SessionLocal, engine, get_db

login_limiter = security.RateLimiter(limit=10, window_seconds=300)
contact_limiter = security.RateLimiter(limit=5, window_seconds=3600)


def seed(db: Session) -> None:
    """Fill an empty database with starter content the admin can edit or delete."""
    if db.get(models.Profile, 1) is None:
        db.add(
            models.Profile(
                id=1,
                name="Kalanzi Joseph",
                headline="Final-year Computer Science student",
                availability="Open to graduate roles and internships (deployed by CI/CD)",
                bio=(
                    "I build practical software, from APIs to clean user interfaces. "
                    "I am finishing my Computer Science degree and looking for a team "
                    "where I can learn on real products."
                ),
                email="joseph@example.com",
                location="Kampala, Uganda",
                github="https://github.com/",
                linkedin="https://www.linkedin.com/",
            )
        )
    if not db.scalar(select(models.Project.id).limit(1)):
        db.add_all(
            [
                models.Project(
                    title="Sample project: Campus Marketplace",
                    description="Starter entry. Replace it from the admin page with a real project: what it does, who it is for, and what you built.",
                    tech=["React", "FastAPI", "PostgreSQL"],
                ),
                models.Project(
                    title="Sample project: Final-year project",
                    description="Starter entry. Describe your final-year project and the problem it solves.",
                    tech=["Python", "SQL"],
                ),
            ]
        )
    if not db.scalar(select(models.Skill.id).limit(1)):
        starter = [
            ("Python", "Languages", 4),
            ("JavaScript", "Languages", 4),
            ("SQL", "Languages", 3),
            ("React", "Web", 4),
            ("FastAPI", "Web", 4),
            ("REST APIs", "Web", 4),
            ("Git", "Tools", 4),
            ("Docker", "Tools", 3),
            ("Data structures and algorithms", "Foundations", 4),
            ("Databases", "Foundations", 3),
        ]
        db.add_all([models.Skill(name=n, category=c, level=l) for n, c, l in starter])
    db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


APP_VERSION = os.getenv("APP_VERSION", "dev")  # build identifier, set to the git commit SHA on AWS

docs_enabled = os.getenv("ENABLE_DOCS", "false").lower() == "true"
app = FastAPI(
    title="Portfolio API",
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs" if docs_enabled else None,
    redoc_url=None,
    openapi_url="/api/openapi.json" if docs_enabled else None,
)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


# ---------------------------------------------------------------- public
@app.get("/api/health")
def health():
    return {"status": "ok", "version": APP_VERSION}


@app.get("/api/portfolio", response_model=schemas.PortfolioOut)
def get_portfolio(db: Session = Depends(get_db)):
    return {
        "profile": db.get(models.Profile, 1),
        "projects": db.scalars(select(models.Project).order_by(models.Project.id.desc())).all(),
        "skills": db.scalars(select(models.Skill).order_by(models.Skill.category, models.Skill.id)).all(),
    }


@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def send_message(payload: schemas.ContactIn, request: Request, db: Session = Depends(get_db)):
    contact_limiter.check(client_ip(request))
    db.add(models.Message(name=payload.name, email=payload.email, body=payload.message))
    db.commit()
    return {"ok": True}


# ------------------------------------------------------------------ auth
@app.post("/api/auth/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, request: Request):
    login_limiter.check(client_ip(request))
    if not security.verify_credentials(payload.username, payload.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong username or password")
    return {"token": security.create_token(payload.username), "expires_in": security.TOKEN_TTL_SECONDS}


@app.get("/api/auth/me")
def me(user: str = Depends(security.require_admin)):
    return {"username": user}


# ----------------------------------------------------------------- admin
admin = [Depends(security.require_admin)]


@app.put("/api/admin/profile", response_model=schemas.ProfileOut, dependencies=admin)
def update_profile(payload: schemas.ProfileIn, db: Session = Depends(get_db)):
    profile = db.get(models.Profile, 1)
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def _get_or_404(db: Session, model, item_id: int):
    item = db.get(model, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    return item


@app.post("/api/admin/projects", response_model=schemas.ProjectOut, status_code=201, dependencies=admin)
def create_project(payload: schemas.ProjectIn, db: Session = Depends(get_db)):
    item = models.Project(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.put("/api/admin/projects/{item_id}", response_model=schemas.ProjectOut, dependencies=admin)
def update_project(item_id: int, payload: schemas.ProjectIn, db: Session = Depends(get_db)):
    item = _get_or_404(db, models.Project, item_id)
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/admin/projects/{item_id}", status_code=204, dependencies=admin)
def delete_project(item_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Project, item_id))
    db.commit()
    return Response(status_code=204)


@app.post("/api/admin/skills", response_model=schemas.SkillOut, status_code=201, dependencies=admin)
def create_skill(payload: schemas.SkillIn, db: Session = Depends(get_db)):
    item = models.Skill(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.put("/api/admin/skills/{item_id}", response_model=schemas.SkillOut, dependencies=admin)
def update_skill(item_id: int, payload: schemas.SkillIn, db: Session = Depends(get_db)):
    item = _get_or_404(db, models.Skill, item_id)
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/admin/skills/{item_id}", status_code=204, dependencies=admin)
def delete_skill(item_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Skill, item_id))
    db.commit()
    return Response(status_code=204)


@app.get("/api/admin/messages", response_model=list[schemas.MessageOut], dependencies=admin)
def list_messages(db: Session = Depends(get_db)):
    return db.scalars(select(models.Message).order_by(models.Message.id.desc())).all()


@app.delete("/api/admin/messages/{item_id}", status_code=204, dependencies=admin)
def delete_message(item_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, models.Message, item_id))
    db.commit()
    return Response(status_code=204)
