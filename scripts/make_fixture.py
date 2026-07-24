"""Create an unseen, deliberately messy chronology fixture for local QA.

Run from the repository root:
    python scripts/make_fixture.py
"""
from datetime import date, timedelta
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape


OUT = Path(__file__).resolve().parents[1] / "public" / "samples-test" / "unseen.xlsx"
HEADERS = ["Summary", "Body Parts", "Encounter Date", "Junk Column", "Record Type", "Link To Pdf", "Facility", "Medicine Type", "Primary Provider"]


def cell(ref, value):
    if value is None:
        return f'<c r="{ref}" t="inlineStr"><is><t></t></is></c>'
    text = escape(str(value))
    return f'<c r="{ref}" t="inlineStr"><is><t>{text}</t></is></c>'


def make_rows():
    rows = [HEADERS]
    types = [("Physical Therapy", "therapy"), ("Radiology", "imaging"), ("Orthopedic", "follow-up"), ("Emergency", "emergency")]
    bodies = [("cervical spine", "LOWER"), ("Lumbar Spine", "TITLE"), ("LEFT KNEE", "UPPER"), ("right shoulder", "mixed")]
    for index in range(300):
        missing_date = index < 12
        when = None if missing_date else (date(2023, 1, 3) + timedelta(days=index * 2)).isoformat()
        medicine, record = types[index % len(types)]
        body, style = bodies[index % len(bodies)]
        if style == "LOWER":
            body = body.lower()
        elif style == "UPPER":
            body = body.upper()
        elif style == "TITLE":
            body = body.title()
        rows.append([
            f"Chronology visit {index + 1}: treatment update and clinical findings.",
            body,
            when,
            f"unseen-{index + 1}",
            record,
            "pdf",
            "Test Medical Center" if index % 3 else "Downtown Clinic",
            medicine,
            f"Provider {index % 9 + 1}; Covering Provider" if index % 5 == 0 else f"Provider {index % 9 + 1}",
        ])
    return rows


def write_xlsx(rows):
    OUT.parent.mkdir(parents=True, exist_ok=True)
    xml_rows = []
    for row_index, row in enumerate(rows, 1):
        cells = []
        for column, value in enumerate(row):
            ref = f"{chr(65 + column)}{row_index}"
            cells.append(cell(ref, value))
        xml_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')
    sheet = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:I{len(rows)}"/><sheetData>{"".join(xml_rows)}</sheetData></worksheet>'''
    files = {
        "[Content_Types].xml": '''<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>''',
        "_rels/.rels": '''<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>''',
        "xl/workbook.xml": '''<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Unseen Case" sheetId="1" r:id="rId1"/></sheets></workbook>''',
        "xl/_rels/workbook.xml.rels": '''<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>''',
        "xl/worksheets/sheet1.xml": sheet,
    }
    with ZipFile(OUT, "w", ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    print(f"wrote {OUT} ({len(rows) - 1} data rows, 12 missing dates)")


if __name__ == "__main__":
    write_xlsx(make_rows())
