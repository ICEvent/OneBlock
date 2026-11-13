#!/usr/bin/env python3
"""Fail-closed static regression guard for legacy OIP security semantics."""
from pathlib import Path
backend = Path("src/oneblock_backend/main.mo").read_text()
scores = Path("src/oneblock_frontend/src/components/ScoresOIP.tsx").read_text()
console = Path("src/oneblock_frontend/src/pages/OipConsole.tsx").read_text()
assert "verified = input.verified;" not in backend, "untrusted input marked verified"
assert "verified = false;" in backend, "legacy factor must default to unverified"
assert "signed payload verification unavailable; use certified proof registry" in backend
assert 'model_version = "oip-v0.3-legacy-quarantined"' in backend
assert "getScores(principal : Text)" in backend
assert "recomputeScoresInternal(g, null, Time.now())" in backend
assert "Legacy OIP factors have not been cryptographically verified" in scores
assert "verified: false, confidence: 0.84" in console
print("PASS: self/provider factors not trusted, stale scores quarantined, UI says not assessed")
