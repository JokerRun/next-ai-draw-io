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

## Core Tools

### 1. display_diagram

Display a NEW diagram. Use when creating from scratch or major restructuring.

**Input:** `{ xml: string }` - mxCell elements only (no wrapper tags)

**When to use:**
- Creating new diagrams
- Major structural changes
- Current diagram XML is empty

### 2. edit_diagram

Edit specific parts of EXISTING diagram using search/replace.

**Input:** `{ edits: Array<{search: string, replace: string}> }`

**Critical rules:**
- Copy search patterns EXACTLY from current XML (attribute order matters!)
- Include element's id attribute for unique targeting
- Include complete elements (mxCell + mxGeometry)

**When to use:**
- Small modifications
- Adding/removing elements
- Changing text/colors/positions

### 3. append_diagram

Continue generating when display_diagram was truncated.

**Input:** `{ xml: string }` - Continuation fragment (NO wrapper tags)

**When to use:** Only after display_diagram truncation error.

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

### Validation Script

Validate generated XML before rendering using CLI:

```bash
# Validate a file
npx ts-node scripts/validate-xml.ts diagram.xml

# Validate from stdin
echo '<mxCell id="2" .../>' | npx ts-node scripts/validate-xml.ts

# JSON output
npx ts-node scripts/validate-xml.ts -j diagram.xml
```

Exit codes: 0=valid, 1=invalid, 2=usage error

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
