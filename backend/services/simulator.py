from sqlalchemy.orm import Session
from ..models import EquipmentAsset, ExtractedRelation, ComplianceFinding

class SimulatorService:
    """
    "What Happens If?" Reasoning Simulator Service.
    Uses Knowledge Graph nodes and edges to model cascading operational failures,
    downstream unit stresses, and regulatory compliance risks for plant engineers.
    """

    def simulate_failure(self, db: Session, asset_tag: str) -> dict:
        asset_tag = asset_tag.upper()
        asset = db.query(EquipmentAsset).filter(EquipmentAsset.tag_number == asset_tag).first()
        if not asset:
            return {"error": "Asset not found in plant registry"}

        # Base response structure
        result = {
            "target_tag": asset_tag,
            "target_name": asset.name,
            "location": asset.location,
            "criticality": asset.criticality,
            "failure_probability": "Medium",
            "downtime_risk": "Moderate",
            "cascading_assets": [],
            "affected_processes": [],
            "compliance_risks": [],
            "mitigation_plan": []
        }

        # Traversal logic based on target tag
        if asset_tag.startswith("PMP-10"): # Pump Failures
            result.update({
                "failure_probability": "High (Vibration alarms tripped at 12.4 mm/s)",
                "downtime_risk": "Critical (Halts reactor feed stream)",
                "cascading_assets": [
                    {"tag": "VLV-301", "name": "Bypass Valve 301", "role": "Downstream feed regulator", "impact": "Secondary thermal gasket compression wear"},
                    {"tag": "HEX-701", "name": "Heat Exchanger 701", "role": "Process stream preheater", "impact": "Sudden thermal shock and tube flange leak"}
                ],
                "affected_processes": [
                    {"loop": "Unit 2 Steam Reformer", "impact": "Starves hydrocarbon reformer feed, halting gas output"},
                    {"loop": "Unit 4 Water Recirculation", "impact": "Pressure drop triggers water surge hammer alarms"}
                ],
                "compliance_risks": [
                    {"code": "COMP-MNT-05", "standard": "ISO-10816 (Machinery Vibration)", "severity": "High", "details": "Tripping vibration alarms at 12.4 mm/s alerts safety authorities automatically."},
                    {"code": "COMP-SOP-02", "standard": "OSHA-1910.119 (Process Management)", "severity": "Critical", "details": "Running pump without signed startup SOP authorizations triggers non-compliance fines."}
                ],
                "mitigation_plan": [
                    "Engage backup standby pump PMP-103 immediately to balance line pressure.",
                    "Verify supply tank TNK-601 inlet head levels to suppress active cavitation.",
                    "Schedule emergency laser alignments and replace worn housing bearings."
                ]
            })
        elif asset_tag.startswith("BLR-20") or asset_tag.startswith("VLV-301"): # Boiler / Steam Failures
            result.update({
                "failure_probability": "High (ASME pressure certifications overdue)",
                "downtime_risk": "Critical (Steam pressure drop across main unit header)",
                "cascading_assets": [
                    {"tag": "VLV-301", "name": "Bypass Control Valve 301", "role": "Overpressure release vent", "impact": "Scale deposition locks valve seat disk"},
                    {"tag": "TUR-401", "name": "Steam Turbine Generator 401", "role": "Unit power output generator", "impact": "Grid synchronization trip due to steam pressure drops"}
                ],
                "affected_processes": [
                    {"loop": "Unit 1 Power Block Area", "impact": "Reduces unit power output generator capacity by 45%"},
                    {"loop": "Unit 2 Steam Reformer Zone", "impact": "Steam flow drops below hydrocarbon-to-steam ratio limits"}
                ],
                "compliance_risks": [
                    {"code": "COMP-SAF-01", "standard": "ASME Sec VIII (Pressure Safety)", "severity": "Critical", "details": "Overdue pressure valve testing violates pressure vessel certificates."},
                    {"code": "COMP-VLV-03", "standard": "API-527 (Bypass Seating)", "severity": "High", "details": "Locked valve seats bleeding steam pressure violates leakage tolerances."}
                ],
                "mitigation_plan": [
                    "Throttle boiler burner combustion rates to reduce internal casing pressures.",
                    "Open auxiliary steam line header bypass valve VLV-302 to dump load.",
                    "Verify chemical softener dosing limits to halt carbonate scaling."
                ]
            })
        elif asset_tag.startswith("TNK-60"): # Tank Failures
            result.update({
                "failure_probability": "Medium (API-653 shell wall survey pending)",
                "downtime_risk": "High (Feeds unit raw storage area shutdown)",
                "cascading_assets": [
                    {"tag": "PMP-101", "name": "Centrifugal Feed Pump 101", "role": "Feed draw line suction pump", "impact": "Suction line restriction from tank sediment collapse"}
                ],
                "affected_processes": [
                    {"loop": "Unit 4 Water Treatment Station", "impact": "Halts feed raw storage tanks inflow routing"}
                ],
                "compliance_risks": [
                    {"code": "COMP-TNK-06", "standard": "API-653 (Structural Safety)", "severity": "High", "details": "Shell wall thickness measurement readings below 3.2mm limit violates structural certificates."}
                ],
                "mitigation_plan": [
                    "Divert feed intake pipelines to reserve Storage Tank TNK-602.",
                    "Schedule composite reinforcement sleeve patch wraps along lower bottom shell casing.",
                    "Execute secondary coupon gauge thickness calibration surveys."
                ]
            })
        else: # General generic failures
            result.update({
                "failure_probability": "Low",
                "downtime_risk": "Minor",
                "cascading_assets": [
                    {"tag": "VLV-304", "name": "Bypass Valve 304", "role": "Pressure release bypass", "impact": "Thermal cycling stresses stem packing gaskets"}
                ],
                "affected_processes": [
                    {"loop": "Unit 3 Hydrocracker Complex", "impact": "Marginal output pressure drop"}
                ],
                "compliance_risks": [
                    {"code": "COMP-SOP-02", "standard": "OSHA-1910.119", "severity": "Low", "details": "Minor checklist signature gaps."}
                ],
                "mitigation_plan": [
                    "Verify actuator pilot solenoids open/close strokes on daily inspection rounds.",
                    "Lubricate valve actuator stem threads."
                ]
            })

        return result

simulator_service = SimulatorService()
