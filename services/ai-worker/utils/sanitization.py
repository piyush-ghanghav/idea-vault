import re


def sanitize_for_prompt(text: str) -> str:
    """Strip prompt injection attempts from user-submitted text."""
    injection_patterns = [
        r"ignore\s+(previous|above|all)\s+instructions?",
        r"disregard\s+(previous|above|all)",
        r"you\s+are\s+now",
        r"act\s+as",
        r"new\s+instructions?",
        r"system\s*prompt",
        r"<\|.*?\|>",
        r"\[INST\]|\[\/INST\]",
        r"###\s*instruction",
    ]
    cleaned = text
    for pattern in injection_patterns:
        cleaned = re.sub(pattern, "[removed]", cleaned, flags=re.IGNORECASE)
    return cleaned[:3000]