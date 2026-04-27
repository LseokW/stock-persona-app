from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    google_sub: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str | None] = mapped_column(String)
    picture_url: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    purchases: Mapped[list["Purchase"]] = relationship(back_populates="user")


class Purchase(Base):
    __tablename__ = "purchases"
    __table_args__ = (
        # 같은 페르소나의 completed 구매는 1개만 허용
        Index(
            "uq_user_persona_completed",
            "user_id",
            "persona",
            unique=True,
            sqlite_where=text("status = 'completed'"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    persona: Mapped[str] = mapped_column(String, nullable=False)  # coward|beast|contrarian|ai
    status: Mapped[str] = mapped_column(String, default="pending")  # pending|completed|failed|expired
    polar_checkout_id: Mapped[str | None] = mapped_column(String, index=True)
    polar_order_id: Mapped[str | None] = mapped_column(String)
    amount_cents: Mapped[int] = mapped_column(Integer, default=200)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="purchases")
