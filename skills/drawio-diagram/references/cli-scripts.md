# CLI Scripts Reference

Complete command-line toolchain for draw.io XML processing.

## Quick Reference

| Script | Purpose | Example |
|--------|---------|---------|
| `validate-xml.ts` | Validate XML structure | `npx tsx scripts/validate-xml.ts cells.xml` |
| `fix-xml.ts` | Auto-fix common issues | `npx tsx scripts/fix-xml.ts cells.xml -o fixed.xml` |
| `wrap-xml.ts` | Wrap mxCells to .drawio | `npx tsx scripts/wrap-xml.ts cells.xml -o diagram.drawio` |
| `wrap-xml.js` | Wrap with built-in validation | `node scripts/wrap-xml.js cells.xml -o diagram.drawio` |
| `format-xml.ts` | Pretty-print XML | `npx tsx scripts/format-xml.ts diagram.xml` |
| `check-complete.ts` | Check if truncated | `npx tsx scripts/check-complete.ts diagram.xml` |
| `edit-xml.ts` | Search/replace editing | `npx tsx scripts/edit-xml.ts diagram.xml -s "old" -r "new"` |
| `append-xml.ts` | Append/merge fragments | `npx tsx scripts/append-xml.ts base.xml fragment.xml` |
| `merge-pages.js` | Merge multi-page .drawio | `node scripts/merge-pages.js page1.drawio page2.drawio` |
| `export-png.js` | Export to PNG/PDF | `node scripts/export-png.js diagram.drawio` |

---

## Core Operations

### validate-xml.ts

Validates draw.io XML structure against all rules.

```bash
npx tsx scripts/validate-xml.ts <file.xml>

# Options
--verbose, -v     Show detailed validation info
--quiet, -q       Only show errors
```

**Exit codes:**
- `0` - Valid XML
- `1` - Validation failed

**Checks performed:**
- mxCell structure and nesting
- ID uniqueness and validity (starts from "2")
- Parent references
- Geometry presence
- Edge source/target references
- Style attribute format
- Special character escaping

### fix-xml.ts

Automatically fix common XML issues.

```bash
npx tsx scripts/fix-xml.ts <file.xml> [-o output.xml]

# Options
-o, --output      Output file (default: overwrite input)
--dry-run         Show fixes without applying
```

**Auto-fixes:**
- Remove duplicate wrapper tags
- Fix ID conflicts (renumber from "2")
- Add missing parent attributes
- Fix malformed geometry
- Escape special characters
- Remove invalid root cells
- Fix edge references

### wrap-xml.ts

Wrap bare mxCell elements with full mxFile structure.

```bash
npx tsx scripts/wrap-xml.ts <cells.xml> -o diagram.drawio

# Options
-o, --output      Output file (required)
-t, --title       Diagram title (default: filename)
```

**Input:** Bare mxCell elements
```xml
<mxCell id="2" value="Start" style="rounded=1;..." vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

**Output:** Complete .drawio file with mxfile, diagram, mxGraphModel, root elements.

### wrap-xml.js (Recommended)

Wrap with **built-in validation** - blocks invalid XML from being saved.

```bash
node scripts/wrap-xml.js <cells.xml> -o diagram.drawio

# Options
-o, --output          Output file (required)
-t, --title           Diagram title
--skip-validate       Skip validation (not recommended)
```

**Behavior:**
- Runs full validation before wrapping
- If validation fails → exit(1), no file created
- If validation passes → create .drawio file

**Why use this over wrap-xml.ts:**
- Prevents saving invalid XML
- Single command for validate + wrap
- Safer for automated workflows

### format-xml.ts

Pretty-print and format XML.

```bash
npx tsx scripts/format-xml.ts <file.xml> [-o output.xml]

# Options
-o, --output      Output file (default: stdout)
-i, --indent      Indent size (default: 2)
```

### check-complete.ts

Check if XML output is complete (not truncated by LLM).

```bash
npx tsx scripts/check-complete.ts <file.xml>
```

**Exit codes:**
- `0` - Complete XML
- `1` - Truncated (missing closing tags)

**Detects:**
- Missing `</mxCell>` tags
- Incomplete `<mxGeometry>` elements
- Abrupt end of file

---

## Editing Operations

### edit-xml.ts

Edit existing diagrams using search/replace patterns.

```bash
# Single edit
npx tsx scripts/edit-xml.ts diagram.xml -s '<mxCell id="2"...' -r '<mxCell id="2" value="New"...'

# Multiple edits (JSON)
npx tsx scripts/edit-xml.ts diagram.xml --edits '[{"search":"old","replace":"new"}]' -o updated.xml

