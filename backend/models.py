import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_type = Column(String)
    status = Column(String, default="Pending") # Pending, Processing, Completed, Failed
    summary = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    entities = relationship("ExtractedEntity", back_populates="document", cascade="all, delete-orphan")
    relations = relationship("ExtractedRelation", back_populates="document", cascade="all, delete-orphan")
    compliance_findings = relationship("ComplianceFinding", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id"))
    text_content = Column(Text)
    page_num = Column(Integer)
    chunk_index = Column(Integer)

    document = relationship("UploadedDocument", back_populates="chunks")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id"))
    name = Column(String, index=True)
    type = Column(String, index=True) # EQUIPMENT, FAILURE, PERSON, REGULATION, PROCESS_PARAM, etc.
    properties_json = Column(Text, default="{}")

    document = relationship("UploadedDocument", back_populates="entities")

class ExtractedRelation(Base):
    __tablename__ = "extracted_relations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id"))
    source_name = Column(String, index=True)
    target_name = Column(String, index=True)
    relation_type = Column(String, index=True) # HAS_FAILURE, APPLIES_TO, MAINTAINED_BY, REQUIRES, CAUSED_BY
    properties_json = Column(Text, default="{}")

    document = relationship("UploadedDocument", back_populates="relations")

class EquipmentAsset(Base):
    __tablename__ = "equipment_assets"

    id = Column(Integer, primary_key=True, index=True)
    tag_number = Column(String, unique=True, index=True)
    name = Column(String)
    location = Column(String)
    criticality = Column(String) # High, Medium, Low
    risk_score = Column(Float, default=0.0) # 0 to 100
    health_index = Column(Float, default=100.0) # 0 to 100

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, index=True)
    incident_date = Column(String)
    description = Column(Text)
    severity = Column(String) # Critical, Major, Minor
    root_cause = Column(Text)
    corrective_action = Column(Text)
    status = Column(String, default="Closed") # Open, Under Investigation, Closed

class MaintenanceEvent(Base):
    __tablename__ = "maintenance_events"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, index=True)
    event_date = Column(String)
    type = Column(String) # Preventive, Corrective, Predictive
    description = Column(Text)
    technician_name = Column(String)
    cost = Column(Float, default=0.0)
    duration_hours = Column(Float, default=0.0)

class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String, unique=True, index=True)
    description = Column(Text)
    category = Column(String) # Safety, Process, Environmental
    standard_ref = Column(String)

class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("uploaded_documents.id"))
    rule_code = Column(String, index=True)
    status = Column(String) # Compliant, Gap
    gap_details = Column(Text, nullable=True)
    corrective_actions_json = Column(Text, default="[]")

    document = relationship("UploadedDocument", back_populates="compliance_findings")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    sender = Column(String) # User, Assistant
    text = Column(Text)
    citations_json = Column(Text, default="[]") # List of dicts with document name, page, text snippet
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
