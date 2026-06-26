import os
import json
import math
import re
import time
import base64
import argparse
from datetime import datetime
from pdf2image import convert_from_path
from google import genai
from google.api_core import exceptions
from openai import OpenAI
import ezdxf
from firebase_sync import sync_pages_to_firebase

# =====================================================================
# 1. הגדרת נתיבים וקבצים
# =====================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
poppler_bin_path = os.path.join(current_dir, "poppler-26.02.0", "Library", "bin")

pdf_filename = "CamScanner 12.39 3.6.2026.pdf"
pdf_path = os.path.join(current_dir, pdf_filename)
laser_dxf_outputs_root = os.path.join(current_dir, "laser_dxf_outputs")

def sanitize_folder_name(name):
    """Replace spaces and special characters with underscores for safe folder names."""
    return re.sub(r'[<>:"/\\|?*\s]+', '_', name).strip('_')

# אתחול Gemini API - מפתחות מ environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    print("⚠️  GEMINI_API_KEY not set. Export it before running: export GEMINI_API_KEY=your_key")
    exit(1)
client = genai.Client(api_key=GEMINI_API_KEY)

# OpenAI - גיבוי סופי עם GPT-4o mini
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# =====================================================================
# 2. פונקציית גיבוי - GPT-4o mini
# =====================================================================
def analyze_with_gpt(image_path, page_num):
    """גיבוי סופי עם GPT-4o mini (~$0.01 לדף)"""
    if not openai_client:
        print(f"⚠️  OPENAI_API_KEY not set — skipping GPT-4o mini backup for page {page_num}")
        return None
    print(f"\nמנתח את דף מדידות {page_num} בעזרת GPT-4o mini (גיבוי)...")

    prompt_instruction = """
    Analyze this handwritten HVAC duct measurement sheet for 'Ali Sharara Ltd'.
    
    DIMENSIONS: All written dimensions are in CENTIMETERS. Multiply by 10 to return MILLIMETERS.
    DEFAULTS: Project = "Shve Tzion" #113. Missing dimensions default to 650mm width & height.
    
    Extract circled numbers as sequential part IDs. Classify each part by shape:
    "kufsa" (box duct), "straight_90" (90deg cut), "kashet" (curved elbow), "maavar" (transition/trapezoid), "lamed" (L-shape), "tzinor" (round pipe), "madaf_esh" (fire damper).
    
    JSON OUTPUT (plain JSON only, no markdown):
    {"project_name":"...","project_number":"113","main_dimensions":"65x65",
     "parts":[{"id":1,"type":"kufsa","width":650,"height":650,"length":1200},
              {"id":2,"type":"maavar","width_start":650,"width_end":500,"length":800}]}
    
    Rules per part type:
    - kufsa/straight_90/kashet: width, height, length (integers, mm).
    - maavar: width_start, width_end, length (integers, mm).
    - ALL values MUST be non-null integers.
    """

    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        image_b64 = base64.b64encode(image_bytes).decode()

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_instruction},
                    {"type": "image_url", "image_url": {
                        "url": f"data:image/png;base64,{image_b64}"
                    }}
                ]
            }],
            response_format={"type": "json_object"},
            max_tokens=1024
        )

        result_text = response.choices[0].message.content.strip()

        try:
            data = json.loads(result_text)
        except json.JSONDecodeError as e:
            print(f"שגיאת JSON מ-GPT בעמוד {page_num}: {e}")
            return None

        if "parts" not in data or not isinstance(data["parts"], list) or len(data["parts"]) == 0:
            print(f"JSON לא תקין מ-GPT בעמוד {page_num}: חסר מפתח 'parts' או רשימה ריקה")
            return None

        for part in data["parts"]:
            if "id" not in part or "type" not in part:
                print(f"חלק חסר שדות חובה מ-GPT בעמוד {page_num}: {part}")
                return None

        return result_text

    except Exception as e:
        print(f"שגיאה בתקשורת מול OpenAI בעמוד {page_num}: {e}")
        return None

