import re

from pydantic import BaseModel, Field, field_validator

# Deliberately loose, and deliberately not Pydantic's EmailStr: EmailStr needs
# the `email-validator` package, which is not in requirements.txt, and this
# endpoint is not worth a new dependency. The address is proven by a reply
# landing in it, not by a pattern.
_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class AccessRequest(BaseModel):
    """A prospect asking for an invitation from the public marketing site.

    Every field is length-capped: this is the one unauthenticated write in the
    API, so nothing here should be able to post a novel into an email.
    """

    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    organization: str = Field(min_length=1, max_length=160)
    team_size: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=2000)
    # Carried through from the pricing page's CTAs; absent for the landing ones.
    plan: str = Field(default="", max_length=40)
    # Honeypot. Real submitters never see this field, so any value in it means
    # a bot filled the form in. Accepted rather than rejected by the schema so
    # the router can decide what to do (see public.py).
    company_website: str = Field(default="", max_length=200)

    @field_validator("email")
    @classmethod
    def _valid_email(cls, value: str) -> str:
        value = value.strip()
        if not _EMAIL_PATTERN.match(value):
            raise ValueError("Not a valid email address")
        return value

    @field_validator("name", "organization")
    @classmethod
    def _required_text(cls, value: str) -> str:
        # min_length runs before this, so whitespace alone would otherwise pass
        # the constraint and arrive as an empty string in the email.
        value = value.strip()
        if not value:
            raise ValueError("Must not be blank")
        return value

    @field_validator("team_size", "notes", "plan")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()
