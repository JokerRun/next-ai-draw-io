# Validation Rules Reference

> Extracted from `lib/utils.ts` - validateMxCellStructure() and autoFixXml()

## Core Validation Rules

### 1. No Wrapper Tags

**Rule**: Generate ONLY mxCell elements - NO wrapper tags.

```xml
<!-- ❌ WRONG -->
<mxfile>
  <diagram>
    <mxGraphModel>
      <root>
        <mxCell id="2" .../>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

<!-- ✅ CORRECT -->
<mxCell id="2" value="Label" style="rounded=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

### 2. No Root Cells

**Rule**: Do NOT include root cells (id="0" or id="1") - added automatically.

```xml
<!-- ❌ WRONG -->
<mxCell id="0"/>
<mxCell id="1" parent="0"/>
<mxCell id="2" .../>

<!-- ✅ CORRECT -->
<mxCell id="2" value="Start" .../>
<mxCell id="3" value="End" .../>
```

### 3. No Nested mxCell

**Rule**: All mxCell elements must be siblings - NEVER nest.

```xml
<!-- ❌ WRONG - nested mxCell -->
<mxCell id="lane1" value="Lane" style="swimlane;">
  <mxCell id="step1" value="Step" parent="lane1">  <!-- NESTED! -->
  </mxCell>
</mxCell>

<!-- ✅ CORRECT - siblings with parent reference -->
<mxCell id="lane1" value="Lane" style="swimlane;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="200" as="geometry"/>
</mxCell>
<mxCell id="step1" value="Step" style="rounded=1;" vertex="1" parent="lane1">
  <mxGeometry x="20" y="60" width="160" height="40" as="geometry"/>
</mxCell>
```

### 4. Unique IDs

**Rule**: Every mxCell needs a unique id attribute (start from "2").

```xml
<!-- ❌ WRONG - duplicate IDs -->
<mxCell id="2" value="A" .../>
<mxCell id="2" value="B" .../>  <!-- DUPLICATE! -->

<!-- ✅ CORRECT -->
<mxCell id="2" value="A" .../>
<mxCell id="3" value="B" .../>
```

### 5. Valid Parent Reference

**Rule**: Every mxCell needs valid parent attribute.

- Use `parent="1"` for top-level shapes
- Use `parent="<container-id>"` for grouped elements

```xml
<!-- Top-level shape -->
<mxCell id="2" ... parent="1">

<!-- Shape inside swimlane -->
<mxCell id="step1" ... parent="lane1">
```

### 6. Escape Special Characters

**Rule**: Escape special characters in value attributes.

| Character | Escape |
|-----------|--------|
| `<` | `&lt;` |
| `>` | `&gt;` |
| `&` | `&amp;` |
| `"` | `&quot;` |
| `'` | `&apos;` |

```xml
<!-- ❌ WRONG -->
<mxCell id="2" value="A < B" .../>

<!-- ✅ CORRECT -->
<mxCell id="2" value="A &lt; B" .../>
```

### 7. No Empty IDs

**Rule**: mxCell elements must have non-empty id attributes.

```xml
<!-- ❌ WRONG -->
<mxCell id="" value="Label" .../>

<!-- ✅ CORRECT -->
<mxCell id="2" value="Label" .../>
```

### 8. No XML Comments

**Rule**: NEVER include XML comments in generated XML.

Draw.io strips comments, which breaks edit_diagram patterns.

```xml
<!-- ❌ WRONG -->
<mxCell id="2" .../>
<!-- This is a comment -->  <!-- DON'T DO THIS -->
<mxCell id="3" .../>

<!-- ✅ CORRECT -->
<mxCell id="2" .../>
<mxCell id="3" .../>
```

---

## Additional Validation Checks

### Duplicate Structural Attributes

These attributes should not be duplicated within a single tag:
- `edge`
- `parent`
- `source`
- `target`
- `vertex`
- `connectable`

### Tag Mismatches

Opening and closing tags must match:

```xml
<!-- ❌ WRONG -->
<mxCell id="2">
</mxElement>  <!-- Mismatched! -->

<!-- ✅ CORRECT -->
<mxCell id="2">
</mxCell>
```

### Valid Edge References

Edge source/target must reference existing cell IDs:

```xml
<!-- source="2" and target="3" must exist -->
<mxCell id="4" edge="1" source="2" target="3">
```

---

## Auto-Fix Capabilities

The validation system can auto-fix these issues:

| Issue | Auto-Fix |
|-------|----------|
| CDATA wrapper | Remove `<![CDATA[` and `]]>` |
| Duplicate attributes | Keep first, remove others |
| Unescaped `&` | Replace with `&amp;` |
| Double-escaped entities | `&ampquot;` → `&quot;` |
| `<Cell>` tags | Convert to `<mxCell>` |
| Unclosed tags | Append missing closing tags |
| Duplicate IDs | Append `_dup1`, `_dup2` suffix |
| Empty IDs | Generate unique ID |
| JSON-escaped XML | Unescape `\"` and `\n` |

---

## Error Messages

Common validation error messages and their meaning:

| Error | Meaning |
|-------|---------|
| "Found nested mxCell" | mxCell is inside another mxCell |
| "Duplicate structural attribute" | Same attribute appears twice in tag |
| "Duplicate ID(s)" | Multiple elements share same id |
| "Unclosed tag(s)" | Missing closing tag |
| "Unescaped & character" | `&` not escaped as `&amp;` |
| "Invalid entity reference" | Unknown entity like `&foo;` |

---

## Validation Function Reference

```typescript
// Main validation function
function validateMxCellStructure(xml: string): string | null
// Returns: null if valid, error message if invalid

// Auto-fix function
function autoFixXml(xml: string): { fixed: string; fixes: string[] }
// Returns: fixed XML and list of applied fixes

// Combined validate and fix
function validateAndFixXml(xml: string): {
  valid: boolean;
  error: string | null;
  fixed: string | null;
  fixes: string[];
}
```
