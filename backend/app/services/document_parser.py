import io
import fitz # PyMuPDF
from typing import Tuple

class DocumentParserService:
    """
    Extracts text from uploaded documents (PDF, TXT, Markdown) securely.
    Fails safely with descriptive error messages on corrupt or unsupported inputs.
    """

    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10 MB limit
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
