from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class Citation(BaseModel):
    document_name: str
    page_num: Optional[int] = None
    snippet: str
    confidence: float

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    sender: str
    text: str
    citations: List[Citation]
    created_at: datetime

# Compliance Schemas
class CorrectiveAction(BaseModel):
    action: str
    assignee: str
    deadline: str

class ComplianceFindingResponse(BaseModel):
    id: int
    document_name: str
    rule_code: str
    rule_description: str
    category: str
    status: str
    gap_details: Optional[str] = None
    corrective_actions: List[CorrectiveAction] = []

# Asset and RCA Schemas
class AssetRiskResponse(BaseModel):
    tag_number: str
    name: str
    location: str
    criticality: str
    risk_score: float
    health_index: float
    recent_incidents_count: int
    suggested_actions: List[str]

class MaintenanceEventResponse(BaseModel):
    id: int
    asset_tag: str
    event_date: str
    type: str
    description: str
    technician_name: str
    cost: float
    duration_hours: float

# Graph Schemas
class GraphNode(BaseModel):
    id: str  # Format: "Type:Name" e.g., "EQUIPMENT:Boiler-2"
    name: str
    type: str
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str
    properties: Dict[str, Any] = {}

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphEdge]

# Incident / Lesson Learned Schemas
class LessonCard(BaseModel):
    id: int
    title: str
    category: str
    equipment_affected: str
    incident_date: str
    findings: str
    preventive_measure: str
    severity: str
