import difflib
from typing import List, Dict, Any, Optional
from app.schemas import DiffChunk, ClaimDiffItem, FindingDiffItem, TimeMachineComparisonResponse
from app.enums import FindingCategory, Severity, AuditStatus

class DiffEngine:
    """
    Computes text diffs, claim differences, and audit finding evolutions
    between revisions for the Brand Time Machine.
    """

    @staticmethod
    def compute_text_diff(text_a: str, text_b: str) -> List[DiffChunk]:
        """
        Token-level / word-level diff generator for side-by-side & inline views.
        """
        words_a = text_a.split()
        words_b = text_b.split()
        matcher = difflib.SequenceMatcher(None, words_a, words_b)

        chunks: List[DiffChunk] = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                chunks.append(DiffChunk(type="equal", text=" ".join(words_a[i1:i2])))
            elif tag == "delete":
                chunks.append(DiffChunk(type="remove", text=" ".join(words_a[i1:i2])))
            elif tag == "insert":
                chunks.append(DiffChunk(type="add", text=" ".join(words_b[j1:j2])))
            elif tag == "replace":
                chunks.append(DiffChunk(type="remove", text=" ".join(words_a[i1:i2])))
                chunks.append(DiffChunk(type="add", text=" ".join(words_b[j1:j2])))

        return chunks

    @staticmethod
    def compare_claims(claims_a: List[Any], claims_b: List[Any]) -> List[ClaimDiffItem]:
        """
        Detects claims added, removed, or altered in numeric value.
        """
        diff_items: List[ClaimDiffItem] = []
        dict_a = {c.claim_text.lower(): c for c in claims_a}
        dict_b = {c.claim_text.lower(): c for c in claims_b}

        # Check in B
        for text_b_lower, cb in dict_b.items():
            if text_b_lower in dict_a:
                ca = dict_a[text_b_lower]
                if ca.extracted_value != cb.extracted_value:
                    diff_items.append(ClaimDiffItem(
                        claim_text=cb.claim_text,
                        status="modified",
                        old_value=ca.extracted_value,
                        new_value=cb.extracted_value
                    ))
                else:
                    diff_items.append(ClaimDiffItem(
                        claim_text=cb.claim_text,
                        status="persisted",
                        old_value=ca.extracted_value,
                        new_value=cb.extracted_value
                    ))
            else:
                diff_items.append(ClaimDiffItem(
                    claim_text=cb.claim_text,
                    status="added",
                    old_value=None,
                    new_value=cb.extracted_value
                ))

        # Check removed from A
        for text_a_lower, ca in dict_a.items():
            if text_a_lower not in dict_b:
                diff_items.append(ClaimDiffItem(
                    claim_text=ca.claim_text,
                    status="removed",
                    old_value=ca.extracted_value,
                    new_value=None
                ))

        return diff_items

    @staticmethod
    def compare_findings(findings_a: List[Any], findings_b: List[Any]) -> List[FindingDiffItem]:
        """
        Detects newly introduced violations and resolved findings.
        """
        diff_items: List[FindingDiffItem] = []
        # Key by category + explanation snippet
        keys_a = {f"{f.category.value}:{f.explanation[:40].lower()}": f for f in findings_a}
        keys_b = {f"{f.category.value}:{f.explanation[:40].lower()}": f for f in findings_b}

        for k, fb in keys_b.items():
            if k in keys_a:
                diff_items.append(FindingDiffItem(
                    category=fb.category,
                    severity=fb.severity,
                    explanation=fb.explanation,
                    status="persisted"
                ))
            else:
                diff_items.append(FindingDiffItem(
                    category=fb.category,
                    severity=fb.severity,
                    explanation=fb.explanation,
                    status="new_finding"
                ))

        for k, fa in keys_a.items():
            if k not in keys_b:
                diff_items.append(FindingDiffItem(
                    category=fa.category,
                    severity=fa.severity,
                    explanation=fa.explanation,
                    status="resolved"
                ))

        return diff_items

    @classmethod
    def generate_narrative_explanation(cls, claims_diff: List[ClaimDiffItem], findings_diff: List[FindingDiffItem]) -> str:
        resolved = [f for f in findings_diff if f.status == "resolved"]
        new_findings = [f for f in findings_diff if f.status == "new_finding"]
        modified_claims = [c for c in claims_diff if c.status == "modified"]

        parts = []
        if resolved:
            parts.append(f"Successfully resolved {len(resolved)} prior compliance issue(s).")
        if modified_claims:
            for mc in modified_claims:
                parts.append(f"Performance figure updated from {mc.old_value or 'N/A'} to {mc.new_value or 'N/A'}.")
        if new_findings:
            parts.append(f"Introduced {len(new_findings)} new finding(s) requiring review.")
        if not parts:
            parts.append("Minor editorial updates without material compliance impact.")

        return " (AI-Generated Summary) " + " ".join(parts)
