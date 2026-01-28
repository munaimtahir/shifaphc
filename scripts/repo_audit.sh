#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${1:-audit_out}"
mkdir -p "$REPORT_DIR"

REPORT_MD="$REPORT_DIR/repo-audit.md"
TOP_N="${TOP_N:-20}"
BIG_FILE_MB="${BIG_FILE_MB:-1}"  # show files >= 1MB in report

echo "# Repository Audit Report" > "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo "**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Quick Summary" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

# Total size (working tree)
TOTAL_BYTES=$(du -sb . 2>/dev/null | awk '{print $1}' || true)
TOTAL_HUMAN=$(du -sh . 2>/dev/null | awk '{print $1}' || true)
echo "- Working tree size: \`${TOTAL_HUMAN:-unknown}\` (${TOTAL_BYTES:-unknown} bytes)" >> "$REPORT_MD"

# Git tracked size (rough)
GIT_COUNT=$(git ls-files | wc -l | tr -d ' ')
echo "- Tracked files (git ls-files): \`${GIT_COUNT}\`" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Top ${TOP_N} Largest Directories (working tree)" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo '```' >> "$REPORT_MD"
du -sh ./* 2>/dev/null | sort -hr | head -n "$TOP_N" >> "$REPORT_MD" || true
echo '```' >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Top ${TOP_N} Largest Files (working tree)" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo '```' >> "$REPORT_MD"
# Find largest files excluding .git
find . -type f -not -path "./.git/*" -printf "%s\t%p\n" 2>/dev/null \
  | sort -nr \
  | head -n "$TOP_N" \
  | awk '{printf "%.2fMB\t%s\n", $1/1024/1024, $2}' >> "$REPORT_MD" || true
echo '```' >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Files >= ${BIG_FILE_MB}MB (working tree)" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo '```' >> "$REPORT_MD"
find . -type f -not -path "./.git/*" -size +"${BIG_FILE_MB}"M -printf "%s\t%p\n" 2>/dev/null \
  | sort -nr \
  | awk '{printf "%.2fMB\t%s\n", $1/1024/1024, $2}' >> "$REPORT_MD" || true
echo '```' >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Common Junk / Generated Folders Found" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo '```' >> "$REPORT_MD"
for p in node_modules dist build .next .cache .pytest_cache .mypy_cache coverage __pycache__ .venv venv; do
  if [ -e "$p" ]; then
    du -sh "$p" 2>/dev/null || true
  fi
done
echo '```' >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Archives / Large Binaries Found (zips, tar, pdf, mp4, etc.)" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo '```' >> "$REPORT_MD"
find . -type f -not -path "./.git/*" \( \
  -iname "*.zip" -o -iname "*.7z" -o -iname "*.tar" -o -iname "*.gz" -o -iname "*.rar" \
  -o -iname "*.pdf" -o -iname "*.mp4" -o -iname "*.mov" -o -iname "*.iso" \
\) -printf "%s\t%p\n" 2>/dev/null | sort -nr | head -n 200 \
  | awk '{printf "%.2fMB\t%s\n", $1/1024/1024, $2}' >> "$REPORT_MD" || true
echo '```' >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Git Status (signals untracked bloat)" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
echo '```' >> "$REPORT_MD"
git status --porcelain=v1 || true
echo '```' >> "$REPORT_MD"
echo "" >> "$REPORT_MD"

echo "## Recommended Actions (Human Review Required)" >> "$REPORT_MD"
echo "" >> "$REPORT_MD"
cat >> "$REPORT_MD" << 'EOF'
- If `node_modules/`, `dist/`, `build/`, `.next/` exist: delete from repo, add to `.gitignore`.
- If archives (`*.zip`, `*.tar*`) exist: move outside repo, or store in Releases, or Git LFS if truly needed.
- If PDFs/videos/datasets exist: keep only if required for runtime; otherwise move to external storage.
- If multiple copies of the same project exist (duplicate folders): keep one canonical copy.
EOF

echo "Report written to: $REPORT_MD"
