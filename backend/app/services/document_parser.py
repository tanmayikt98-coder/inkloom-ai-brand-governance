import io
import fitz # PyMuPDF
from typing import Tuple, List, Dict, Any, Optional

class DocumentParserService:
    """
    Extracts text and visual bounding boxes from uploaded documents (PDF, TXT, Markdown) securely.
    Supports PyMuPDF block and line coordinate mapping for visual grounding.
    """

    MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 # 15 MB limit
    SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".json"}

    @classmethod
    def extract_text_from_bytes(cls, filename: str, file_bytes: bytes) -> Tuple[bool, str]:
        """
        Returns (success: bool, extracted_text_or_error: str)
        """
        if len(file_bytes) > cls.MAX_FILE_SIZE_BYTES:
            return False, f"File size exceeds maximum permitted limit of {cls.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."

        ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in cls.SUPPORTED_EXTENSIONS:
            return False, f"Unsupported file type '{ext}'. Supported formats: {', '.join(cls.SUPPORTED_EXTENSIONS)}"

        try:
            if ext == ".pdf":
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                text_parts = []
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    text_parts.append(page.get_text())
                doc.close()
                full_text = "\n".join(text_parts).strip()
                if not full_text:
                    return False, "PDF document contained no extractable text layer (scanned images require OCR)."
                return True, full_text

            elif ext in (".txt", ".md", ".json"):
                try:
                    text = file_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    text = file_bytes.decode("latin-1")
                return True, text.strip()

            else:
                return False, f"Unhandled file format: {ext}"

        except Exception as e:
            return False, f"Document extraction failed: {str(e)}"

    @classmethod
    def extract_passages_with_bounding_boxes(
        cls,
        filename: str,
        file_bytes: bytes
    ) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Round 3 Enhancement: Extracts text passages along with exact coordinate bounding boxes
        (page_num, x0, y0, x1, y1, width, height) using PyMuPDF.
        Returns: (success: bool, full_text_or_err: str, passages: List[Dict])
        """
        if len(file_bytes) > cls.MAX_FILE_SIZE_BYTES:
            return False, f"File size exceeds {cls.MAX_FILE_SIZE_BYTES // (1024*1024)}MB.", []

        ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
        passages: List[Dict[str, Any]] = []

        try:
            if ext == ".pdf":
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                full_text_list = []
                for page_idx in range(len(doc)):
                    page = doc[page_idx]
                    page_rect = page.rect
                    page_w = float(page_rect.width)
                    page_h = float(page_rect.height)

                    # Extract blocks: (x0, y0, x1, y1, text, block_no, block_type)
                    blocks = page.get_text("blocks")
                    for b in blocks:
                        text = b[4].strip()
                        if not text:
                            continue
                        full_text_list.append(text)
                        passages.append({
                            "passage_id": f"p-{page_idx+1}-{b[5]}",
                            "page_num": page_idx + 1,
                            "text": text,
                            "bounding_box": {
                                "x0": round(float(b[0]), 2),
                                "y0": round(float(b[1]), 2),
                                "x1": round(float(b[2]), 2),
                                "y1": round(float(b[3]), 2),
                                "page_width": round(page_w, 2),
                                "page_height": round(page_h, 2)
                            }
                        })
                doc.close()
                return True, "\n\n".join(full_text_list), passages

            else:
                # Text / Markdown fallback with normalized page coordinates
                ok, text = cls.extract_text_from_bytes(filename, file_bytes)
                if not ok:
                    return False, text, []

                paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
                for idx, para in enumerate(paragraphs):
                    passages.append({
                        "passage_id": f"p-1-{idx}",
                        "page_num": 1,
                        "text": para,
                        "bounding_box": {
                            "x0": 72.0,
                            "y0": round(100.0 + (idx * 60.0) % 550.0, 2),
                            "x1": 540.0,
                            "y1": round(140.0 + (idx * 60.0) % 550.0, 2),
                            "page_width": 612.0,
                            "page_height": 792.0
                        }
                    })
                return True, text, passages

        except Exception as e:
            return False, f"Extraction failed: {str(e)}", []

    @classmethod
    def locate_quote_bounding_box(
        cls,
        file_bytes: bytes,
        quote: str
    ) -> Optional[Dict[str, Any]]:
        """
        Uses PyMuPDF search_for to pinpoint the exact visual bounding box for a cited quote.
        """
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                rects = page.search_for(quote)
                if rects:
                    r = rects[0]
                    res = {
                        "page_num": page_idx + 1,
                        "x0": round(float(r.x0), 2),
                        "y0": round(float(r.y0), 2),
                        "x1": round(float(r.x1), 2),
                        "y1": round(float(r.y1), 2),
                        "page_width": round(float(page.rect.width), 2),
                        "page_height": round(float(page.rect.height), 2),
                        "matched_text": quote
                    }
                    doc.close()
                    return res
            doc.close()
        except Exception:
            pass
        return None
