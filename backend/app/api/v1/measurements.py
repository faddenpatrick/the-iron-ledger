"""Body measurements API endpoints."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from pydantic import BaseModel
from typing import Optional, List

from ...database import get_db
from ...models.user import User, BodyMeasurement
from ..deps import get_current_user


router = APIRouter()


class CreateMeasurementRequest(BaseModel):
    """Request to log a body measurement."""
    measurement_date: date
    weight: Optional[float] = None
    notes: Optional[str] = None


class MeasurementResponse(BaseModel):
    """Body measurement response."""
    id: str
    measurement_date: date
    weight: Optional[float]
    notes: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


@router.post("/measurements", response_model=MeasurementResponse)
async def log_measurement(
    request: CreateMeasurementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Log a body measurement. Upserts — if an entry exists for the given date, it updates it.
    """
    # Check for existing entry on this date
    existing = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id,
        BodyMeasurement.measurement_date == request.measurement_date,
    ).first()

    if existing:
        # Update existing entry
        if request.weight is not None:
            existing.weight = request.weight
        if request.notes is not None:
            existing.notes = request.notes
        db.commit()
        db.refresh(existing)
        return _to_response(existing)

    # Create new entry
    measurement = BodyMeasurement(
        id=uuid.uuid4(),
        user_id=current_user.id,
        measurement_date=request.measurement_date,
        weight=request.weight,
        notes=request.notes,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return _to_response(measurement)


@router.get("/measurements", response_model=List[MeasurementResponse])
async def get_measurements(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get body measurements in a date range. Defaults to last 30 days."""
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=30)

    measurements = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id,
        BodyMeasurement.measurement_date >= start_date,
        BodyMeasurement.measurement_date <= end_date,
    ).order_by(BodyMeasurement.measurement_date.desc()).all()

    return [_to_response(m) for m in measurements]


@router.get("/measurements/latest", response_model=Optional[MeasurementResponse])
async def get_latest_measurement(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the most recent body measurement."""
    measurement = db.query(BodyMeasurement).filter(
        BodyMeasurement.user_id == current_user.id,
    ).order_by(BodyMeasurement.measurement_date.desc()).first()

    if not measurement:
        return None

    return _to_response(measurement)


@router.delete("/measurements/{measurement_id}")
async def delete_measurement(
    measurement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a body measurement."""
    measurement = db.query(BodyMeasurement).filter(
        BodyMeasurement.id == measurement_id,
        BodyMeasurement.user_id == current_user.id,
    ).first()

    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")

    db.delete(measurement)
    db.commit()
    return {"message": "Measurement deleted"}


def _to_response(m: BodyMeasurement) -> MeasurementResponse:
    """Convert model to response."""
    return MeasurementResponse(
        id=str(m.id),
        measurement_date=m.measurement_date,
        weight=m.weight,
        notes=m.notes,
        created_at=m.created_at.isoformat() if m.created_at else "",
        updated_at=m.updated_at.isoformat() if m.updated_at else "",
    )
