import json
from sqlalchemy.orm import Session
from ..models import ComplianceRule, ComplianceFinding, UploadedDocument

class ComplianceService:
    """
    Analyses ingested documents against safety, environmental, operational, and structural regulations.
    Detects compliance gaps (outdated certificates, missing signatures, leaks, emissions,
    vibration deviations, wall thickness limits), calculates plant-wide compliance score,
    and drafts corrective tasks.
    """

    def audit_documents(self, db: Session) -> dict:
        # 1. Fetch rules and completed documents
        rules = db.query(ComplianceRule).all()
        documents = db.query(UploadedDocument).filter(UploadedDocument.status == "Completed").all()
        
        # Clear existing findings to perform fresh audit
        db.query(ComplianceFinding).delete()
        db.commit()

        for rule in rules:
            for doc in documents:
                # Fetch full text from chunks
                full_text = " ".join([c.text_content for c in doc.chunks])
                full_text_lower = full_text.lower()
                doc_name_lower = doc.filename.lower()

                # Audit Status initializations
                status = "Compliant"
                gap_details = None
                corrective_actions = []

                # --- 1. PRESSURE VALVE SAFETY VALVES (ASME SEC VIII / COMP-SAF-01) ---
                if rule.rule_code == "COMP-SAF-01":
                    if "boiler" in full_text_lower and ("valve" in full_text_lower or "asme" in full_text_lower):
                        if any(k in full_text_lower for k in ["expired", "due on", "deviation", "fail"]):
                            status = "Gap"
                            gap_details = (
                                f"ASME Section VIII pressure release safety valve certification is EXPIRED or pending sign-off "
                                f"as logged in '{doc.filename}'."
                            )
                            corrective_actions = [
                                {
                                    "action": "Schedule external inspector for ASME certification validation on boiler pressure relief systems.",
                                    "assignee": "Sarah Jenkins (EHS Lead)",
                                    "deadline": "2026-07-10"
                                }
                            ]

                # --- 2. SOP REVIEW AND SIGNATURES (OSHA 1910.119 / COMP-SOP-02) ---
                elif rule.rule_code == "COMP-SOP-02":
                    if "sop" in doc_name_lower or "procedure" in doc_name_lower:
                        if any(k in full_text_lower for k in ["missing signature", "unsigned", "fail", "draft"]):
                            status = "Gap"
                            gap_details = (
                                f"Operational Procedure safety review lacks mandatory Lead Engineer sign-off / signature "
                                f"as noted in '{doc.filename}'."
                            )
                            corrective_actions = [
                                {
                                    "action": "Route SOP modifications to Lead Engineer for formal digital sign-off and safety audit approval.",
                                    "assignee": "Dave Miller (Operations Manager)",
                                    "deadline": "2026-07-05"
                                }
                            ]

                # --- 3. BYPASS VALVE SEATING AND SEALS (API 527 / COMP-VLV-03) ---
                elif rule.rule_code == "COMP-VLV-03":
                    if "valve" in full_text_lower and ("bypass" in full_text_lower or "leak" in full_text_lower or "seat" in full_text_lower):
                        if any(k in full_text_lower for k in ["did not seat", "bleed", "scale buildup", "failure"]):
                            status = "Gap"
                            gap_details = (
                                f"Bypass valve did not seat fully, resulting in minor steam/pressure bleeding "
                                f"and scale deposits. Reference: '{doc.filename}'."
                            )
                            corrective_actions = [
                                {
                                    "action": "Isolate valve bypass line, scrape off deposit scale, and perform seat alignment check.",
                                    "assignee": "John Doe (Lead Technician)",
                                    "deadline": "2026-07-08"
                                }
                            ]

                # --- 4. EXHAUST EMISSIONS AUDITING (EPA CAA 112r / COMP-ENV-04) ---
                elif rule.rule_code == "COMP-ENV-04":
                    if "emission" in full_text_lower or "exhaust" in full_text_lower or "stack" in full_text_lower:
                        if any(k in full_text_lower for k in ["exceeded", "missing", "limits", "nox", "so2"]):
                            status = "Gap"
                            gap_details = (
                                f"Environmental stack exhaust emissions log audit flagged carbon/NOx threshold deviations. "
                                f"Reference log: '{doc.filename}'."
                            )
                            corrective_actions = [
                                {
                                    "action": "Recalibrate boiler fuel-to-air burners and upload exhaust telemetry validation reports to EPA console.",
                                    "assignee": "Sarah Jenkins (EHS Lead)",
                                    "deadline": "2026-07-15"
                                }
                            ]

                # --- 5. CRITICAL ASSET VIBRATION (ISO 10816 / COMP-MNT-05) ---
                elif rule.rule_code == "COMP-MNT-05":
                    if "vibration" in full_text_lower and ("pump" in full_text_lower or "compressor" in full_text_lower):
                        if any(k in full_text_lower for k in ["exceeded", "12.4 mm/s", "severe", "wear", "critical", "vibration alarm"]):
                            status = "Gap"
                            gap_details = (
                                f"ISO 10816 vibration parameters exceeded on rotating machinery. Vibration limits breached "
                                f"as noted in '{doc.filename}'."
                            )
                            corrective_actions = [
                                {
                                    "action": "Complete rotor shaft laser alignment, inspect bearing casing lubrication levels, and replace worn bushings.",
                                    "assignee": "John Doe (Lead Technician)",
                                    "deadline": "2026-07-12"
                                }
                            ]

                # --- 6. TANK CASING WALL THICKNESS (API 653 / COMP-TNK-06) ---
                elif rule.rule_code == "COMP-TNK-06":
                    if "tank" in full_text_lower and ("thickness" in full_text_lower or "ultrasonic" in full_text_lower):
                        if any(k in full_text_lower for k in ["corrosion", "below limit", "wearing", "thinning", "alert"]):
                            status = "Gap"
                            gap_details = (
                                f"API 653 wall thickness inspection flagged structural casing thinning due to localized corrosion. "
                                f"Reference: '{doc.filename}'."
                            )
                            corrective_actions = [
                                {
                                    "action": "Schedule composite sleeve reinforcement or coupon plate weld repairs for localized tank corrosion.",
                                    "assignee": "Dave Miller (Operations Manager)",
                                    "deadline": "2026-07-20"
                                }
                            ]

                # Save findings to DB if a Gap was detected or relevant metadata matches
                if status == "Gap":
                    finding = ComplianceFinding(
                        document_id=doc.id,
                        rule_code=rule.rule_code,
                        status=status,
                        gap_details=gap_details,
                        corrective_actions_json=json.dumps(corrective_actions)
                    )
                    db.add(finding)
                elif any(k in full_text_lower for k in ["boiler", "pump", "valve", "sop", "tank", "emission"]):
                    # Record a generic compliant check
                    finding = ComplianceFinding(
                        document_id=doc.id,
                        rule_code=rule.rule_code,
                        status="Compliant",
                        gap_details=None,
                        corrective_actions_json="[]"
                    )
                    db.add(finding)

        db.commit()

    def get_summary(self, db: Session) -> dict:
        # Run audit first to ensure findings are fresh
        self.audit_documents(db)
        
        # Calculate stats
        total_rules = db.query(ComplianceRule).count()
        findings = db.query(ComplianceFinding).all()
        
        gaps = [f for f in findings if f.status == "Gap"]
        compliant_count = db.query(ComplianceFinding).filter(ComplianceFinding.status == "Compliant").count()
        
        # Calculate a dynamic safety audit index
        deductions = len(gaps) * 6  # Deduct 6 points per outstanding gap
        score = max(100 - deductions, 30)
        if total_rules == 0:
            score = 100

        gap_list = []
        for g in gaps:
            rule = db.query(ComplianceRule).filter(ComplianceRule.rule_code == g.rule_code).first()
            doc = db.query(UploadedDocument).filter(UploadedDocument.id == g.document_id).first()
            
            gap_list.append({
                "id": g.id,
                "document_name": doc.filename if doc else "System Log",
                "rule_code": g.rule_code,
                "rule_description": rule.description if rule else "",
                "category": rule.category if rule else "General",
                "status": g.status,
                "gap_details": g.gap_details,
                "corrective_actions": json.loads(g.corrective_actions_json or "[]")
            })

        return {
            "compliance_score": score,
            "total_rules_checked": total_rules,
            "active_gaps_count": len(gaps),
            "compliant_checks_count": compliant_count,
            "gaps": gap_list
        }

compliance_service = ComplianceService()
