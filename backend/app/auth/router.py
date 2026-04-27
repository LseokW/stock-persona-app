import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Purchase, User
from app.schemas import MeResponse

from .google import exchange_code_for_token, get_google_auth_url, get_google_userinfo
from .jwt_utils import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/login")
async def google_login():
    state = secrets.token_hex(16)
    return RedirectResponse(url=get_google_auth_url(state))


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        access_token = await exchange_code_for_token(code)
        userinfo = await get_google_userinfo(access_token)
    except Exception:
        raise HTTPException(status_code=400, detail="Google OAuth failed")

    google_sub = userinfo["sub"]
    result = await db.execute(select(User).where(User.google_sub == google_sub))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            google_sub=google_sub,
            email=userinfo.get("email", ""),
            name=userinfo.get("name"),
            picture_url=userinfo.get("picture"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        user.email = userinfo.get("email", user.email)
        user.name = userinfo.get("name", user.name)
        user.picture_url = userinfo.get("picture", user.picture_url)
        await db.commit()

    token = create_access_token(user.id)
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login/callback?token={token}")


@router.get("/me", response_model=MeResponse)
async def me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.status == "completed",
        )
    )
    purchased_personas = [p.persona for p in result.scalars().all()]

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        picture_url=current_user.picture_url,
        purchased_personas=purchased_personas,
    )


@router.post("/logout")
async def logout():
    return {"message": "logged out"}
