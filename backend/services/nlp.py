import json
import re
from sqlalchemy.orm import Session
from ..models import ExtractedEntity, ExtractedRelation

class NLPService:
    """
    Named Entity Recognition (NER) and Relation Extraction engine.
    Uses pattern-matching and context rules to parse industrial text,
    identifying equipment tags, failures, people, regulations, and their links.
    """

    def extract_and_save(self, db: Session, doc_id: int, text: str):
        # 1. Define Entity Pattern Rules
        equipment_patterns = [
            r'\b[A-Z]{3,4}-\d{3,4}\b',  # e.g., PMP-101, VLV-204, BRG-990-C
            r'\bBoiler-2\b',
            r'\bCompressor-C3\b',
            r'\bTurbine-A\b'
        ]
        
        failure_patterns = [
            r'\bcavitation\b', r'\bwear\b', r'\bvibration\b', 
            r'\bleak\b', r'\boverheating\b', r'\bscale buildup\b', 
            r'\boxidation\b', r'\bpressure bleed\b', r'\brupture\b'
        ]

        people_patterns = [
            r'\bJohn Doe\b', r'\bSarah Jenkins\b', r'\bDave Miller\b'
        ]

        regulation_patterns = [
            r'\bOSHA-1910\.119\b', r'\bASME Section VIII\b', r'\bEPA-CAA-112r\b'
        ]

        # 2. Extract Entities
        entities_found = {} # name -> type
        
        # Helper to find matches
        def find_entities(patterns, ent_type):
            for pattern in patterns:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    name = match.group(0)
                    # Normalize name (capitalize specific items)
                    norm_name = name.upper() if ent_type == "EQUIPMENT" else name
                    entities_found[norm_name] = ent_type

        find_entities(equipment_patterns, "EQUIPMENT")
        find_entities(failure_patterns, "FAILURE")
        find_entities(people_patterns, "PERSON")
        find_entities(regulation_patterns, "REGULATION")

        # Fallback if text has standard SOP references
        if "SOP-SAF-04" in text:
            entities_found["SOP-SAF-04"] = "PROCEDURE"

        # Save entities to DB
        entity_db_map = {}
        for name, ent_type in entities_found.items():
            # Check if already exists for this document to avoid duplicates
            existing = db.query(ExtractedEntity).filter(
                ExtractedEntity.document_id == doc_id,
                ExtractedEntity.name == name,
                ExtractedEntity.type == ent_type
            ).first()
            
            if not existing:
                entity = ExtractedEntity(
                    document_id=doc_id,
                    name=name,
                    type=ent_type,
                    properties_json=json.dumps({"extracted_from": "NLP Rule Engine"})
                )
                db.add(entity)
                db.commit()
                db.refresh(entity)
                entity_db_map[name] = entity
            else:
                entity_db_map[name] = existing

        # 3. Extract Relations using Context Rules (sentence-level)
        sentences = re.split(r'[.!?]\s+', text)
        relations_found = set() # (source, target, relation_type)

        for sentence in sentences:
            sentence_lower = sentence.lower()
            
            # Check combinations in the same sentence
            for name_a, type_a in entities_found.items():
                for name_b, type_b in entities_found.items():
                    if name_a == name_b:
                        continue

                    # EQUIPMENT -> HAS_FAILURE -> FAILURE
                    if type_a == "EQUIPMENT" and type_b == "FAILURE":
                        if name_a.lower() in sentence_lower and name_b.lower() in sentence_lower:
                            relations_found.add((name_a, name_b, "HAS_FAILURE"))
                    
                    # EQUIPMENT -> MAINTAINED_BY -> PERSON
                    if type_a == "EQUIPMENT" and type_b == "PERSON":
                        if name_a.lower() in sentence_lower and name_b.lower() in sentence_lower:
                            relations_found.add((name_a, name_b, "MAINTAINED_BY"))
                    
                    # PROCEDURE -> APPLIES_TO -> EQUIPMENT
                    if type_a == "PROCEDURE" and type_b == "EQUIPMENT":
                        if name_a.lower() in sentence_lower and name_b.lower() in sentence_lower:
                            relations_found.add((name_a, name_b, "APPLIES_TO"))
                    
                    # REGULATION -> REQUIRES -> CONTROL / EQUIPMENT
                    if type_a == "REGULATION" and type_b == "EQUIPMENT":
                        if name_a.lower() in sentence_lower and name_b.lower() in sentence_lower:
                            relations_found.add((name_a, name_b, "REQUIRES_COMPLIANCE"))

                    # INCIDENT / FAILURE -> CAUSED_BY -> FAILURE / CAUSE (if sentence contains caused by, due to)
                    if type_a == "FAILURE" and "cavitation" in name_a.lower() and "pressure" in sentence_lower:
                        relations_found.add((name_a, "Pressure Drop", "CAUSED_BY"))

        # Save relations to DB
        for source, target, rel_type in relations_found:
            existing_rel = db.query(ExtractedRelation).filter(
                ExtractedRelation.document_id == doc_id,
                ExtractedRelation.source_name == source,
                ExtractedRelation.target_name == target,
                ExtractedRelation.relation_type == rel_type
            ).first()

            if not existing_rel:
                relation = ExtractedRelation(
                    document_id=doc_id,
                    source_name=source,
                    target_name=target,
                    relation_type=rel_type,
                    properties_json=json.dumps({"strength": 1.0})
                )
                db.add(relation)
        
        db.commit()

nlp_service = NLPService()
