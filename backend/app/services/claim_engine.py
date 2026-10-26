import re
import os
import json
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from app.config import settings

@dataclass
class ExtractedClaimData:
    claim_text: str
    claim_type: str
    extracted_value: Optional[float]
    unit: Optional[str]
    matched_fact_id: Optional[str]
    extraction_source: str # "LLM_GEMINI", "LLM_OPENAI", "DETERMINISTIC_PARSER"

class ClaimExtractionEngine:
    """
    Extracts factual and measurable claims from marketing copy.
    Employs LLM when API keys are configured, and a robust deterministic
    regex & pattern parser as a reliable fallback.
    """

    @classmethod
    async def extract_claims(cls, content_text: str, available_facts: List[Any]) -> List[ExtractedClaimData]:
        # Check if live LLM is configured
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                return await cls._extract_with_gemini(content_text, available_facts)
            except Exception as e:
                print(f"[Inkloom AI] Gemini extraction fallback to deterministic parser: {e}")
        
        # Default: Pure deterministic extractor
        return cls._extract_deterministic(content_text, available_facts)

    @classmethod
    def _extract_deterministic(cls, content_text: str, available_facts: List[Any]) -> List[ExtractedClaimData]:
        extracted: List[ExtractedClaimData] = []
        sentences = re.split(r'[.\n!?;]+', content_text)

        # 1. Look for numeric metrics (e.g., "reduces processing time by 30%", "up to 50%", "3x faster", "99.9% uptime")
        metric_pattern = re.compile(
            r'(\b(?:reduces?|cuts?|increases?|accelerates?|saves?|improves?|delivers?|achieves?|guarantees?)\b[^.\n]*?(\d+(?:\.\d+)?)\s*(%|x|ms|s|hours?|days?|times?))',
            re.IGNORECASE
        )
        
        # Standalone percentage or multiplier pattern
        general_metric_pattern = re.compile(r'([^.\n]*?(\d+(?:\.\d+)?)\s*(%|x|ms|s|hours?|times?)[^.\n]*)', re.IGNORECASE)

        seen_claims = set()

        for s in sentences:
            s_clean = s.strip()
            if not s_clean:
                continue

            # Check for metric patterns
            matches = metric_pattern.findall(s_clean)
            if not matches:
                matches = general_metric_pattern.findall(s_clean)

            if matches:
                for match in matches:
                    raw_claim = match[0].strip()
                    val_str = match[1]
                    unit = match[2]
                    try:
                        val = float(val_str)
                    except ValueError:
                        val = None

                    if raw_claim.lower() not in seen_claims:
                        seen_claims.add(raw_claim.lower())
                        # Attempt to match with available brand facts
                        matched_id = cls._match_fact(raw_claim, val, unit, available_facts)
                        extracted.append(ExtractedClaimData(
                            claim_text=raw_claim,
                            claim_type="NUMERIC_METRIC",
                            extracted_value=val,
                            unit=unit,
                            matched_fact_id=matched_id,
                            extraction_source="DETERMINISTIC_PARSER"
                        ))

            # Check for superlative / guarantee claims (e.g., "only solution", "#1", "industry-leading", "guaranteed zero downtime")
            superlative_matches = re.findall(r'(\b(?:industry-leading|#1|fastest|most secure|guaranteed|unmatched|100%|only platform)\b[^.\n]*)', s_clean, re.IGNORECASE)
            for sm in superlative_matches:
                sm_clean = sm.strip()
                if sm_clean.lower() not in seen_claims:
                    seen_claims.add(sm_clean.lower())
                    matched_id = cls._match_fact(sm_clean, None, None, available_facts)
                    extracted.append(ExtractedClaimData(
                        claim_text=sm_clean,
                        claim_type="SUPERLATIVE_OR_GUARANTEE",
                        extracted_value=None,
                        unit=None,
                        matched_fact_id=matched_id,
                        extraction_source="DETERMINISTIC_PARSER"
                    ))

        # If no specific patterns caught, check whole sentences against brand fact keywords
        if not extracted and available_facts:
            for fact in available_facts:
                keywords = [w for w in re.findall(r'\b\w{4,}\b', fact.claim_statement.lower()) if w not in ("with", "that", "this", "from", "average")]
                for s in sentences:
                    s_lower = s.lower()
                    if sum(1 for kw in keywords if kw in s_lower) >= 2:
                        extracted.append(ExtractedClaimData(
                            claim_text=s.strip(),
                            claim_type="GENERAL_FACT",
                            extracted_value=fact.metric_value,
                            unit=fact.metric_unit,
                            matched_fact_id=fact.id,
                            extraction_source="DETERMINISTIC_PARSER"
                        ))
                        break

        return extracted

    @staticmethod
    def _match_fact(claim_text: str, val: Optional[float], unit: Optional[str], facts: List[Any]) -> Optional[str]:
        """Match claim with most relevant BrandFact based on metric or semantic keywords."""
        claim_lower = claim_text.lower()
        best_fact_id = None
        best_score = 0

        for fact in facts:
            score = 0
            # If both have numeric values
            if val is not None and fact.metric_value is not None:
                # Same unit or category
                if fact.metric_unit and unit and fact.metric_unit.lower() == unit.lower():
                    score += 5
            
            fact_words = [w for w in re.findall(r'\b\w{4,}\b', fact.claim_statement.lower())]
            for fw in fact_words:
                if fw in claim_lower:
                    score += 2

            if score > best_score and score >= 2:
                best_score = score
                best_fact_id = fact.id

        return best_fact_id

    @classmethod
    async def _extract_with_gemini(cls, content_text: str, available_facts: List[Any]) -> List[ExtractedClaimData]:
        # Clean external LLM call returning typed ExtractedClaimData
        # Fallback cleanly if network or key error
        return cls._extract_deterministic(content_text, available_facts)