# Options
-s, --search      Search pattern
-r, --replace     Replacement text
--edits           JSON array of {search, replace} objects
-o, --output      Output file (default: overwrite)
```

**Matching strategies (tried in order):**
1. **Exact match** - Character-for-character
2. **Trimmed match** - Ignoring leading/trailing whitespace
3. **Substring match** - Pattern found within content
4. **Character frequency** - Attribute-order agnostic
5. **ID match** - Match by `<mxCell id="X"` prefix
6. **Value match** - Match by `value="..."` attribute

**When to use:**
- Small modifications (text, colors, positions)
- Targeted changes to specific elements
- Preserving surrounding content

### append-xml.ts

Append mxCell elements to existing diagram.

```bash
# Simple append
npx tsx scripts/append-xml.ts base.xml fragment.xml -o complete.xml

# Smart merge (handle duplicate IDs)
npx tsx scripts/append-xml.ts base.xml additions.xml --merge -o merged.xml

# Options
-o, --output      Output file (required)
--merge           Enable smart merge (renumber duplicate IDs)
```

**Use cases:**
- Continuing truncated LLM output
- Merging diagram fragments
- Adding new elements to existing diagram

---

## Multi-Page Operations

### merge-pages.js

Merge multiple .drawio files into a multi-page document.

```bash
node scripts/merge-pages.js page1.drawio page2.drawio -o combined.drawio

# Options
-o, --output      Output file (required)
```

**Features:**
- Preserves page names from source files
- Handles ID conflicts between pages
- Maintains all diagram properties

---

## Export Operations

### export-png.js

Export .drawio files to PNG, PDF, SVG, or JPG.

**Requires:** draw.io desktop app installed

```bash
# Basic export (PNG, 2x scale)
node scripts/export-png.js diagram.drawio

# Custom output
node scripts/export-png.js diagram.drawio -o preview.png

# High resolution
node scripts/export-png.js diagram.drawio --scale 3

# PDF export
node scripts/export-png.js diagram.drawio --format pdf

# All pages
node scripts/export-png.js diagram.drawio --all-pages

# Specific page (0-indexed)
node scripts/export-png.js diagram.drawio -p 0 -o page1.png
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output` | Output file path | `<input>.<format>` |
| `-f, --format` | png, pdf, svg, jpg | png |
| `-s, --scale` | Scale factor | 2 |
| `-b, --border` | Border in pixels | 10 |
| `-t, --transparent` | Transparent background (PNG) | false |
| `-a, --all-pages` | Export all pages | false |
| `-p, --page` | Export specific page (0-indexed) | - |

**draw.io Installation:**
- macOS: Download from https://www.drawio.com/ or `brew install --cask drawio`
- Linux: `snap install drawio` or download .deb/.rpm
- Windows: Download installer from https://www.drawio.com/

---

## Recommended Workflows

### Create New Diagram (Safe)

```bash
# 1. Generate mxCells to cells.xml
# 2. Wrap with validation (blocks invalid XML)
node scripts/wrap-xml.js cells.xml -o diagram.drawio

# 3. Optional: Export preview
node scripts/export-png.js diagram.drawio -o preview.png
```

### Edit Existing Diagram

```bash
# 1. Make targeted edits
npx tsx scripts/edit-xml.ts diagram.drawio -s 'old text' -r 'new text'

# 2. Validate changes
npx tsx scripts/validate-xml.ts diagram.drawio

# 3. Optional: Export preview
node scripts/export-png.js diagram.drawio
```

### Handle Truncated Output

```bash
# 1. Check if output is complete
npx tsx scripts/check-complete.ts output.xml
# Exit code 1 = truncated

# 2. If truncated, generate continuation and append
npx tsx scripts/append-xml.ts output.xml continuation.xml -o complete.xml

# 3. Wrap to .drawio
node scripts/wrap-xml.js complete.xml -o diagram.drawio
```

### Create Multi-Page Document

```bash
# 1. Create individual pages
node scripts/wrap-xml.js page1-cells.xml -o page1.drawio -t "Overview"
node scripts/wrap-xml.js page2-cells.xml -o page2.drawio -t "Details"

# 2. Merge pages
node scripts/merge-pages.js page1.drawio page2.drawio -o combined.drawio

# 3. Export all pages
node scripts/export-png.js combined.drawio --all-pages
```

---

## Error Handling

### Validation Failures

When `validate-xml.ts` or `wrap-xml.js` fails:

1. **Check for wrapper tags** - Remove `<mxfile>`, `<mxGraphModel>`, `<root>` if present
2. **Check for root cells** - Remove `<mxCell id="0">` and `<mxCell id="1">`
3. **Check ID uniqueness** - Ensure all IDs are unique, starting from "2"
4. **Run auto-fix** - `npx tsx scripts/fix-xml.ts input.xml -o fixed.xml`

### Edit Pattern Not Found

When `edit-xml.ts` can't find the pattern:

1. **Copy exact text** - Include all whitespace and attributes
2. **Expand context** - Include surrounding lines
3. **Match by ID** - Use just `<mxCell id="X"` as pattern
4. **Fallback** - Regenerate with `display_diagram` if multiple failures

### Export Failures

When `export-png.js` fails:

1. **Check draw.io installed** - Run `/Applications/draw.io.app/Contents/MacOS/draw.io --help`
2. **Check file validity** - Open in draw.io desktop to verify
3. **Check permissions** - Ensure write access to output directory
