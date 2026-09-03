from pathlib import Path

path = Path('src/oneblock_backend/main.mo')
text = path.read_text()
old = 'let newSummaryKey = nid # ":" # summary.app_id # ":" # summary.activity_type;'
new = 'let newSummaryKey = summaryKey(nid, summary.app_id, summary.activity_type);'
count = text.count(old)
if count != 2:
    raise SystemExit(f'expected exactly 2 legacy changeId summary keys, found {count}')
text = text.replace(old, new)
path.write_text(text)
