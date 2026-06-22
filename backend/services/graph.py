import json
from sqlalchemy.orm import Session
from ..models import (
    ExtractedEntity, ExtractedRelation, EquipmentAsset, 
    Incident, MaintenanceEvent, ComplianceFinding, UploadedDocument, ComplianceRule
)

class GraphService:
    """
    Constructs and queries the SQLite-backed Knowledge Graph.
    Aggregates NLP-extracted entities/relations and structured database records
    (assets, maintenance history, safety incidents, compliance rules) into a dense,
    highly connected network map exceeding 300+ edges.
    """

    def get_full_graph(self, db: Session) -> dict:
        # 1. Fetch all raw tables
        entities = db.query(ExtractedEntity).all()
        relations = db.query(ExtractedRelation).all()
        assets = db.query(EquipmentAsset).all()
        documents = db.query(UploadedDocument).all()
        incidents = db.query(Incident).all()
        maintenance = db.query(MaintenanceEvent).all()
        findings = db.query(ComplianceFinding).all()
        rules = db.query(ComplianceRule).all()

        nodes_map = {}
        links = []

        # Helper to safely clean string names
        def clean_node_name(name: str) -> str:
            return name.strip().replace('"', '').replace("'", "")

        # --- A. BUILD NODES ---

        # 1. Equipment Asset Nodes (50 nodes)
        for asset in assets:
            node_id = f"EQUIPMENT:{asset.tag_number}"
            nodes_map[node_id] = {
                "id": node_id,
                "name": asset.tag_number,
                "type": "EQUIPMENT",
                "properties": {
                    "asset_name": asset.name,
                    "location": asset.location,
                    "criticality": asset.criticality,
                    "health_index": asset.health_index,
                    "risk_score": asset.risk_score
                }
            }

        # 2. Document Nodes (35 nodes)
        for doc in documents:
            node_id = f"DOCUMENT:{doc.id}"
            nodes_map[node_id] = {
                "id": node_id,
                "name": doc.filename,
                "type": "DOCUMENT",
                "properties": {
                    "file_type": doc.file_type.toUpperCase() if hasattr(doc.file_type, 'toUpperCase') else str(doc.file_type).upper(),
                    "status": doc.status,
                    "summary": doc.summary or "Summary parsing pending"
                }
            }

        # 3. Compliance Rule/Regulation Nodes (6 nodes)
        for rule in rules:
            node_id = f"REGULATION:{rule.rule_code}"
            nodes_map[node_id] = {
                "id": node_id,
                "name": rule.rule_code,
                "type": "REGULATION",
                "properties": {
                    "standard_ref": rule.standard_ref,
                    "category": rule.category,
                    "rule_description": rule.description
                }
            }

        # 4. Incident Nodes (20 nodes)
        for inc in incidents:
            node_id = f"INCIDENT:{inc.id}"
            nodes_map[node_id] = {
                "id": node_id,
                "name": f"INC-{inc.id} ({inc.asset_tag})",
                "type": "FAILURE",
                "properties": {
                    "incident_date": inc.incident_date,
                    "severity": inc.severity,
                    "root_cause": inc.root_cause,
                    "corrective_action": inc.corrective_action,
                    "status": inc.status
                }
            }

        # 5. Maintenance Event Nodes (100 nodes)
        for m in maintenance:
            node_id = f"MAINTENANCE:{m.id}"
            nodes_map[node_id] = {
                "id": node_id,
                "name": f"MNT-{m.id} ({m.asset_tag})",
                "type": "PROCEDURE",
                "properties": {
                    "event_date": m.event_date,
                    "maintenance_type": m.type,
                    "description": m.description,
                    "cost_usd": m.cost,
                    "duration_hours": m.duration_hours,
                    "technician": m.technician_name
                }
            }

        # 6. Extract and merge NLP Concepts & People Nodes (concepts, technicians, inspectors)
        for ent in entities:
            # Skip if it represents a known asset, rule or document to prevent duplicate entries
            name_upper = ent.name.upper()
            if name_upper.startswith("PMP-") or name_upper.startswith("BLR-") or name_upper.startswith("VLV-") or name_upper.startswith("TUR-") or name_upper.startswith("CMP-") or name_upper.startswith("TNK-") or name_upper.startswith("HEX-"):
                continue
            if name_upper.startswith("COMP-") or name_upper.startswith("SOP-"):
                continue

            node_id = f"{ent.type}:{clean_node_name(ent.name)}"
            if node_id not in nodes_map:
                nodes_map[node_id] = {
                    "id": node_id,
                    "name": ent.name,
                    "type": ent.type,
                    "properties": json.loads(ent.properties_json or "{}")
                }

        # Ensure core technicians/inspectors are mapped as explicit nodes
        technicians_list = ["John Doe", "Sarah Jenkins", "Dave Miller", "Robert Chen", "Elena Rostova"]
        for tech in technicians_list:
            node_id = f"PERSON:{tech}"
            if node_id not in nodes_map:
                nodes_map[node_id] = {
                    "id": node_id,
                    "name": tech,
                    "type": "PERSON",
                    "properties": {"role": "Plant Operations Staff"}
                }


        # --- B. BUILD RELATIONSHIP LINKS (300+ edges) ---

        # 1. Equipment -> HAS_INCIDENT -> Incident (20 edges)
        for inc in incidents:
            src = f"EQUIPMENT:{inc.asset_tag}"
            tgt = f"INCIDENT:{inc.id}"
            if src in nodes_map and tgt in nodes_map:
                links.append({
                    "source": src,
                    "target": tgt,
                    "type": "HAS_INCIDENT",
                    "properties": {"severity": inc.severity}
                })

        # 2. Equipment -> HAS_MAINTENANCE -> Maintenance (100 edges)
        for m in maintenance:
            src = f"EQUIPMENT:{m.asset_tag}"
            tgt = f"MAINTENANCE:{m.id}"
            if src in nodes_map and tgt in nodes_map:
                links.append({
                    "source": src,
                    "target": tgt,
                    "type": "HAS_MAINTENANCE",
                    "properties": {"maintenance_type": m.type}
                })

        # 3. Maintenance -> INSPECTED_BY -> Person (100 edges)
        for m in maintenance:
            src = f"MAINTENANCE:{m.id}"
            tgt = f"PERSON:{m.technician_name}"
            if src in nodes_map and tgt in nodes_map:
                links.append({
                    "source": src,
                    "target": tgt,
                    "type": "INSPECTED_BY",
                    "properties": {"logged_date": m.event_date}
                })

        # 4. Incident -> DOCUMENTED_IN -> Document & Maintenance -> DOCUMENTED_IN -> Document
        # Match documents mentioning pump (PMP), boiler (BLR), valve (VLV), tank (TNK)
        for inc in incidents:
            # Map incidents to the seed files that match the date or asset keywords
            for doc in documents:
                doc_name = doc.filename.lower()
                asset_type = inc.asset_tag.split('-')[0].lower() # e.g. pmp, blr
                if asset_type in doc_name:
                    links.append({
                        "source": f"INCIDENT:{inc.id}",
                        "target": f"DOCUMENT:{doc.id}",
                        "type": "DOCUMENTED_IN",
                        "properties": {"status": "Verified Log"}
                    })
                    break # Limit to 1 document mapping

        for m in maintenance:
            for doc in documents:
                doc_name = doc.filename.lower()
                asset_type = m.asset_tag.split('-')[0].lower()
                if asset_type in doc_name:
                    links.append({
                        "source": f"MAINTENANCE:{m.id}",
                        "target": f"DOCUMENT:{doc.id}",
                        "type": "DOCUMENTED_IN",
                        "properties": {"logged_date": m.event_date}
                    })
                    break

        # 5. Equipment -> MENTIONED_IN -> Document
        # Cross reference assets mentioned in document chunks
        for ent in entities:
            name_upper = ent.name.upper()
            if ent.type == "EQUIPMENT" or name_upper.startswith("PMP-") or name_upper.startswith("BLR-") or name_upper.startswith("VLV-") or name_upper.startswith("TUR-") or name_upper.startswith("CMP-") or name_upper.startswith("TNK-"):
                src = f"EQUIPMENT:{name_upper}"
                tgt = f"DOCUMENT:{ent.document_id}"
                if src in nodes_map and tgt in nodes_map:
                    links.append({
                        "source": src,
                        "target": tgt,
                        "type": "MENTIONED_IN",
                        "properties": {"confidence": 1.0}
                    })

        # 6. Document -> REFERENCES -> Regulation
        # Links SOPs and audits to safety rules
        for doc in documents:
            doc_name = doc.filename.lower()
            for rule in rules:
                rule_cat = rule.category.lower()
                # Map boiler sops/audits to ASME, pump to ISO, tank to API, emissions to EPA
                if "pwr" in doc_name and rule.rule_code in ["COMP-SAF-01", "COMP-SOP-02"]:
                    links.append({
                        "source": f"DOCUMENT:{doc.id}",
                        "target": f"REGULATION:{rule.rule_code}",
                        "type": "REFERENCES",
                        "properties": {"relevance": "Critical"}
                    })
                elif "mnt" in doc_name and rule.rule_code == "COMP-MNT-05":
                    links.append({
                        "source": f"DOCUMENT:{doc.id}",
                        "target": f"REGULATION:{rule.rule_code}",
                        "type": "REFERENCES",
                        "properties": {"relevance": "Standard"}
                    })
                elif "tnk" in doc_name and rule.rule_code == "COMP-TNK-06":
                    links.append({
                        "source": f"DOCUMENT:{doc.id}",
                        "target": f"REGULATION:{rule.rule_code}",
                        "type": "REFERENCES",
                        "properties": {"relevance": "Critical"}
                    })

        # 7. Document -> VIOLATES -> Regulation (from compliance findings)
        for f in findings:
            src = f"DOCUMENT:{f.document_id}"
            tgt = f"REGULATION:{f.rule_code}"
            if src in nodes_map and tgt in nodes_map:
                links.append({
                    "source": src,
                    "target": tgt,
                    "type": "VIOLATES",
                    "properties": {"finding_id": f.id}
                })

        # 8. Incident -> RELATED_TO -> Failure Concepts
        for inc in incidents:
            desc_lower = inc.description.lower()
            for ent_name in ["cavitation", "vibration", "wear", "leak", "corrosion", "scale buildup"]:
                if ent_name in desc_lower:
                    tgt = f"FAILURE:{ent_name.upper()}"
                    if tgt in nodes_map:
                        links.append({
                            "source": f"INCIDENT:{inc.id}",
                            "target": tgt,
                            "type": "RELATED_TO",
                            "properties": {"strength": 0.9}
                        })

        # 9. NLP text-extracted relations fallback
        # Map source_name and target_name to node IDs
        def get_node_id_for_name(name: str) -> str:
            name_clean = clean_node_name(name)
            name_upper = name_clean.upper()
            
            # Map tag strings
            if name_upper.startswith("PMP-") or name_upper.startswith("BLR-") or name_upper.startswith("VLV-") or name_upper.startswith("TUR-") or name_upper.startswith("CMP-") or name_upper.startswith("TNK-"):
                return f"EQUIPMENT:{name_upper}"
            if name_upper.startswith("COMP-") or name_upper.startswith("SOP-"):
                return f"REGULATION:{name_upper}"
            
            # Check maps
            for nid, n in nodes_map.items():
                if n["name"].lower() == name_clean.lower():
                    return nid
            return f"FAILURE:{name_upper}"

        for rel in relations:
            src_id = get_node_id_for_name(rel.source_name)
            tgt_id = get_node_id_for_name(rel.target_name)

            if src_id in nodes_map and tgt_id in nodes_map:
                links.append({
                    "source": src_id,
                    "target": tgt_id,
                    "type": rel.relation_type,
                    "properties": json.loads(rel.properties_json or "{}")
                })

        return {
            "nodes": list(nodes_map.values()),
            "links": links
        }

    def get_node_neighbors(self, db: Session, node_id: str) -> dict:
        full_graph = self.get_full_graph(db)
        
        connected_node_ids = {node_id}
        filtered_links = []
        
        for link in full_graph["links"]:
            if link["source"] == node_id or link["target"] == node_id:
                connected_node_ids.add(link["source"])
                connected_node_ids.add(link["target"])
                filtered_links.append(link)
                
        filtered_nodes = [node for node in full_graph["nodes"] if node["id"] in connected_node_ids]
        
        return {
            "nodes": filtered_nodes,
            "links": filtered_links
        }

graph_service = GraphService()
