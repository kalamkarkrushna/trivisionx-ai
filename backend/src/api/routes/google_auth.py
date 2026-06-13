"""
Google OAuth2 SSO routes — login redirect and callback.
========================================================
Flow:
  1. GET  /login  → returns Google authorization URL
  2. POST /callback → exchanges auth code for tokens, upserts user, returns JWT
"""
import urllib.parse
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from src.core.config import settings
from src.core.security import create_access_token
from src.core.constants import COLLECTION_USERS
from src.core.logger import get_logger
from src.database.mongodb.connection import get_database

logger = get_logger(__name__)
router = APIRouter()

# Google OAuth2 endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def _users():
    return get_database()[COLLECTION_USERS]


@router.get("/login")
async def google_login():
    """
    Returns the Google OAuth2 authorization URL.
    The frontend should redirect the user to this URL.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured (GOOGLE_CLIENT_ID missing)",
        )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": "google",
    }
    url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"authorization_url": url}


@router.post("/callback")
async def google_callback(payload: dict):
    """
    Exchanges the authorization code for tokens, verifies the ID token,
    upserts the user in MongoDB, and returns a JWT.
    """
    code = payload.get("code")
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is required",
        )

    # ── Exchange code for tokens ──────────────────────────────────────────
    token_data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(GOOGLE_TOKEN_URL, data=token_data)

    if token_response.status_code != 200:
        logger.error(f"Google token exchange failed: {token_response.text}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code with Google",
        )

    tokens = token_response.json()
    id_token_str = tokens.get("id_token")

    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ID token received from Google",
        )

    # ── Verify ID token ───────────────────────────────────────────────────
    try:
        id_info = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as e:
        logger.error(f"Google ID token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token",
        )

    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google",
        )

    # ── Upsert user in MongoDB ────────────────────────────────────────────
    google_id = id_info.get("sub")
    first_name = id_info.get("given_name", "")
    last_name = id_info.get("family_name", "")
    avatar_url = id_info.get("picture", "")

    existing_user = await _users().find_one({"email": email})

    if existing_user:
        # Update Google-specific fields if missing
        update_fields = {"updated_at": datetime.utcnow()}
        if not existing_user.get("google_id"):
            update_fields["google_id"] = google_id
        if not existing_user.get("avatar_url") and avatar_url:
            update_fields["avatar_url"] = avatar_url
        if not existing_user.get("auth_provider"):
            update_fields["auth_provider"] = "google"

        await _users().update_one(
            {"_id": existing_user["_id"]},
            {"$set": update_fields},
        )
        logger.info(f"Google SSO: existing user logged in — {email}")
    else:
        # Create new SSO user (no password)
        new_user = {
            "email": email,
            "username": email.split("@")[0],
            "first_name": first_name,
            "last_name": last_name,
            "google_id": google_id,
            "avatar_url": avatar_url,
            "auth_provider": "google",
            "created_at": datetime.utcnow(),
        }
        await _users().insert_one(new_user)
        logger.info(f"Google SSO: new user created — {email}")

    # ── Issue JWT ─────────────────────────────────────────────────────────
    access_token = create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}
