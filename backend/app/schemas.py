import re
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints

_URL_RE = re.compile(r"^https?://\S+$", re.IGNORECASE)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _url(v: str) -> str:
    # Only http(s) links are allowed so a stored "javascript:" URL can never reach an href.
    if v and not _URL_RE.match(v):
        raise ValueError("must start with http:// or https://")
    return v


def _email(v: str) -> str:
    if v and not _EMAIL_RE.match(v):
        raise ValueError("must be a valid email address")
    return v


def Text(max_len: int, min_len: int = 0):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_len, max_length=max_len)]


Url = Annotated[str, StringConstraints(strip_whitespace=True, max_length=300), AfterValidator(_url)]
Email = Annotated[str, StringConstraints(strip_whitespace=True, max_length=200), AfterValidator(_email)]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Profile ----------
class ProfileIn(BaseModel):
    name: Text(100, 1)
    headline: Text(160) = ""
    availability: Text(120) = ""
    bio: Text(2000) = ""
    email: Email = ""
    location: Text(100) = ""
    github: Url = ""
    linkedin: Url = ""
    resume_url: Url = ""


class ProfileOut(ProfileIn, ORM):
    pass


# ---------- Projects ----------
class ProjectIn(BaseModel):
    title: Text(120, 1)
    description: Text(1200) = ""
    tech: list[Text(40, 1)] = Field(default_factory=list, max_length=12)
    repo_url: Url = ""
    live_url: Url = ""


class ProjectOut(ProjectIn, ORM):
    id: int


# ---------- Skills ----------
class SkillIn(BaseModel):
    name: Text(60, 1)
    category: Text(40, 1)
    level: int = Field(default=3, ge=1, le=5)


class SkillOut(SkillIn, ORM):
    id: int


# ---------- Portfolio (public payload) ----------
class PortfolioOut(BaseModel):
    profile: ProfileOut
    projects: list[ProjectOut]
    skills: list[SkillOut]


# ---------- Contact ----------
class ContactIn(BaseModel):
    name: Text(100, 1)
    email: Email
    message: Text(3000, 5)


class MessageOut(ORM):
    id: int
    name: str
    email: str
    body: str
    created_at: datetime


# ---------- Auth ----------
class LoginIn(BaseModel):
    username: Text(100, 1)
    password: Annotated[str, StringConstraints(min_length=1, max_length=128)]


class TokenOut(BaseModel):
    token: str
    expires_in: int
