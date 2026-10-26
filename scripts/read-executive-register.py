#!/usr/bin/env python3
import hashlib
import json
import os
import posixpath
import sys
import zipfile
from datetime import datetime, timezone
from xml.etree import ElementTree


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
MAX_ARCHIVE_SIZE = 50 * 1024 * 1024


def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)


def column_index(cell_reference):
    letters = "".join(character for character in cell_reference if character.isalpha())
    value = 0
    for character in letters:
        value = value * 26 + ord(character.upper()) - ord("A") + 1
    return value - 1


def cell_text(cell, shared_strings):
    cell_type = cell.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{{{MAIN_NS}}}t"))

    value = cell.find(f"{{{MAIN_NS}}}v")
    if value is None or value.text is None:
        return ""
    if cell_type == "s":
        return shared_strings[int(value.text)]
    return value.text


def worksheet_rows(root, shared_strings):
    rows = []
    sheet_data = root.find(f"{{{MAIN_NS}}}sheetData")
    if sheet_data is None:
        return rows

    for row in sheet_data.findall(f"{{{MAIN_NS}}}row"):
        values = {}
        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            text = cell_text(cell, shared_strings)
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
                worksheet_rows(worksheet, shared_strings)
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
