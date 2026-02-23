"""Supplement tracking API endpoints."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from pydantic import BaseModel
from typing import Optional, List

from ...database import get_db
from ...models.user import User
from ...models.supplement import Supplement, SupplementLog
from ..deps import get_current_user


router = APIRouter()


# --- Pydantic schemas ---

class CreateSupplementRequest(BaseModel):
    """Request to create a supplement."""
    name: str
    brand: Optional[str] = None
    dosage: Optional[str] = None
    notes: Optional[str] = None


class UpdateSupplementRequest(BaseModel):
    """Request to update a supplement."""
    name: Optional[str] = None
    brand: Optional[str] = None
    dosage: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplementResponse(BaseModel):
    """Supplement response."""
    id: str
    name: str
    brand: Optional[str]
    dosage: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class LogSupplementRequest(BaseModel):
    """Request to log taking a supplement."""
    supplement_id: str
    log_date: date


class SupplementLogResponse(BaseModel):
    """Supplement log response."""
    id: str
    supplement_id: str
    log_date: date
    taken: bool
    created_at: str

    class Config:
        from_attributes = True


class SupplementWithLogResponse(BaseModel):
    """Supplement + whether it was taken on the queried date."""
    id: str
    name: str
    brand: Optional[str]
    dosage: Optional[str]
    is_active: bool
    taken_today: bool


# --- Supplement CRUD ---

@router.post("/supplements", response_model=SupplementResponse)
async def create_supplement(
    request: CreateSupplementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new supplement."""
    # Check for duplicate name (case-insensitive)
    existing = db.query(Supplement).filter(
        Supplement.user_id == current_user.id,
        func.lower(Supplement.name) == request.name.strip().lower(),
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="A supplement with this name already exists")

    supplement = Supplement(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=request.name.strip(),
        brand=request.brand.strip() if request.brand else None,
        dosage=request.dosage.strip() if request.dosage else None,
        notes=request.notes.strip() if request.notes else None,
    )
    db.add(supplement)
    db.commit()
    db.refresh(supplement)
    return _to_supplement_response(supplement)


@router.get("/supplements", response_model=List[SupplementResponse])
async def get_supplements(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's supplements."""
    query = db.query(Supplement).filter(
        Supplement.user_id == current_user.id,
    )
    if not include_inactive:
        query = query.filter(Supplement.is_active == True)  # noqa: E712

    supplements = query.order_by(Supplement.name).all()
    return [_to_supplement_response(s) for s in supplements]


@router.get("/supplements/daily", response_model=List[SupplementWithLogResponse])
async def get_daily_supplements(
    date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get active supplements with daily log status for a given date."""
    if date is None:
        from datetime import date as date_module
        date = date_module.today()

    # Get active supplements
    supplements = db.query(Supplement).filter(
        Supplement.user_id == current_user.id,
        Supplement.is_active == True,  # noqa: E712
    ).order_by(Supplement.name).all()

    # Get logs for this date
    logs = db.query(SupplementLog).filter(
        SupplementLog.user_id == current_user.id,
        SupplementLog.log_date == date,
        SupplementLog.taken == True,  # noqa: E712
    ).all()
    logged_ids = {log.supplement_id for log in logs}

    return [
        SupplementWithLogResponse(
            id=str(s.id),
            name=s.name,
            brand=s.brand,
            dosage=s.dosage,
            is_active=s.is_active,
            taken_today=s.id in logged_ids,
        )
        for s in supplements
    ]


@router.put("/supplements/{supplement_id}", response_model=SupplementResponse)
async def update_supplement(
    supplement_id: str,
    request: UpdateSupplementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a supplement."""
    supplement = db.query(Supplement).filter(
        Supplement.id == supplement_id,
        Supplement.user_id == current_user.id,
    ).first()

    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")

    if request.name is not None:
        # Check for duplicate name (case-insensitive), excluding current
        existing = db.query(Supplement).filter(
            Supplement.user_id == current_user.id,
            func.lower(Supplement.name) == request.name.strip().lower(),
            Supplement.id != supplement.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A supplement with this name already exists")
        supplement.name = request.name.strip()

    if request.brand is not None:
        supplement.brand = request.brand.strip() if request.brand else None
    if request.dosage is not None:
        supplement.dosage = request.dosage.strip() if request.dosage else None
    if request.notes is not None:
        supplement.notes = request.notes.strip() if request.notes else None
    if request.is_active is not None:
        supplement.is_active = request.is_active

    db.commit()
    db.refresh(supplement)
    return _to_supplement_response(supplement)


@router.delete("/supplements/{supplement_id}")
async def delete_supplement(
    supplement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a supplement and all its logs."""
    supplement = db.query(Supplement).filter(
        Supplement.id == supplement_id,
        Supplement.user_id == current_user.id,
    ).first()

    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")

    db.delete(supplement)
    db.commit()
    return {"message": "Supplement deleted"}


# --- Supplement Logging ---

@router.post("/supplements/log", response_model=SupplementLogResponse)
async def log_supplement(
    request: LogSupplementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log taking a supplement. Upserts — if a log exists for this supplement+date, updates it."""
    # Verify supplement belongs to user
    supplement = db.query(Supplement).filter(
        Supplement.id == request.supplement_id,
        Supplement.user_id == current_user.id,
    ).first()

    if not supplement:
        raise HTTPException(status_code=404, detail="Supplement not found")

    # Check for existing log
    existing = db.query(SupplementLog).filter(
        SupplementLog.supplement_id == supplement.id,
        SupplementLog.log_date == request.log_date,
    ).first()

    if existing:
        existing.taken = True
        db.commit()
        db.refresh(existing)
        return _to_log_response(existing)

    log = SupplementLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        supplement_id=supplement.id,
        log_date=request.log_date,
        taken=True,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _to_log_response(log)


@router.delete("/supplements/log/{supplement_id}/{log_date}")
async def unlog_supplement(
    supplement_id: str,
    log_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a supplement log entry."""
    log = db.query(SupplementLog).filter(
        SupplementLog.supplement_id == supplement_id,
        SupplementLog.log_date == log_date,
        SupplementLog.user_id == current_user.id,
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")

    db.delete(log)
    db.commit()
    return {"message": "Supplement log removed"}


# --- Helpers ---

def _to_supplement_response(s: Supplement) -> SupplementResponse:
    """Convert model to response."""
    return SupplementResponse(
        id=str(s.id),
        name=s.name,
        brand=s.brand,
        dosage=s.dosage,
        notes=s.notes,
        is_active=s.is_active,
        created_at=s.created_at.isoformat() if s.created_at else "",
        updated_at=s.updated_at.isoformat() if s.updated_at else "",
    )


def _to_log_response(log: SupplementLog) -> SupplementLogResponse:
    """Convert model to response."""
    return SupplementLogResponse(
        id=str(log.id),
        supplement_id=str(log.supplement_id),
        log_date=log.log_date,
        taken=log.taken,
        created_at=log.created_at.isoformat() if log.created_at else "",
    )
