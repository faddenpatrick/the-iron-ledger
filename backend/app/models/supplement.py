"""Supplement tracking models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Date, Text, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class Supplement(Base):
    """User-defined supplement (e.g., Vitamin D3, Creatine)."""

    __tablename__ = "supplements"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_supplements_user_name"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=True)
    dosage = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="supplements")
    logs = relationship("SupplementLog", back_populates="supplement", cascade="all, delete-orphan")


class SupplementLog(Base):
    """Daily supplement intake log."""

    __tablename__ = "supplement_logs"
    __table_args__ = (
        UniqueConstraint("supplement_id", "log_date", name="uq_supplement_logs_supplement_date"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    supplement_id = Column(UUID(as_uuid=True), ForeignKey("supplements.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, nullable=False)
    taken = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    supplement = relationship("Supplement", back_populates="logs")
