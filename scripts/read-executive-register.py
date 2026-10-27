#!/usr/bin/env python3
import hashlib
import json
import os
import posixpath
import re
import sys
import zipfile
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from xml.etree import ElementTree


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
MAX_ARCHIVE_SIZE = 50 * 1024 * 1024
DATE_FORMAT_IDS = {
    14, 15, 16, 17, 22, 27, 28, 29, 30, 31, 34, 35, 36,
    50, 51, 52, 53, 54, 57, 58,
}


def is_date_format(format_code):
    # Literal text, escapes, locale/color/condition brackets are not date tokens.
    code = re.sub(r'"[^"]*"|\\.|_.|\*.', "", format_code)
    if re.search(r"\[(?:h+|m+|s+)\]", code, re.IGNORECASE):
        return False
    code = re.sub(r"\[[^\]]*\]", "", code).split(";")[0].lower()
    return bool(re.search(r"[yd]", code) or (
        "m" in code and not re.search(r"[hs]", code)
    ))


def excel_date(value, date1904, reference):
    try:
        serial = Decimal(value)
        limit = Decimal("2957004" if date1904 else "2958466")
        if not serial.is_finite() or serial < 0 or serial >= limit:
            raise ValueError("serial must be finite and within the supported calendar range")
        days = int(serial)
        if not date1904 and days == 60:
            raise ValueError("serial 60 represents the nonexistent 1900-02-29")
        epoch = datetime(1904, 1, 1) if date1904 else datetime(1899, 12, 31)
        adjusted_days = days if date1904 or days < 60 else days - 1
        microseconds = int((serial - days) * 86400000000)
        converted = epoch + timedelta(days=adjusted_days, microseconds=microseconds)
    except (InvalidOperation, ValueError, OverflowError) as error:
        raise ValueError(f"Invalid Excel date in cell {reference}: {value} ({error})") from error
    return converted.isoformat() if microseconds else converted.date().isoformat()


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def column_index(cell_reference):
    letters = "".join(character for character in cell_reference if character.isalpha())
    value = 0
    for character in letters:
        value = value * 26 + ord(character.upper()) - ord("A") + 1
    return value - 1


def cell_text(cell, shared_strings, date_styles, date1904):
    cell_type = cell.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{{{MAIN_NS}}}t"))

    value = cell.find(f"{{{MAIN_NS}}}v")
    if value is None or value.text is None:
        return ""
    if cell_type == "s":
        return shared_strings[int(value.text)]
    if cell_type in (None, "n") and (date_styles or "s" in cell.attrib):
        style = int(cell.get("s", "0"))
        if style < 0 or style >= len(date_styles):
            raise ValueError(f"Invalid cell style in {cell.get('r')}: {style}")
        if date_styles[style]:
            return excel_date(value.text, date1904, cell.get("r", "unknown"))
    return value.text


def worksheet_rows(root, shared_strings, date_styles, date1904):
    rows = []
    sheet_data = root.find(f"{{{MAIN_NS}}}sheetData")
    if sheet_data is None:
        return rows

    for row in sheet_data.findall(f"{{{MAIN_NS}}}row"):
        values = {}
        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            text = cell_text(cell, shared_strings, date_styles, date1904)
            if text:
                values[column_index(cell.get("r", ""))] = text
        rows.append(values)
    return rows


def records_for_sheet(rows):
    header_row = next(
        (
            row
            for row in rows
            if any(
                value in {
                    "Work Item ID",
                    "Action ID",
                    "Decision ID",
                    "Risk ID",
                    "Evidence ID",
                    "Assignment ID",
                }
                for value in row.values()
            )
        ),
        None,
    )
    if header_row is None:
        return []

    headers = {index: value.strip() for index, value in header_row.items()}
    records = []
    header_position = next(
        index for index, value in enumerate(rows) if value is header_row
    )
    for row in rows[header_position + 1 :]:
        record = {
            headers[index]: value
            for index, value in row.items()
            if index in headers and headers[index]
        }
        if record and any(key.endswith("ID") for key in record):
            records.append(record)
    return records


