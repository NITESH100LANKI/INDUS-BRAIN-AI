import os
import random
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from .models import EquipmentAsset, ComplianceRule, Incident, MaintenanceEvent, UploadedDocument, DocumentChunk, ExtractedEntity, ExtractedRelation, ComplianceFinding
from .services.ingestion import ingestion_service

SEED_DIR = "./seed_documents"

def seed_database(db: Session):
    # 1. Clear database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database tables cleared and re-created for INDUS ENERGY PLANT.")

    # 2. Seed 50 Equipment Assets
    # 15 Pumps (PMP-101 to PMP-115)
    # 5 Boilers (BLR-201 to BLR-205)
    # 15 Valves (VLV-301 to VLV-315)
    # 5 Turbines (TUR-401 to TUR-405)
    # 5 Compressors (CMP-501 to CMP-505)
    # 5 Storage Tanks (TNK-601 to TNK-605)
    assets = []
    
    # Locations list
    locations = [
        "Unit 1 - Power Block Area", 
        "Unit 2 - Steam Reformer Zone", 
        "Unit 3 - Hydrocracker Complex", 
        "Unit 4 - Water Treatment Station"
    ]
    
    # Helper to create asset list
    # Pumps
    for i in range(101, 116):
        assets.append(EquipmentAsset(
            tag_number=f"PMP-{i}",
            name=f"Centrifugal Hydrocarbon Feed Pump {i}",
            location=locations[i % len(locations)],
            criticality="High" if i <= 104 else "Medium",
            risk_score=0.0,
            health_index=100.0
        ))
    
    # Boilers
    for i in range(201, 206):
        assets.append(EquipmentAsset(
            tag_number=f"BLR-{i}",
            name=f"High Pressure Steam Boiler {i}",
            location=locations[0], # Power area
            criticality="High",
            risk_score=0.0,
            health_index=100.0
        ))

    # Valves
    for i in range(301, 316):
        assets.append(EquipmentAsset(
            tag_number=f"VLV-{i}",
            name=f"Emergency Bypass Isolation Valve {i}",
            location=locations[i % len(locations)],
            criticality="High" if i <= 305 else "Medium",
            risk_score=0.0,
            health_index=100.0
        ))

    # Turbines
    for i in range(401, 406):
        assets.append(EquipmentAsset(
            tag_number=f"TUR-{i}",
            name=f"Steam Turbine Power Generator {i}",
            location=locations[0],
            criticality="High",
            risk_score=0.0,
            health_index=100.0
        ))

    # Compressors
    for i in range(501, 506):
        assets.append(EquipmentAsset(
            tag_number=f"CMP-{i}",
            name=f"Screw Process Air Compressor {i}",
            location=locations[2], # Hydrocracker
            criticality="Medium",
            risk_score=0.0,
            health_index=100.0
        ))

    # Tanks
    for i in range(601, 606):
        assets.append(EquipmentAsset(
            tag_number=f"TNK-{i}",
            name=f"Hydrocarbon Feed Storage Tank {i}",
            location=locations[3], # Water / Storage area
            criticality="High" if i == 601 else "Medium",
            risk_score=0.0,
            health_index=100.0
        ))

    db.add_all(assets)
    db.commit()
    print("50 Assets seeded successfully.")

    # 3. Seed Compliance Rules
    rules = [
        ComplianceRule(rule_code="COMP-SAF-01", description="Safety release valve must undergo ASME Section VIII certificate testing annually.", category="Safety", standard_ref="ASME-Sec-VIII"),
        ComplianceRule(rule_code="COMP-SOP-02", description="Standard Operating Procedures (SOPs) must be reviewed annually and bear lead engineer signatures.", category="Operations", standard_ref="OSHA-1910.119"),
        ComplianceRule(rule_code="COMP-VLV-03", description="Emergency bypass valves must fully seat and maintain zero pressure leakage during bypass mode.", category="Safety", standard_ref="API-527"),
        ComplianceRule(rule_code="COMP-ENV-04", description="Environmental stack emissions logs must be reviewed and certified monthly.", category="Environmental", standard_ref="EPA-CAA-112r"),
        ComplianceRule(rule_code="COMP-MNT-05", description="Critical rotating machinery vibration telemetry records must remain below critical limits (4.5 mm/s).", category="Maintenance", standard_ref="ISO-10816"),
        ComplianceRule(rule_code="COMP-TNK-06", description="Five-year tank wall thickness casing inspection surveys must be verified.", category="Structural", standard_ref="API-653")
    ]
    db.add_all(rules)
    db.commit()
    print("6 Compliance rules seeded.")

    # 4. Seed 20 Safety Incidents with clear RCA patterns and recurring breakdowns
    # Pattern 1: Pump cavitation and wear due to suction starvation on PMP-101/PMP-102
    # Pattern 2: Valve scaling leakage on VLV-301/VLV-302 on Boiler bypass
    # Pattern 3: Casing corrosion on Tank TNK-601
    # Pattern 4: Compressor overheating on CMP-501
    incidents = [
        # Pump Vibration/Cavitation recurrences
        Incident(asset_tag="PMP-101", incident_date="2025-03-12", description="Heavy impeller casing vibration (12.4 mm/s). Vapor bubble implosion noted. Seal integrity degraded.", severity="Critical", root_cause="Suction line strainer obstruction causing suction head pressure drops.", corrective_action="Replaced bearings, aligned shaft, cleaned strainer.", status="Closed"),
        Incident(asset_tag="PMP-101", incident_date="2025-08-20", description="Vibration alarms tripped again. Motor coupling seal leak reported.", severity="Critical", root_cause="Recurring cavitation caused by drop in suction head pressure from feed tank levels.", corrective_action="Repackaged pump shaft seal, adjusted inlet valve positioning.", status="Closed"),
        Incident(asset_tag="PMP-102", incident_date="2026-01-15", description="Vibration levels reached 9.8 mm/s. Impeller cavitation noise heard.", severity="Major", root_cause="Suction starvation leading to impeller cavitation and shaft wear.", corrective_action="Cleaned feed pipe deposits, laser aligned shaft.", status="Closed"),
        Incident(asset_tag="PMP-101", incident_date="2026-05-14", description="Emergency shutdown triggered by high vibration. Severe bearing wear.", severity="Critical", root_cause="Impeller cavitation triggered by suction head restriction.", corrective_action="Replaced bearings (BRG-990-C), laser aligned shaft, cleaned filter.", status="Closed"),
        Incident(asset_tag="PMP-103", incident_date="2026-02-18", description="Impeller seal leakage. Suction line pressure drop reported.", severity="Minor", root_cause="Impeller cavitation due to restricted feed tank head pressure.", corrective_action="Adjusted suction valves, verified inlet lines.", status="Closed"),
        
        # Boiler Valve Bypass Leakage recurrences
        Incident(asset_tag="BLR-201", incident_date="2025-04-10", description="Bypass steam bleed registered on Unit 1. Valve VLV-301 did not seat fully.", severity="Major", root_cause="Carbonate scale deposits on bypass valve seat from process steam mineral hardness.", corrective_action="Polished valve disk seat, cleared scales.", status="Closed"),
        Incident(asset_tag="BLR-201", incident_date="2025-10-15", description="Minor steam bleed observed on bypass line valve VLV-301.", severity="Major", root_cause="Scale buildup preventing full seating of valve head.", corrective_action="Scraped off scale deposits, polished seating ring.", status="Closed"),
        Incident(asset_tag="BLR-202", incident_date="2026-02-22", description="Bypass valve VLV-302 failed pressure seal check. Leakage registered.", severity="Major", root_cause="Hardness deposit scale accumulation on seating seals.", corrective_action="Replaced seating seals, adjusted stroke travel.", status="Closed"),
        Incident(asset_tag="BLR-201", incident_date="2026-06-01", description="Bypass line valve VLV-301 leak. Carbonate deposits on seating faces.", severity="Major", root_cause="Delayed scale removal and water softener chemical concentration drop.", corrective_action="Mechanical scale cleaning of VLV-301, chemical feed adjustments.", status="Closed"),

        # Tank corrosion issues
        Incident(asset_tag="TNK-601", incident_date="2025-05-18", description="Ultrasonic survey showed shell thickness depletion below nominal limit.", severity="Major", root_cause="Acidic localized corrosion along tank bottom shell.", corrective_action="Weld overlay plate reinforce, thickness gauge check.", status="Closed"),
        Incident(asset_tag="TNK-601", incident_date="2026-06-05", description="Ultrasonic casing inspection survey flagged active bottom corrosion.", severity="Major", root_cause="Sulfur compound corrosion thinning tank shell.", corrective_action="Welded patch plate on localized corrosion spots.", status="Closed"),

        # Compressor overheating
        Incident(asset_tag="CMP-501", incident_date="2025-06-12", description="High exhaust air temperature shutdown tripped at 112C.", severity="Major", root_cause="Lubricant oxidation and oil filter restriction.", corrective_action="Flushed system, replaced oil and filter.", status="Closed"),
        Incident(asset_tag="CMP-501", incident_date="2025-12-05", description="Re-occuring temperature excursion shutdown on compressor.", severity="Major", root_cause="Restricted lube oil cooler efficiency and filter clog.", corrective_action="Overhauled oil cooler tubes, replaced gasket seals.", status="Closed"),
        Incident(asset_tag="CMP-502", incident_date="2026-03-30", description="Screw air compressor high temperature warning.", severity="Minor", root_cause="Low lubricant levels and blocked ventilation filters.", corrective_action="Replenished synthetic compressor fluid, cleaned filter.", status="Closed"),

        # Miscellaneous process failures
        Incident(asset_tag="TUR-401", incident_date="2025-07-22", description="Main bearing vibration alarm tripped during grid load synchronization.", severity="Major", root_cause="Turbine generator rotor alignment thermal expansion misalignment.", corrective_action="Re-calibrated cooling rate controls, verified clearance.", status="Closed"),
        Incident(asset_tag="TUR-401", incident_date="2026-04-18", description="Steam turbine rotor shaft vibration deviation.", severity="Major", root_cause="Thermal coupling alignment shift.", corrective_action="Laser aligned rotor couplings, verified cooling flow.", status="Closed"),
        Incident(asset_tag="VLV-304", incident_date="2025-09-02", description="Bypass valve did not open fully during trip sequence.", severity="Major", root_cause="Solenoid pilot valve coil failure.", corrective_action="Replaced valve solenoid coil, verified stroke time.", status="Closed"),
        Incident(asset_tag="VLV-305", incident_date="2026-01-20", description="Stem packing seal leak on chemical line bypass.", severity="Minor", root_cause="Packing ring wear under high pressure cycling.", corrective_action="Tightened gland nuts, replaced packing ring.", status="Closed"),
        Incident(asset_tag="HEX-701", incident_date="2025-11-12", description="Heat exchanger thermal coefficient drop. Outlet temperature low.", severity="Minor", root_cause="Tube-side organic foulant buildup restricting thermal transfer.", corrective_action="Acid flushed heat exchanger tube bundle.", status="Closed"),
        Incident(asset_tag="HEX-702", incident_date="2026-05-02", description="Exchanger tube tube-to-casing minor flange leakage.", severity="Minor", root_cause="Thermal gasket compression set degradation.", corrective_action="Replaced case gasket, torqued flange bolts.", status="Closed")
    ]
    db.add_all(incidents)
    db.commit()
    print("20 Incidents seeded.")

    # 5. Seed 100 Maintenance Records (Jan 2025 to Jun 2026)
    # Linking them programmatically to assets with realistic costs and hours
    # Assign higher maintenance frequencies to PMP-101, BLR-201, VLV-301, TNK-601 to support patterns
    technicians = ["John Doe", "Sarah Jenkins", "Dave Miller", "Robert Chen", "Elena Rostova"]
    m_types = ["Preventive", "Corrective", "Predictive"]
    
    # Common descriptions
    descriptions = {
        "Preventive": [
            "Routine lubrication change, filter replacement, and casing cleaning.",
            "Calibrated telemetry pressure transmitters and verified DCS indicators.",
            "Tightened loose coupling bolts, verified belt tension, and checked seals.",
            "Inspected electrical wiring junctions and thermal scanned terminal boards.",
            "Flushed cooling jackets and cleared minor scale buildup."
        ],
        "Corrective": [
            "Replaced worn mechanical seal packings and shaft sleeve gaskets.",
            "Laser aligned shaft couplings to resolve minor vibration anomalies.",
            "Cleaned carbonate scale deposits from seating surfaces.",
            "Rebuilt bearing housing, replaced ball bearing rings, and verified clearances.",
            "Replaced burnt actuator solenoid coils and calibrated full valve stroke."
        ],
        "Predictive": [
            "Performed vibration survey telemetry logging and analyzed spectrum peaks.",
            "Ultrasonic thickness thickness gauge shell survey to map corrosion thinning.",
            "Oil sample analysis check for metal particle oxidation and viscosity.",
            "Thermal infrared imaging scans of rotor couplings during peak load.",
            "Safety valve pressure relief threshold validation check."
        ]
    }

    maintenance_logs = []
    
    # 1. Ensure high frequency logs for critical assets
    target_assets = ["PMP-101", "PMP-102", "BLR-201", "VLV-301", "TNK-601", "CMP-501", "TUR-401"]
    
    # Loop to generate exactly 100 records
    for record_id in range(1, 101):
        # Pick asset
        if record_id <= 45:
            # 45% of records are critical target assets to seed dense histories
            asset_tag = random.choice(target_assets)
        else:
            # Pick random asset from the 50 assets
            asset_tag = random.choice(assets).tag_number
            
        m_type = random.choice(m_types)
        desc = random.choice(descriptions[m_type])
        
        # Custom descriptions for target assets to match real incidents
        if asset_tag == "PMP-101" and m_type == "Corrective":
            desc = "Replaced bearings (Part #BRG-990-C), replenished Mobil-1 lubricant, and laser aligned pump shaft to fix cavitation vibration."
        elif asset_tag == "BLR-201" and m_type == "Corrective":
            desc = "Cleaned carbonate scale deposit buildup from valve seat VLV-301 and adjusted stroke travel."
        elif asset_tag == "TNK-601" and m_type == "Predictive":
            desc = "API 653 wall thickness ultrasonic thickness survey. Localized bottom corrosion thinning verified."
            
        # Random dates from 2025-01-10 to 2026-06-20
        year = random.choice([2025, 2026])
        month = random.randint(1, 12)
        if year == 2026:
            month = random.randint(1, 6) # up to June
        day = random.randint(1, 28)
        date_str = f"{year}-{month:02d}-{day:02d}"

        cost = round(random.uniform(150.0, 4500.0), 2)
        duration = round(random.uniform(1.0, 8.0), 1)
        tech = random.choice(technicians)
        
        maintenance_logs.append(MaintenanceEvent(
            asset_tag=asset_tag,
            event_date=date_str,
            type=m_type,
            description=desc,
            technician_name=tech,
            cost=cost,
            duration_hours=duration
        ))

    db.add_all(maintenance_logs)
    db.commit()
    print("100 Maintenance records programmatically generated & seeded.")

    # 6. Generate 35 files on disk representing INDUS ENERGY PLANT
    # 15 SOPs, 10 Audits, 10 Inspections
    if not os.path.exists(SEED_DIR):
        os.makedirs(SEED_DIR)

    # 15 SOPs content
    sops = {}
    for i in range(1, 16):
        # We write different categories
        if i <= 5:
            name = f"SOP_Boiler_Emergency_Shutdown_PWR_{i:02d}.txt"
            content = (
                f"STANDARD OPERATING PROCEDURE: SOP-PWR-{i:02d} (Emergency Boiler Operations).\n"
                f"Applies to: Steam Boiler BLR-201, BLR-202, BLR-203, and bypass valves VLV-301, VLV-302.\n"
                f"Procedure detail: Under high bypass steam bleed conditions, operators must engage pressure release valves, "
                f"close fuel pipelines, and alert the central unit control room. Prior to restarting pressure vessels, "
                f"ASME Section VIII safety certifications must be verified. Safety checklist signature must be signed by "
                f"the Operations Lead Engineer to authorize plant startup. Regulation reference: OSHA-1910.119 compliance rule.\n"
                f"Status: DRAFT REVISION - MISSING SIGNATURE AND LEAD ENGINEER SIGN-OFF."
            )
        elif i <= 10:
            name = f"SOP_Pump_Startup_Calibration_MNT_{i:02d}.txt"
            content = (
                f"STANDARD OPERATING PROCEDURE: SOP-MNT-{i:02d} (Centrifugal Pump Alignment and Vibration Checks).\n"
                f"Applies to: Centrifugal Feed Pumps PMP-101, PMP-102, PMP-103, PMP-104.\n"
                f"Procedure detail: Verify inlet suction pipe strainers are clear. Starving the suction inlet initiates vapor bubbles "
                f"triggering impeller cavitation, bearing wear, and casing seal cracks. Maintain motor shaft coupling alignments "
                f"within ISO 10816 standards (maximum allowed running vibration threshold is 4.5 mm/s).\n"
                f"Status: Approved and active. Safety checklists signed by John Doe."
            )
        else:
            name = f"SOP_Storage_Tank_Inspections_TNK_{i:02d}.txt"
            content = (
                f"STANDARD OPERATING PROCEDURE: SOP-TNK-{i:02d} (Five-Year Tank Casing Integrity Audit).\n"
                f"Applies to: Storage Feed Tanks TNK-601, TNK-602.\n"
                f"Procedure detail: Scaffolding casing shell walls. Execute ultrasonic thickness thickness gauge inspections "
                f"along the shell plates. Casing corrosion thinning must remain above minimum API 653 structural limits. "
                f"Record all thickness gauge measurements in the plant structural ledger.\n"
                f"Status: Approved. Sign-off completed by Dave Miller."
            )
        sops[name] = content

    # 10 Audits content
    audits = {}
    for i in range(1, 11):
        if i <= 3:
            name = f"Audit_Process_Safety_Review_AUD_{i:02d}.txt"
            content = (
                f"COMPLIANCE AUDIT REPORT: AUD-PWR-{i:02d}.\n"
                f"Facility name: INDUS ENERGY PLANT. Date: 2026-06-15. Lead Auditor: Dave Miller.\n"
                f"Scope: Process Safety Management review for Unit 1. Checked assets: Boiler BLR-201 and BLR-202.\n"
                f"Findings checklist: Safety valves certification test expired (FAIL - ASME Section VIII annual test due on 2026-05-20). "
                f"Emergency procedures (SOP-PWR-01) lacks Lead Engineer sign-off approval signature (FAIL - OSHA-1910.119 checklist gap).\n"
                f"Gap: Expired pressure certification and unsigned safety guidelines constitute an active process safety deviation."
            )
        elif i <= 6:
            name = f"Audit_Environmental_Emissions_AUD_{i:02d}.txt"
            content = (
                f"COMPLIANCE AUDIT REPORT: AUD-ENV-{i:02d}.\n"
                f"Facility name: INDUS ENERGY PLANT. Date: 2026-06-10. Auditor: Sarah Jenkins.\n"
                f"Scope: Stack Emissions stack exhaust limits check. Checked unit: Unit 2 Reformer Boiler BLR-201 stack.\n"
                f"Findings: Monthly stack exhaust monitoring logs showed NOx and SO2 emission parameters exceeded carbon limits. "
                f"EPA Clean Air Act Section 112r violation (FAIL - EPA compliance gap). Action: Recalibrate fuel burners."
            )
        else:
            name = f"Audit_Machinery_Vibration_AUD_{i:02d}.txt"
            content = (
                f"COMPLIANCE AUDIT REPORT: AUD-MNT-{i:02d}.\n"
                f"Facility name: INDUS ENERGY PLANT. Date: 2026-06-18. Auditor: John Doe.\n"
                f"Scope: Rotating equipment safety. Checked assets: Feed Pump PMP-101 and PMP-102.\n"
                f"Findings: Critical vibration limit exceeded. Vibration telemetry logs recorded peak vibration readings at 12.4 mm/s, "
                f"tripping active DCS alarms. Exceeds ISO 10816 machinery guidelines (FAIL - ISO compliance gap)."
            )
        audits[name] = content

    # 10 Inspections content
    inspections = {}
    for i in range(1, 11):
        if i <= 3:
            name = f"Inspection_Boiler_Valve_Findings_INS_{i:02d}.pdf" # saved as text, parsed via name mapping
            content = (
                f"FIELD INSPECTION REPORT: INS-BLR-{i:02d}.\n"
                f"Location: Unit 1 Boiler Room B. Date: 2026-06-01. Inspector: Sarah Jenkins.\n"
                f"Asset: High Pressure Steam Boiler BLR-201 bypass valve. Findings: Bypass control valve VLV-301 did not seat fully. "
                f"Detected steam bypass pressure bleed and severe mineral carbonate scale buildup on valve face ring. "
                f"Relieving valve pressure tests are overdue. ASME certificate certification check is non-compliant."
            )
        elif i <= 6:
            name = f"Inspection_Pump_Vibration_Survey_INS_{i:02d}.txt"
            content = (
                f"VIBRATION TELEMETRY SURVEY: INS-VIB-{i:02d}.\n"
                f"Location: Pump House A. Date: 2026-05-14. Lead Inspector: John Doe.\n"
                f"Asset: Centrifugal Pump PMP-101. Findings: Shaft vibration peaked at 12.4 mm/s (limits are 4.5 mm/s ISO 10816). "
                f"Loud rattling noise suggests localized suction flow restriction. Root cause: Impeller cavitation "
                f"due to suction head pressure drops. Shaft bearings show severe wear and coupling seal has a slow grease leak."
            )
        elif i <= 8:
            name = f"Inspection_Tank_Shell_Thickness_INS_{i:02d}.pdf"
            content = (
                f"ULTRASONIC THICKNESS SURVEY: INS-TNK-{i:02d}.\n"
                f"Location: Storage tank terminal Unit 4. Date: 2026-06-05. Inspector: Dave Miller.\n"
                f"Asset: Fuel storage tank TNK-601 casing shell. Findings: Localized pitting corrosion detected at bottom shell plate. "
                f"Thickness gauge readings dropped to 3.2 mm (nominal is 6.5 mm), breaching API 653 structural limits (FAIL - structural gap). "
                f"Requires structural repair patches."
            )
        else:
            name = f"Inspection_Compressor_Checklist_INS_{i:02d}.txt"
            content = (
                f"ROUTINE INSPECTION SHEET: INS-CMP-{i:02d}.\n"
                f"Location: Unit 3 Compressor Area. Date: 2026-06-08. Inspector: Sarah Jenkins.\n"
                f"Asset: Process Air Compressor CMP-501. Findings: Gasket shows minor oil staining, oil levels are compliant. "
                f"Air inlet filter replaced. Unit is operating within limits. Compliant."
            )
        inspections[name] = content

    # Write files to disk and execute the ingestion pipeline
    print("Writing 35 scaling documents to disk and processing through ingestion pipeline...")
    
    # SOPs
    for filename, content in sops.items():
        file_path = os.path.join(SEED_DIR, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        ingestion_service.process_file(db, file_path, filename)
        
    # Audits
    for filename, content in audits.items():
        file_path = os.path.join(SEED_DIR, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        ingestion_service.process_file(db, file_path, filename)
        
    # Inspections
    for filename, content in inspections.items():
        file_path = os.path.join(SEED_DIR, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        ingestion_service.process_file(db, file_path, filename)

    print("Dynamic seeding completed successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