# =====================================================================
# 3. פונקציית עזר לפענוח דף בודד בעזרת Gemini + GPT גיבוי
# =====================================================================
def analyze_duct_sheet(image_path, page_num):
    global client, current_key_index
    print(f"\nמנתח את דף מדידות {page_num} בעזרת Gemini AI...")
    
    prompt_instruction = """
    Analyze this handwritten HVAC duct measurement sheet for 'Ali Sharara Ltd'.
    
    DIMENSIONS: All written dimensions are in CENTIMETERS. Multiply by 10 to return MILLIMETERS.
    DEFAULTS: Project = "Shve Tzion" #113. Missing dimensions default to 650mm width & height.
    
    Extract circled numbers as sequential part IDs. Classify each part by shape:
    "kufsa" (box duct), "straight_90" (90deg cut), "kashet" (curved elbow), "maavar" (transition/trapezoid), "lamed" (L-shape), "tzinor" (round pipe), "madaf_esh" (fire damper).
    
    JSON OUTPUT (plain JSON only, no markdown):
    {"project_name":"...","project_number":"113","main_dimensions":"65x65",
     "parts":[{"id":1,"type":"kufsa","width":650,"height":650,"length":1200},
              {"id":2,"type":"maavar","width_start":650,"width_end":500,"length":800}]}
    
    Rules per part type:
    - kufsa/straight_90/kashet: width, height, length (integers, mm).
    - maavar: width_start, width_end, length (integers, mm).
    - ALL values MUST be non-null integers.
    """

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with open(image_path, "rb") as f:
                image_bytes = f.read()
                
            image_part = genai.types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/png"
            )
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[image_part, prompt_instruction]
            )
            
            result_text = response.text.strip()
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            result_text = result_text.strip()

            try:
                data = json.loads(result_text)
            except json.JSONDecodeError as e:
                print(f"שגיאת JSON בעמוד {page_num}: {e}")
                return None

            if "parts" not in data or not isinstance(data["parts"], list) or len(data["parts"]) == 0:
                print(f"JSON לא תקין בעמוד {page_num}: חסר מפתח 'parts' או רשימה ריקה")
                return None

            for part in data["parts"]:
                if "id" not in part or "type" not in part:
                    print(f"חלק חסר שדות חובה (id/type) בעמוד {page_num}: {part}")
                    return None

            return result_text
            
        except (exceptions.ResourceExhausted, exceptions.ServiceUnavailable) as e:
            if isinstance(e, exceptions.ResourceExhausted) and current_key_index < len(API_KEYS) - 1:
                print(f"המפתח הנוכחי הגיע למגבלה. עובר למפתח הגיבוי...")
                current_key_index += 1
                client = genai.Client(api_key=API_KEYS[current_key_index])
                continue
            if attempt < max_retries - 1:
                wait_times = [60, 90]
                wait_time = wait_times[attempt]
                print(f"שגיאת שרת ({e.__class__.__name__}) בעמוד {page_num}, ניסיון {attempt + 1}/{max_retries}. ממתין {wait_time} שניות...")
                time.sleep(wait_time)
            else:
                print(f"שגיאת שרת ({e.__class__.__name__}) בעמוד {page_num}: כל {max_retries} הניסיונות נכשלו. עובר ל-GPT...")
                return analyze_with_gpt(image_path, page_num)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                if current_key_index < len(API_KEYS) - 1:
                    print(f"המפתח הנוכחי הגיע למגבלה. עובר למפתח הגיבוי...")
                    current_key_index += 1
                    client = genai.Client(api_key=API_KEYS[current_key_index])
                    continue
                if attempt < max_retries - 1:
                    wait_times = [60, 90]
                    wait_time = wait_times[attempt]
                    print(f"שגיאת Quota (429) בעמוד {page_num}, ניסיון {attempt + 1}/{max_retries}. ממתין {wait_time} שניות...")
                    time.sleep(wait_time)
                else:
                    print(f"שגיאת Quota (429) בעמוד {page_num}: כל {max_retries} הניסיונות נכשלו. עובר ל-GPT...")
                    return analyze_with_gpt(image_path, page_num)
            elif "503" in error_str or "UNAVAILABLE" in error_str:
                if attempt < max_retries - 1:
                    wait_times = [60, 90]
                    wait_time = wait_times[attempt]
                    print(f"שגיאת שרת (503 UNAVAILABLE) בעמוד {page_num}, ניסיון {attempt + 1}/{max_retries}. ממתין {wait_time} שניות...")
                    time.sleep(wait_time)
                else:
                    print(f"שגיאת שרת (503 UNAVAILABLE) בעמוד {page_num}: כל {max_retries} הניסיונות נכשלו. עובר ל-GPT...")
                    return analyze_with_gpt(image_path, page_num)
            else:
                print(f"שגיאה בתקשורת מול גוגל API בעמוד {page_num}: {e}. עובר ל-GPT...")
                return analyze_with_gpt(image_path, page_num)

