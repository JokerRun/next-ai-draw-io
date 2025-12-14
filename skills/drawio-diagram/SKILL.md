---
name: drawio-diagram
description: This skill should be used when the user asks to "create a draw.io diagram", "generate flowchart XML", "create architecture diagram", "draw a sequence diagram", "make a swimlane diagram", "generate mxCell XML", "draw a flowchart", "create ER diagram", "AWS architecture diagram", "GCP architecture", "Azure diagram", or needs to generate/edit draw.io XML programmatically. Provides tools, validation rules, and best practices for creating professional diagrams.
version: 0.1.0
---

# Draw.io Diagram Generation Skill

Generate and edit draw.io diagrams through precise XML specifications. This skill provides tools, validation rules, and best practices for creating professional diagrams programmatically.

## Quick Start

Generate ONLY mxCell elements - wrapper tags and root cells are added automatically:

```xml
<mxCell id="2" value="Start" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
<mxCell id="3" value="End" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="300" y="100" width="120" height="60" as="geometry"/>
</mxCell>
<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

## Core Operations

This skill provides three core operations for diagram manipulation, available as CLI scripts:

### 1. Create/Display Diagram

Create a new diagram from bare mxCell elements.

```bash
# Wrap mxCells and create .drawio file
npx tsx scripts/wrap-xml.ts cells.xml -o diagram.drawio

# Validate before creating
npx tsx scripts/validate-xml.ts cells.xml && npx tsx scripts/wrap-xml.ts cells.xml -o diagram.drawio
```

**When to use:**
- Creating new diagrams from scratch
- Major structural changes
- Regenerating entire diagram

### 2. Edit Diagram

Edit specific parts of existing diagram using search/replace patterns.

```bash
# Single edit
npx tsx scripts/edit-xml.ts diagram.xml -s '<mxCell id="2"...' -r '<mxCell id="2" value="New"...'

# Multiple edits (JSON)
npx tsx scripts/edit-xml.ts diagram.xml --edits '[{"search":"old","replace":"new"}]' -o updated.xml
```

**Matching strategies (tried in order):**
1. Exact match
2. Trimmed match (ignoring whitespace)
3. Substring match
4. Character frequency match (attribute-order agnostic)
5. Match by mxCell id attribute
6. Match by value attribute

**When to use:**
- Small modifications
- Changing text/colors/positions
- Adding/removing specific elements

### 3. Append/Continue Diagram

Append mxCell elements to existing diagram (for truncated output or additions).

```bash
# Append truncated continuation
npx tsx scripts/append-xml.ts base.xml fragment.xml -o complete.xml

# Smart merge with duplicate ID handling
npx tsx scripts/append-xml.ts base.xml additions.xml --merge -o merged.xml
```

**When to use:**
- Continuing truncated LLM output
- Merging diagram fragments
- Adding new elements to existing diagram

## Validation Rules (CRITICAL)

1. **Generate ONLY mxCell elements** - NO wrapper tags (`<mxfile>`, `<mxGraphModel>`, `<root>`)
2. **Do NOT include root cells** (id="0" or id="1") - added automatically
3. **All mxCell elements must be siblings** - NEVER nest mxCell inside another mxCell
4. **Every mxCell needs unique id** - Start from "2"
5. **Every mxCell needs valid parent** - Use "1" for top-level, or container-id for grouped
6. **Escape special characters** - `&lt;` `&gt;` `&amp;` `&quot;`

## Layout Constraints

- Keep elements within single page viewport (avoid page breaks)
- Position: x=0-800, y=0-600
- Max container size: 700x550 pixels
- Start from margins (x=40, y=40)
- Use compact layouts, vertical stacking or grid

## Common Styles

**Shapes:**
- Rectangle: `rounded=0;whiteSpace=wrap;html=1;`
- Rounded: `rounded=1;whiteSpace=wrap;html=1;`
- Ellipse: `ellipse;whiteSpace=wrap;html=1;`
- Diamond: `rhombus;whiteSpace=wrap;html=1;`
- Swimlane: `swimlane;startSize=30;`

**Edges:**
- Arrow: `edgeStyle=orthogonalEdgeStyle;endArrow=classic;`
- Curved: `curved=1;endArrow=classic;`
- Animated: `flowAnimation=1;` (add to edge style)

**Colors:** `fillColor=#hex;strokeColor=#hex;fontColor=#hex;`