def read_workbook(file_path):
    with zipfile.ZipFile(file_path) as workbook:
        if sum(item.file_size for item in workbook.infolist()) > MAX_ARCHIVE_SIZE:
            fail("Operations Register workbook exceeds the 50 MiB uncompressed size limit.")

        names = set(workbook.namelist())
        if "xl/workbook.xml" not in names or "xl/_rels/workbook.xml.rels" not in names:
            fail("File is not a supported .xlsx workbook.")

        shared_strings = []
        if "xl/sharedStrings.xml" in names:
            shared_root = ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
            shared_strings = [
                "".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t"))
                for item in shared_root.findall(f"{{{MAIN_NS}}}si")
            ]

        relationships = ElementTree.fromstring(
            workbook.read("xl/_rels/workbook.xml.rels")
        )
        targets = {
            relationship.get("Id"): relationship.get("Target")
            for relationship in relationships.findall(
                f"{{{PACKAGE_REL_NS}}}Relationship"
            )
        }
        workbook_root = ElementTree.fromstring(workbook.read("xl/workbook.xml"))
        properties = workbook_root.find(f"{{{MAIN_NS}}}workbookPr")
        date_system = properties.get("date1904", "0") if properties is not None else "0"
        if date_system not in ("0", "1", "false", "true"):
            raise ValueError(f"Invalid workbook date1904 setting: {date_system}")
        date1904 = date_system in ("1", "true")
        styles_path = "xl/styles.xml"
        for relationship in relationships:
            if relationship.get("Type", "").endswith("/styles"):
                target = relationship.get("Target", "")
                styles_path = posixpath.normpath(
                    target.lstrip("/") if target.startswith("/") else posixpath.join("xl", target)
                )
        date_styles = []
        if styles_path in names:
            styles = ElementTree.fromstring(workbook.read(styles_path))
            custom_formats = {
                int(item.get("numFmtId")): item.get("formatCode", "")
                for item in styles.findall(f"{{{MAIN_NS}}}numFmts/{{{MAIN_NS}}}numFmt")
            }
            for style in styles.findall(f"{{{MAIN_NS}}}cellXfs/{{{MAIN_NS}}}xf"):
                format_id = int(style.get("numFmtId", "0"))
                date_styles.append(
                    is_date_format(custom_formats[format_id])
                    if format_id in custom_formats else format_id in DATE_FORMAT_IDS
                )
        sheets = {}

        for sheet in workbook_root.findall(
            f".//{{{MAIN_NS}}}sheet"
        ):
            target = targets.get(sheet.get(f"{{{REL_NS}}}id"))
            if not target:
                continue
            worksheet_path = posixpath.normpath(
                target.lstrip("/") if target.startswith("/") else posixpath.join("xl", target)
            )
            if worksheet_path not in names:
                fail(f"Workbook references a missing worksheet: {worksheet_path}")
            worksheet = ElementTree.fromstring(workbook.read(worksheet_path))
            sheets[sheet.get("name", "")] = records_for_sheet(
                worksheet_rows(worksheet, shared_strings, date_styles, date1904)
            )
        return sheets


def main():
    if len(sys.argv) != 2:
        fail("Usage: read-executive-register.py <Operations-Register.xlsx>")

    file_path = os.path.abspath(sys.argv[1])
    if not os.path.isfile(file_path):
        fail(f"Operations Register workbook does not exist: {file_path}")

    try:
        sheets = read_workbook(file_path)
    except (OSError, zipfile.BadZipFile, ElementTree.ParseError, KeyError, ValueError) as error:
        fail(f"Could not read Operations Register workbook: {error}")

    with open(file_path, "rb") as workbook_file:
        fingerprint = hashlib.sha256(workbook_file.read()).hexdigest()
    modified_at = datetime.fromtimestamp(
        os.path.getmtime(file_path), timezone.utc
    ).isoformat(timespec="seconds")
    print(
        json.dumps(
            {
                "source": {
                    "path": file_path,
                    "fileName": os.path.basename(file_path),
                    "sha256": fingerprint,
                    "modifiedAt": modified_at,
                },
                "sheets": sheets,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
