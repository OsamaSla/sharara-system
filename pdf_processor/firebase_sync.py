import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# =====================================================================
# Firebase Admin SDK initialization
# =====================================================================
SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "serviceAccountKey.json"
)

_cred = None
_db = None


def get_firestore():
    """Lazy-init Firebase Admin SDK and return Firestore client."""
    global _cred, _db
    if _db is not None:
        return _db

    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        raise FileNotFoundError(
            f"Service account key not found at: {SERVICE_ACCOUNT_PATH}\n"
            "Download it from Firebase Console > Project Settings > Service Accounts > Generate New Private Key"
        )

    _cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(_cred)
    _db = firestore.client()
    return _db


# =====================================================================
# Constants
# =====================================================================
FIRESTORE_DOC_PATH = ("appData", "mainData")

# Python AI type -> React RowData.type (Hebrew)
TYPE_MAP = {
    "kufsa":        "קטע ישר",
    "straight_90":  "קטע ישר",
    "straight":     "קטע ישר",
    "box":          "קטע ישר",
    "kufsa_duct":   "קטע ישר",
    "kashet":       "קשת",
    "elbow":        "קשת",
    "curve":        "קשת",
    "kashet_duct":  "קשת",
    "maavar":       "מעבר",
    "transition":   "מעבר",
    "maavar_duct":  "מעבר",
}

# Types where the subtype distinction lives in the notes field
NOTES_SUBTYPES = {
    "tzinor":     "צינור עגול",
    "madaf_esh":  "מדף אש",
    "lamed":      "לאמד S",
}


# =====================================================================
# Conversion helpers
# =====================================================================
def mm_to_m(val):
    """Convert millimeters to meters, rounded to 3 decimals."""
    if val is None:
        return 0
    try:
        return round(int(val) / 1000, 3)
    except (ValueError, TypeError):
        return 0


def build_row(part, page_num):
    """Convert a single Python-parsed part dict into a React RowData object."""

    raw_type = str(part.get("type", "kufsa")).lower().strip()

    # Extract dimensions (flat or nested)
    dims = part.get("dimensions", {}) if isinstance(part.get("dimensions"), dict) else part

    w = int(dims.get("width") or dims.get("width_start") or 650)
    h = int(dims.get("height") or dims.get("height_start") or 650)
    length = int(dims.get("length") or 1200)
    w2 = int(dims.get("width_end") or 0)
    h2 = int(dims.get("height_end") or 0)

    # Determine React type and notes
    react_type = TYPE_MAP.get(raw_type, "קטע ישר")
    notes = NOTES_SUBTYPES.get(raw_type, "")

    # Handle lamed -> type is מעבר with notes 'לאמד S'
    if raw_type == "lamed":
        react_type = "לאמד S"

    part_id = part.get("id") or part.get("part_id") or "?"
    part_number = f"P{page_num}-{part_id}"

    # Elbow (kashet) geometry
    r_small = 0.15  # default inner radius in meters
    r_big = mm_to_m(w) + r_small
    elbow_length = 0  # kashet has no linear length

    is_elbow = react_type == "קשת"
    is_transition = react_type == "מעבר"

    return {
        "id": part_number,
        "partNumber": part_number,
        "type": react_type,
        "panels": 0,
        "dofan": 0,
        "width1": mm_to_m(w),
        "height1": mm_to_m(h),
        "width2": mm_to_m(w2) if is_transition else 0,
        "height2": mm_to_m(h2) if is_transition else 0,
        "length": elbow_length if is_elbow else mm_to_m(length),
        "rBig": r_big if is_elbow else 0,
        "rSmall": r_small if is_elbow else 0,
        "shatuzar": False,
        "flexible": 0,
        "acoustic": True,
        "external": False,
        "sharshuriType": "ללא",
        "sharshuriLen": 0,
        "adapterType": "ללא",
        "adapterQty": 0,
        "notes": notes,
        "manualThickness": 0,
        "rBig2": 0,
        "connectionType": "ללא",
        "productionMode": "automatic",
        "productionOverrides": {},
    }


# =====================================================================
# Public API
# =====================================================================
def sync_pages_to_firebase(
    parsed_pages: dict,
    client_name: str = "PDF Import",
    project_name: str = "",
):
    """
    Write parsed PDF page data into Firestore so the React frontend picks it up.

    Args:
        parsed_pages: { page_num (int): parsed JSON string or dict from app1.py }
        client_name:  Client name to register in clientsData
        project_name: Project name to register; defaults to "Shve Tzion #<num>"
    """
    db = get_firestore()
    doc_ref = db.collection(FIRESTORE_DOC_PATH[0]).document(FIRESTORE_DOC_PATH[1])
    existing = doc_ref.get().to_dict() or {}

    # --- Build sheets from parsed pages ---
    new_sheets = []
    resolved_project = project_name

    for page_num in sorted(parsed_pages.keys()):
        raw = parsed_pages[page_num]
        data = json.loads(raw) if isinstance(raw, str) else raw

        if not data or not data.get("parts"):
            continue

        # Derive project name from first page if not provided
        if not resolved_project:
            pname = data.get("project_name", "Shve Tzion")
            pnum = data.get("project_number", "")
            resolved_project = f"{pname} #{pnum}" if pnum else pname

        rows = [build_row(p, page_num) for p in data["parts"]]
        new_sheets.append({
            "id": str(page_num),
            "name": f"דף מדידה #{page_num}",
            "rows": rows,
        })

    if not new_sheets:
        print("[Firebase Sync] No valid pages to sync.")
        return

    # --- Update clientsData to register client + project ---
    clients_data = existing.get("clientsData", {})
    if client_name not in clients_data:
        clients_data[client_name] = {
            "phone": "",
            "email": "",
            "contact": "",
            "regDate": "",
            "projects": [],
        }
    if resolved_project and resolved_project not in clients_data[client_name]["projects"]:
        clients_data[client_name]["projects"].append(resolved_project)

    # --- Write to Firestore under per-project key (isolation between projects) ---
    project_key = f"{client_name}|||{resolved_project}"
    doc_ref.set(
        {
            "sheetsByProject": {
                project_key: new_sheets,
            },
            "clientsData": clients_data,
        },
        merge=True,
    )

    total_rows = sum(len(s["rows"]) for s in new_sheets)
    print(
        f"[Firebase Sync] Synced {len(new_sheets)} sheet(s) with "
        f"{total_rows} total parts to Firestore."
    )
    print(f"  Client:  {client_name}")
    print(f"  Project: {resolved_project}")


# =====================================================================
# Standalone test
# =====================================================================
if __name__ == "__main__":
    # Quick smoke test with sample data
    sample = {
        1: {
            "project_name": "Shve Tzion",
            "project_number": "113",
            "main_dimensions": "65x65",
            "parts": [
                {"id": 1, "type": "kufsa", "width": 650, "height": 650, "length": 1200},
                {"id": 2, "type": "maavar", "width_start": 650, "width_end": 500, "height_start": 650, "height_end": 500, "length": 800},
                {"id": 3, "type": "kashet", "width": 650, "height": 650, "length": 0},
            ],
        }
    }
    sync_pages_to_firebase(sample, client_name="Ali Sharara Ltd", project_name="Shve Tzion #113")
