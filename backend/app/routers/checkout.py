from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_utils import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Purchase, User
from app.services.polar_client import get_polar
from polar_sdk.models import CheckoutCreate

router = APIRouter(prefix="/checkout", tags=["checkout"])

PAID_PERSONAS = {"coward", "beast", "contrarian", "ai"}

POLAR_TO_INTERNAL = {
    "succeeded": "completed",
    "confirmed": "completed",
    "expired": "expired",
    "failed": "failed",
    "open": "pending",
}


class CheckoutCreateRequest(BaseModel):
    persona_key: str


class CheckoutCreateResponse(BaseModel):
    checkout_id: str
    checkout_url: str
    persona_key: str


class CheckoutStatusResponse(BaseModel):
    checkout_id: str
    persona_key: str
    status: str
    polar_status: str | None = None


@router.post("/create", response_model=CheckoutCreateResponse)
async def create_checkout(
    body: CheckoutCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.persona_key not in PAID_PERSONAS:
        raise HTTPException(status_code=400, detail="유효하지 않은 페르소나입니다.")

    # 이미 구매 완료
    existing = await db.execute(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.persona == body.persona_key,
            Purchase.status == "completed",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 구매한 페르소나입니다.")

    # 24시간 내 pending checkout 재사용
    cutoff = datetime.utcnow() - timedelta(hours=24)
    pending = await db.execute(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.persona == body.persona_key,
            Purchase.status == "pending",
            Purchase.created_at >= cutoff,
            Purchase.polar_checkout_id.isnot(None),
        )
    )
    pending_row = pending.scalar_one_or_none()
    if pending_row:
        polar = get_polar()
        try:
            checkout = polar.checkouts.get(id=pending_row.polar_checkout_id)
            if checkout.status.value == "open":
                return CheckoutCreateResponse(
                    checkout_id=pending_row.polar_checkout_id,
                    checkout_url=checkout.url,
                    persona_key=body.persona_key,
                )
        except Exception:
            pass

    product_id = settings.get_polar_product_id(body.persona_key)
    if not product_id:
        raise HTTPException(status_code=503, detail="아직 결제 설정이 완료되지 않았습니다.")

    success_url = (
        f"{settings.FRONTEND_URL}/checkout/success?checkout_id={{CHECKOUT_ID}}"
    )

    polar = get_polar()
    checkout = polar.checkouts.create(
        request=CheckoutCreate(
            products=[product_id],
            customer_email=current_user.email,
            external_customer_id=str(current_user.id),
            success_url=success_url,
            metadata={"user_id": str(current_user.id), "persona_key": body.persona_key},
        )
    )

    purchase = Purchase(
        user_id=current_user.id,
        persona=body.persona_key,
        status="pending",
        polar_checkout_id=checkout.id,
        amount_cents=200,
    )
    db.add(purchase)
    await db.commit()

    return CheckoutCreateResponse(
        checkout_id=checkout.id,
        checkout_url=checkout.url,
        persona_key=body.persona_key,
    )


@router.get("/status/{checkout_id}", response_model=CheckoutStatusResponse)
async def get_checkout_status(
    checkout_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.polar_checkout_id == checkout_id,
        )
    )
    purchase = result.scalar_one_or_none()
    if not purchase:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다.")

    if purchase.status == "completed":
        return CheckoutStatusResponse(
            checkout_id=checkout_id,
            persona_key=purchase.persona,
            status="completed",
            polar_status="succeeded",
        )

    polar = get_polar()
    polar_checkout = polar.checkouts.get(id=checkout_id)
    polar_status = polar_checkout.status.value
    print(f"[checkout] polar status raw value: {polar_status!r}")

    internal_status = POLAR_TO_INTERNAL.get(polar_status, "pending")

    if internal_status != purchase.status:
        purchase.status = internal_status
        if internal_status == "completed":
            purchase.completed_at = datetime.utcnow()
        await db.commit()

    return CheckoutStatusResponse(
        checkout_id=checkout_id,
        persona_key=purchase.persona,
        status=internal_status,
        polar_status=polar_status,
    )


@router.get("/my-purchases")
async def my_purchases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Purchase).where(Purchase.user_id == current_user.id)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "persona": r.persona,
            "status": r.status,
            "polar_checkout_id": r.polar_checkout_id,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
