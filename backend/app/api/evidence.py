from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Brand, EvidenceSource, User, AuditEvent
from app.enums import UserRole, EvidenceStatus, EvidenceType
from app.security import get_current_user, require_roles
from app.schemas import EvidenceSourceResponse, EvidenceSourceCreate, EvidenceSourceUpdate
from app.services.document_parser import DocumentParserService

router = APIRouter(tags=["Evidence Store & Custody"])

@router.get("/brands/{brand_id}/evidence", response_model=List[EvidenceSourceResponse])
async def list_evidence(
    brand_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    result = await db.execute(
        select(EvidenceSource)
        .where(EvidenceSource.brand_id == brand_id)
        .order_by(EvidenceSource.created_at.desc())
    )
    return [EvidenceSourceResponse.model_validate(e) for e in result.scalars().all()]

@router.post("/brands/{brand_id}/evidence", response_model=EvidenceSourceResponse)
async def create_evidence(
    brand_id: str,
    payload: EvidenceSourceCreate,
    current_user: User = Depends(require_roles(UserRole.EVIDENCE_CUSTODIAN, UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    new_ev = EvidenceSource(
        brand_id=brand_id,
        title=payload.title,
        source_type=payload.source_type,
        url=payload.url,
        file_path=payload.file_path,
        document_text=payload.document_text,
        publication_date=payload.publication_date or datetime.utcnow(),
        expiration_date=payload.expiration_date,
        verification_status=payload.verification_status,
        responsible_owner=payload.responsible_owner or current_user.full_name,
        verification_notes=payload.verification_notes
    )
    db.add(new_ev)
    await db.flush()

    # Audit event
    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="EVIDENCE_INGESTED",
        entity_type="EvidenceSource",
        entity_id=new_ev.id,
        description=f"Evidence source '{new_ev.title}' ingested by {current_user.full_name}",
        metadata_json={"source_type": new_ev.source_type.value, "status": new_ev.verification_status.value}
    )
    db.add(event)
    await db.commit()

    return EvidenceSourceResponse.model_validate(new_ev)

@router.post("/brands/{brand_id}/evidence/upload", response_model=EvidenceSourceResponse)
async def upload_evidence_document(
    brand_id: str,
    title: str = Form(...),
    source_type: EvidenceType = Form(EvidenceType.BENCHMARK_REPORT),
    verification_status: EvidenceStatus = Form(EvidenceStatus.VERIFIED),
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles(UserRole.EVIDENCE_CUSTODIAN, UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    brand_res = await db.execute(
        select(Brand).where(Brand.id == brand_id, Brand.organization_id == current_user.organization_id)
    )
    if not brand_res.scalars().first():
        raise HTTPException(status_code=404, detail="Brand workspace not found.")

    file_bytes = await file.read()
    success, text_or_err = DocumentParserService.extract_text_from_bytes(file.filename, file_bytes)
    if not success:
        raise HTTPException(status_code=400, detail=text_or_err)

    new_ev = EvidenceSource(
        brand_id=brand_id,
        title=title,
        source_type=source_type,
        file_path=file.filename,
        document_text=text_or_err,
        publication_date=datetime.utcnow(),
        verification_status=verification_status,
        responsible_owner=current_user.full_name,
        verification_notes=f"Parsed from uploaded document '{file.filename}' ({len(text_or_err)} characters extracted)."
    )
    db.add(new_ev)
    await db.flush()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="EVIDENCE_UPLOADED",
        entity_type="EvidenceSource",
        entity_id=new_ev.id,
        description=f"Document '{file.filename}' uploaded and parsed for evidence '{title}'",
        metadata_json={"filename": file.filename, "size": len(file_bytes)}
    )
    db.add(event)
    await db.commit()

    return EvidenceSourceResponse.model_validate(new_ev)

@router.put("/evidence/{evidence_id}", response_model=EvidenceSourceResponse)
async def update_evidence_source(
    evidence_id: str,
    payload: EvidenceSourceUpdate,
    current_user: User = Depends(require_roles(UserRole.EVIDENCE_CUSTODIAN, UserRole.BRAND_MANAGER, UserRole.ORGANIZATION_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(EvidenceSource)
        .join(Brand, EvidenceSource.brand_id == Brand.id)
        .where(EvidenceSource.id == evidence_id, Brand.organization_id == current_user.organization_id)
    )
    ev = result.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence source not found.")

    if payload.title is not None:
        ev.title = payload.title
    if payload.source_type is not None:
        ev.source_type = payload.source_type
    if payload.document_text is not None:
        ev.document_text = payload.document_text
    if payload.expiration_date is not None:
        ev.expiration_date = payload.expiration_date
    if payload.verification_status is not None:
        ev.verification_status = payload.verification_status
    if payload.responsible_owner is not None:
        ev.responsible_owner = payload.responsible_owner
    if payload.verification_notes is not None:
        ev.verification_notes = payload.verification_notes

    ev.updated_at = datetime.utcnow()

    event = AuditEvent(
        organization_id=current_user.organization_id,
        actor_id=current_user.id,
        event_type="EVIDENCE_STATUS_UPDATED",
        entity_type="EvidenceSource",
        entity_id=ev.id,
        description=f"Evidence '{ev.title}' verification status updated to {ev.verification_status.value}",
        metadata_json={"status": ev.verification_status.value}
    )
    db.add(event)
    await db.commit()

    return EvidenceSourceResponse.model_validate(ev)