# =====================================================================
# 3. פונקציית עזר לייצור ה-DXF והניתוב
# =====================================================================
def add_marking_text(doc_obj, msp_obj, x, y, text_content):
    layer_name = "5"
    if layer_name not in doc_obj.layers:
        doc_obj.layers.new(name=layer_name, dxfattribs={"color": 7})
    txt = msp_obj.add_text(text_content, dxfattribs={"layer": layer_name, "height": 40.0})
    txt.set_placement((x, y), align=ezdxf.enums.TextEntityAlignment.CENTER)

def process_production_and_dxf(json_data, page_num, dxf_output_folder):
    try:
        data = json.loads(json_data)
    except Exception as e:
        print(f"שגיאה בפענוח מבנה ה-JSON בעמוד {page_num}: {e}")
        return

    print("\n--- הנתונים שפוענחו מהדף (מבנה JSON) ---")
    print(json.dumps(data, indent=4, ensure_ascii=False))
    print("---------------------------------------\n")

    project_num = data.get("project_number", "113")
    project_name = data.get("project_name", "Shve_Tzion")
    
    print(f"==================================================")
    print(f"   ניתוב רצפת ייצור - עמוד {page_num} | פרויקט {project_num} ({project_name})")
    print(f"==================================================")
    
    for part in data.get("parts", []):
        # תמיכה בטוחה במפתחות ID מגוונים ומניעת תווים לא חוקיים כמו '?'
        part_id = part.get("id") or part.get("part_id") or "?"
        part_type = str(part.get("type", "kufsa")).lower().strip()
        
        # חילוץ מידות גמיש - תומך גם במבנה שטוח וגם במבנה עטוף תחת "dimensions"
        dims = part.get("dimensions", {}) if isinstance(part.get("dimensions"), dict) else part
        
        w = dims.get("width") or dims.get("width_start") or 650
        h = dims.get("height") or dims.get("height_start") or 650
        length = dims.get("length") or 1200
        
        try:
            w = int(w)
            h = int(h)
            length = int(length)
        except:
            w, h, length = 650, 650, 1200
            
        prefix = f"Page_{page_num}_Proj_{project_num}_Part_{part_id}"
        text_content = f"P{part_id}"

        if part_type in ["kufsa", "straight_90", "straight", "box", "kufsa_duct"]:
            blank_width = 2 * (w + h)
            print(f"[מכונה מגלגלת] חלק {part_id}: קופסה/ישר {w}x{h} L={length} | רוחב פח נדרש: {blank_width} מ\"מ")

            doc = ezdxf.new(dxfversion="R2010")
            msp = doc.modelspace()
            points = [(0, 0), (w, 0), (w, length), (0, length), (0, 0)]
            msp.add_lwpolyline(points)
            add_marking_text(doc, msp, w / 2, length / 2, text_content)

            filename = f"{prefix}_Kufsa_{w}x{h}_L{length}.dxf"
            doc.saveas(os.path.join(dxf_output_folder, filename))
            print(f"[חיתוך לייזר] חלק {part_id}: נוצר קובץ DXF -> {filename}")
            
        elif part_type in ["maavar", "transition", "maavar_duct"]:
            w2 = dims.get("width_end") or w
            h2 = dims.get("height_end") or h
            try:
                w2 = int(w2)
                h2 = int(h2)
            except:
                w2, h2 = w, h
                
            slope_height = math.sqrt(length**2 + ((w2 - w) / 2)**2)
            offset = (w2 - w) / 2
            
            doc = ezdxf.new(dxfversion="R2010")
            msp = doc.modelspace()
            points = [(0, 0), (w, 0), (w + offset, slope_height), (offset, slope_height), (0, 0)]
            msp.add_lwpolyline(points)
            add_marking_text(doc, msp, (w / 2) + (offset / 2), slope_height / 2, text_content)
            
            filename = f"{prefix}_Maavar_Trapez_{w}x{h}_to_{w2}x{h2}.dxf"
            doc.saveas(os.path.join(dxf_output_folder, filename))
            print(f"[חיתוך לייזר] חלק {part_id}: נוצר קובץ DXF של מעבר (טרפז) -> {filename}")
            
        elif part_type in ["kashet", "elbow", "curve", "kashet_duct"]:
            r_inner = 100 
            r_outer = r_inner + w
            h_dxf = h
            
            # 1. דופן
            doc_cheek = ezdxf.new(dxfversion="R2010")
            msp_cheek = doc_cheek.modelspace()
            msp_cheek.add_arc((0, 0), radius=r_inner, start_angle=0, end_angle=90)
            msp_cheek.add_arc((0, 0), radius=r_outer, start_angle=0, end_angle=90)
            msp_cheek.add_line((r_inner, 0), (r_outer, 0))
            msp_cheek.add_line((0, r_inner), (0, r_outer))
            r_mid = (r_inner + r_outer) / 2
            text_x = r_mid * math.cos(math.radians(45))
            text_y = r_mid * math.sin(math.radians(45))
            add_marking_text(doc_cheek, msp_cheek, text_x, text_y, text_content)
            filename_cheek = f"{prefix}_Kashet_Dofan.dxf"
            doc_cheek.saveas(os.path.join(dxf_output_folder, filename_cheek))
            
            # 2. גב
            length_outer = (2 * math.pi * r_outer) / 4
            doc_heel = ezdxf.new(dxfversion="R2010")
            msp_heel = doc_heel.modelspace()
            points_heel = [(0, 0), (length_outer, 0), (length_outer, h_dxf), (0, h_dxf), (0, 0)]
            msp_heel.add_lwpolyline(points_heel)
            add_marking_text(doc_heel, msp_heel, length_outer / 2, h_dxf / 2, text_content)
            filename_heel = f"{prefix}_Kashet_Gav_Yashar.dxf"
            doc_heel.saveas(os.path.join(dxf_output_folder, filename_heel))
            
            # 3. בטן
            length_inner = (2 * math.pi * r_inner) / 4
            doc_throat = ezdxf.new(dxfversion="R2010")
            msp_throat = doc_throat.modelspace()
            points_throat = [(0, 0), (length_inner, 0), (length_inner, h_dxf), (0, h_dxf), (0, 0)]
            msp_throat.add_lwpolyline(points_throat)
            add_marking_text(doc_throat, msp_throat, length_inner / 2, h_dxf / 2, text_content)
            filename_throat = f"{prefix}_Kashet_Beten_Yashar.dxf"
            doc_throat.saveas(os.path.join(dxf_output_folder, filename_throat))
            
            print(f"[חיתוך לייזר] חלק {part_id}: נוצרו 3 קבצי DXF לקשת (דופן, גב, בטן)")
        else:
            print(f"[אחר / לא לייזר] חלק {part_id}: סוג תוכנן כ-'{part_type}' - נשלח להרכבה/ייצור ידני.")

