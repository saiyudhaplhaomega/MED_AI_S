"""Create two realistic dummy chronology files for manual upload testing.

Run from the repository root:
    python scripts/make_dummy_uploads.py

Writes test-uploads/dummy-martinez.xlsx and test-uploads/dummy-okafor.xlsx.
These are fictional cases, safe to upload anywhere.
"""
from datetime import date, timedelta
from pathlib import Path

from openpyxl import Workbook

OUT_DIR = Path(__file__).resolve().parents[1] / "test-uploads"

HEADERS = [
    "Encounter Date",
    "Primary Provider",
    "Facility",
    "Body Parts",
    "Medicine Type",
    "Record Type",
    "Summary",
    "Link To Pdf",
]


def build_case(filename, start, arc):
    wb = Workbook()
    ws = wb.active
    ws.title = "Medical Chronology"
    ws.append(HEADERS)
    day = start
    for step, (gap_days, provider, facility, parts, med, rec, summary) in enumerate(arc):
        day = day + timedelta(days=gap_days)
        row = [
            day.strftime("%m/%d/%Y"),
            provider,
            facility,
            parts,
            med,
            rec,
            summary,
            "pdf",
        ]
        ws.append(row)
        link_cell = ws.cell(row=step + 2, column=8)
        link_cell.hyperlink = f"https://www.google.com/search?q=Dummy+Medical+Record+{step + 1}"
    OUT_DIR.mkdir(exist_ok=True)
    wb.save(OUT_DIR / filename)
    print(f"wrote {OUT_DIR / filename} ({len(arc)} events)")


martinez = [
    (0, "Elena Vasquez, MD", "Riverside Emergency Center", "Neck, Lower Back", "Emergency Medicine", "Encounter Note",
     "Subjective: The patient presented to the emergency department after a rear-end collision at a stoplight. She reported immediate neck stiffness and lower back pain. Denied loss of consciousness. Discharged with muscle relaxants and follow-up instructions."),
    (2, "Marcus Webb, DC", "Lakeview Chiropractic", "Neck, Cervical Spine", "Chiropractic", "Treatment Note",
     "Patient reports persistent cervical pain rated 7/10. Restricted range of motion on left rotation. Initiated adjustment and soft tissue therapy, three sessions weekly recommended."),
    (5, "Priya Raman, MD", "Riverside Imaging", "Cervical Spine", "Radiology", "Imaging Report",
     "MRI cervical spine without contrast. Impression: C5-C6 disc protrusion with mild foraminal narrowing. No cord compression."),
    (9, "Marcus Webb, DC", "Lakeview Chiropractic", "Neck, Lower Back", "Chiropractic", "Treatment Note",
     "Continued conservative care. Patient notes headaches following longer work days. Pain 5/10 on good days."),
    (12, "Sofia Martinez, PT", "Momentum Physical Therapy", "Lower Back", "Physical Therapy", "PT Evaluation",
     "Initial PT evaluation. Lumbar flexion limited to 40 degrees. Core weakness noted. Plan: twice weekly for six weeks, progressive strengthening."),
    (7, "Sofia Martinez, PT", "Momentum Physical Therapy", "Lower Back", "Physical Therapy", "PT Daily Note",
     "Session 4 of 12. Tolerating bridge progression. Reports 4/10 pain after prolonged sitting."),
    (14, "Alan Okonkwo, MD", "Riverside Orthopedics", "Cervical Spine", "Orthopedic", "Consultation",
     "Orthopedic consultation for persistent radicular symptoms. Positive Spurling test on the left. Recommended cervical epidural steroid injection if symptoms persist past eight weeks."),
    (21, "Alan Okonkwo, MD", "Riverside Surgery Center", "Cervical Spine", "Anesthesiology", "Operative Report",
     "C5-C6 interlaminar epidural steroid injection performed under fluoroscopic guidance without complication. Patient tolerated the procedure well."),
    (18, "Sofia Martinez, PT", "Momentum Physical Therapy", "Neck, Lower Back", "Physical Therapy", "PT Daily Note",
     "Marked improvement following injection. Pain 2/10. Progressed to resistance band program."),
    (30, "Elena Vasquez, MD", "Riverside Family Practice", "Neck, Lower Back", "Family Medicine", "Progress Note",
     "Follow-up visit. Patient reports near-complete resolution of symptoms. Cleared to resume gym activity. Treatment concluded."),
]

okafor = [
    (0, "David Chen, EMT", "Metro EMS", "Head, Chest, Left Leg", "Emergency Medicine", "EMS/Ambulance Report",
     "Patient extricated from vehicle after side-impact collision. GCS 15 on scene. Complained of chest wall pain and left leg pain. Transported to Metro General."),
    (0, "Hannah Osei, MD", "Metro General Hospital", "Head, Chest, Left Leg", "Emergency Medicine", "Encounter Note",
     "Trauma evaluation following MVC. CT head negative. Chest X-ray shows two left rib fractures. Left tibia X-ray reveals nondisplaced fracture. Admitted for observation."),
    (1, "Hannah Osei, MD", "Metro General Hospital", "Left Leg", "Orthopedic", "Operative Report",
     "Closed reduction and casting of left tibial fracture. Post-reduction films show acceptable alignment."),
    (3, "Metro General Nursing", "Metro General Hospital", "Chest, Left Leg", "Internal Medicine", "Discharge Summary",
     "Discharged home with walker, pain management plan, and orthopedic follow-up in two weeks. Rib fractures managed conservatively."),
    (14, "Robert Ilesanmi, MD", "Metro Orthopedic Group", "Left Leg", "Orthopedic", "Progress Note",
     "Two-week fracture check. Cast intact, alignment maintained. Pain controlled with acetaminophen."),
    (28, "Robert Ilesanmi, MD", "Metro Orthopedic Group", "Left Leg", "Radiology", "Imaging Report",
     "Left tibia X-ray: early callus formation, alignment unchanged. Continue weight-bearing restrictions."),
    (14, "Robert Ilesanmi, MD", "Metro Orthopedic Group", "Left Leg", "Orthopedic", "Progress Note",
     "Cast removed. Transitioned to walking boot. Referred to physical therapy for gait retraining."),
    (7, "Grace Adeyemi, PT", "Stride Physical Therapy", "Left Leg", "Physical Therapy", "PT Evaluation",
     "Initial evaluation post-casting. Significant calf atrophy, antalgic gait. Plan: gait retraining and progressive loading, three times weekly."),
    (10, "Grace Adeyemi, PT", "Stride Physical Therapy", "Left Leg", "Physical Therapy", "PT Daily Note",
     "Session 5. Ambulating without boot indoors. Single-leg stance 12 seconds."),
    (21, "Grace Adeyemi, PT", "Stride Physical Therapy", "Left Leg", "Physical Therapy", "PT Daily Note",
     "Session 11. Jogging intervals initiated on treadmill. Mild soreness, no swelling."),
    (35, "Robert Ilesanmi, MD", "Metro Orthopedic Group", "Left Leg, Chest", "Orthopedic", "Progress Note",
     "Final visit. Fracture clinically healed. Full weight bearing without pain. Released from care."),
]

build_case("dummy-martinez.xlsx", date(2025, 3, 14), martinez)
build_case("dummy-okafor.xlsx", date(2025, 1, 6), okafor)
