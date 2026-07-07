import os
import json
import logging
import urllib.request
import jwt
from typing import Dict
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt.algorithms import RSAAlgorithm
# Ensure env vars are loaded
import app.core.config

logger = logging.getLogger(__name__)

# Environment Variables
JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not JWKS_URL:
    logger.warning("CLERK_JWKS_URL not found in environment — authentication will fail.")
    JWKS_URL = "https://api.clerk.com/v1/jwks"

class ClerkCredentials(HTTPAuthorizationCredentials):
    decoded: Dict


class CustomClerkGuard(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
        self.jwks_keys: Dict = {}

    async def __call__(self, request: Request):
        creds: HTTPAuthorizationCredentials = await super().__call__(request)
        token = creds.credentials

        try:
            # 1. Get Key ID (kid) from token header
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if not kid:
                raise ValueError("Missing 'kid' in token header")

            # 2. Get Public Key from JWKS (refresh once if key not found)
            key = self.get_key(kid)
            if not key:
                self.refresh_keys()
                key = self.get_key(kid)
                if not key:
                    raise ValueError(f"Public key not found for kid: {kid}")

            public_key = RSAAlgorithm.from_jwk(json.dumps(key))

            # 3. Verify Token
            # Clerk tokens for backend often don't have 'aud', so we disable verify_aud
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
                leeway=10  # 10 seconds leeway for clock skew
            )

            # 4. Return custom credentials object with decoded payload
            return ClerkCredentials(
                scheme=creds.scheme,
                credentials=creds.credentials,
                decoded=payload
            )

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.PyJWTError as e:
            raise HTTPException(status_code=403, detail=f"Invalid token: {str(e)}")
        except Exception as e:
            # Log only the exception type — avoid leaking token contents in logs
            logger.warning("Auth error: %s", type(e).__name__)
            raise HTTPException(status_code=403, detail="Authentication failed")

    def get_key(self, kid):
        return next((k for k in self.jwks_keys.get("keys", []) if k["kid"] == kid), None)

    def refresh_keys(self):
        try:
            with urllib.request.urlopen(JWKS_URL) as response:
                self.jwks_keys = json.loads(response.read().decode())
        except Exception as e:
            logger.error("Failed to fetch JWKS: %s", type(e).__name__)

# Instantiate the guard
clerk_guard = CustomClerkGuard()