# =====================================================================
# 4. התוכנית הראשית - ממשק בחירת עמודים אינטראקטיבי
# =====================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PDF duct measurement parser → DXF + Firebase sync")
    parser.add_argument("pdf_file", nargs="?", default=None, help="Path to PDF file (interactive prompt if omitted)")
    parser.add_argument("--client", default="Ali Sharara Ltd", help="Client name for Firestore key (default: Ali Sharara Ltd)")
    parser.add_argument("--project", default="", help="Project name for Firestore key (auto-detected from PDF if omitted)")
    cli_args = parser.parse_args()

    # Override pdf_path if provided via CLI
    if cli_args.pdf_file:
        if os.path.isabs(cli_args.pdf_file):
            pdf_path = cli_args.pdf_file
        else:
            pdf_path = os.path.join(current_dir, cli_args.pdf_file)

    if not os.path.exists(pdf_path):
        print(f"שגיאה: קובץ PDF לא נמצא: {pdf_path}")
        exit(1)

    print(f"טוען את קובץ ה-PDF: {pdf_path}")
    try:
        pages = convert_from_path(pdf_path, dpi=200, poppler_path=poppler_bin_path)
        total_pages = len(pages)
        print(f"נמצאו {total_pages} עמודים בקובץ ה-PDF.")
    except Exception as e:
        print(f"שגיאה בטעינת ה-PDF: {e}")
        exit(1)

    print("\n--- אפשרויות סריקה ---")
    print("1. לסריקת כל העמודים: הקלד 'all'")
    print("2. לסריקת עמוד בודד: הקלד את מספר העמוד (למשל: 3)")
    print("3. לסריקת עמודים ספציפיים: הקלד פסיקים או טווח (למשל: 1,3,4 או 2-4)")
    user_input = input("איזה עמודים ברצונך לסרוק? ").strip().lower()

    selected_indices = []
    
    if user_input == 'all':
        selected_indices = list(range(total_pages))
    elif '-' in user_input:
        match = re.match(r"(\d+)-(\d+)", user_input)
        if match:
            start = int(match.group(1))
            end = int(match.group(2))
            selected_indices = list(range(max(1, start) - 1, min(total_pages, end)))
    elif ',' in user_input:
        parts = user_input.split(',')
        for p in parts:
            if p.strip().isdigit():
                idx = int(p.strip()) - 1
                if 0 <= idx < total_pages:
                    selected_indices.append(idx)
    elif user_input.isdigit():
        idx = int(user_input) - 1
        if 0 <= idx < total_pages:
            selected_indices.append(idx)

    if not selected_indices:
        print("בחירה לא תקינה. התוכנית נסגרת.")
        exit(1)

    print(f"\nמתחיל לעבד {len(selected_indices)} עמודים...")
    parsed_pages = {}

    # Pass 1: AI analysis — collect all parsed JSON results
    for idx in selected_indices:
        page_num = idx + 1
        print(f"\n--- מנתח עמוד {page_num} מתוך {total_pages} ---")
        
        temp_image_path = os.path.join(current_dir, f"temp_page_{page_num}.png")
        try:
            pages[idx].save(temp_image_path, 'PNG')
            json_result = analyze_duct_sheet(temp_image_path, page_num)
            
            if json_result:
                parsed_pages[page_num] = json_result
            else:
                print(f"נכשל פענוח הנתונים עבור עמוד {page_num}")
                
        except Exception as e:
            print(f"שגיאה בעיבוד עמוד {page_num}: {e}")
        finally:
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)

    if not parsed_pages:
        print("\nאין נתונים לעיבוד.")
        exit(1)

    # Extract project info from first page for folder naming
    first_data = json.loads(parsed_pages[list(parsed_pages.keys())[0]])
    client_name = cli_args.client
    project_name_raw = first_data.get("project_name", "Unknown_Project")
    project_number = first_data.get("project_number", "")
    project_name_clean = sanitize_folder_name(project_name_raw)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")

    # Use CLI --project if provided, otherwise auto-detect from PDF
    if cli_args.project:
        resolved_project_for_key = cli_args.project
    else:
        resolved_project_for_key = f"{project_name_raw} #{project_number}" if project_number else project_name_raw

    # Create dedicated run folder: laser_dxf_outputs/{client}/{project}_{number}/{YYYY-MM-DD_HH-MM}/
    run_folder = os.path.join(
        laser_dxf_outputs_root,
        sanitize_folder_name(client_name),
        f"{project_name_clean}_{project_number}" if project_number else project_name_clean,
        timestamp
    )
    os.makedirs(run_folder, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  תיקיית פלט DXFs: {run_folder}")
    print(f"{'='*60}")

    # Pass 2: DXF generation — write all files into the dedicated run folder
    for page_num in sorted(parsed_pages.keys()):
        process_production_and_dxf(parsed_pages[page_num], page_num, run_folder)

    print(f"\n{'='*60}")
    print(f"  כל העמודים עובדו! קבצי DXF נשמרו בתיקייה:")
    print(f"  {run_folder}")
    print(f"{'='*60}")

    # Pass 3: Sync to Firebase
    print(f"\nמסנכרן {len(parsed_pages)} עמודים ל-Firestore...")
    sync_pages_to_firebase(
        parsed_pages,
        client_name=client_name,
        project_name=resolved_project_for_key,
    )
    print("הסנכרון ל-Firestore הושלם! הנתונים יוצגו במערכת.")