## Cloud Architecture Diagrams

For AWS/GCP/Azure diagrams:
- AWS: Use **AWS 2025 icons** - Claude is trained on these
- Add `shape=mxgraph.aws4.*` for AWS shapes
- See `references/cloud-icons.md` for full icon reference

## Additional Resources

### Reference Files

For detailed patterns and specifications, consult:
- **`references/xml-format.md`** - Complete XML schema reference
- **`references/validation-rules.md`** - Detailed validation rules and auto-fix logic
- **`references/edge-routing.md`** - Edge routing rules to avoid overlapping
- **`references/cloud-icons.md`** - AWS/GCP/Azure icon styles

### Example Files

Working examples in `examples/`:
- **`flowchart.xml`** - Basic flowchart
- **`swimlane.xml`** - Swimlane diagram
- **`aws-architecture.xml`** - AWS architecture diagram

### CLI Scripts

Complete CLI toolchain in `scripts/` for draw.io XML processing.

> **Detailed documentation:** See `references/cli-scripts.md` for full usage guide.

```bash
# === Core Operations (Recommended) ===
# Wrap with built-in validation (blocks invalid XML)
node scripts/wrap-xml.js cells.xml -o diagram.drawio

# Export to PNG for preview
node scripts/export-png.js diagram.drawio -o preview.png

# === Editing ===
# Edit existing diagram (search/replace)
npx tsx scripts/edit-xml.ts diagram.xml -s "old" -r "new" -o updated.xml

# Append/merge fragments
npx tsx scripts/append-xml.ts base.xml fragment.xml -o merged.xml

# === Utilities ===
# Validate XML structure
npx tsx scripts/validate-xml.ts diagram.xml

# Auto-fix common XML issues
npx tsx scripts/fix-xml.ts diagram.xml -o fixed.xml

# Format/pretty-print XML
npx tsx scripts/format-xml.ts diagram.xml

# Check if XML is complete (not truncated)
npx tsx scripts/check-complete.ts diagram.xml

# Merge multiple pages
node scripts/merge-pages.js page1.drawio page2.drawio -o combined.drawio
```

| Script | Purpose | Exit codes |
|--------|---------|------------|
| `wrap-xml.js` | Wrap + validate (recommended) | 0=success, 1=validation failed |
| `export-png.js` | Export PNG/PDF/SVG | 0=success, 1=failed |
| `edit-xml.ts` | Search/replace editing | 0=all success, 1=some failed |
| `append-xml.ts` | Append/merge fragments | - |
| `validate-xml.ts` | Validate XML structure | 0=valid, 1=invalid |
| `fix-xml.ts` | Auto-fix common issues | - |
| `wrap-xml.ts` | Add mxFile wrapper (no validation) | - |
| `format-xml.ts` | Pretty-print XML | - |
| `check-complete.ts` | Check truncation | 0=complete, 1=truncated |
| `merge-pages.js` | Merge multi-page .drawio | - |

## Export Preview (draw.io Desktop CLI)

直接使用 draw.io 桌面版 CLI 导出图片预览（推荐，无需脚本）：

```bash
# macOS
/Applications/draw.io.app/Contents/MacOS/draw.io --export \
  --format png --scale 2 --output preview.png diagram.drawio

# Linux
drawio --export --format png --output preview.png diagram.drawio
```

**常用选项：**
| 选项 | 说明 |
|------|------|
| `--format png\|pdf\|svg\|jpg` | 输出格式 |
| `--scale 2` | 缩放倍数 |
| `--border 10` | 边框像素 |
| `--transparent` | 透明背景 (PNG) |
| `--all-pages` | 导出所有页 (PDF) |
| `--page-index 0` | 指定页面 |
| `--embed-diagram` | 嵌入源图表（可编辑 PNG）|

> **完整参考:** `.skill-dev/DESKTOP_CLI.md`

## Workflow

1. **Plan layout** - Describe structure in 2-3 sentences to avoid overlapping
2. **Generate XML** - Use display_diagram with mxCell elements only
3. **Validate** - Check against validation rules
4. **Iterate** - Use edit_diagram for refinements

## Error Recovery

If edit_diagram fails with "pattern not found":
1. First retry: Check attribute order - copy EXACTLY from current XML
2. Second retry: Expand context - include more surrounding lines
3. Third retry: Match on just `<mxCell id="X"` prefix
4. After 3 failures: Fall back to display_diagram
