# Edge Routing Rules

> Extracted from `lib/system-prompts.ts` - EXTENDED_ADDITIONS

## Overview

When creating edges/connectors, follow these rules to avoid overlapping lines and ensure professional-looking diagrams.

---

## Rule 1: No Shared Paths

**NEVER let multiple edges share the same path.**

If two edges connect the same pair of nodes, they MUST exit/enter at DIFFERENT positions.

```xml
<!-- ❌ WRONG - both edges at same position -->
<mxCell id="e1" style="exitY=0.5;entryY=0.5;" source="a" target="b"/>
<mxCell id="e2" style="exitY=0.5;entryY=0.5;" source="a" target="b"/>

<!-- ✅ CORRECT - different positions -->
<mxCell id="e1" style="exitY=0.3;entryY=0.3;" source="a" target="b"/>
<mxCell id="e2" style="exitY=0.7;entryY=0.7;" source="a" target="b"/>
```

---

## Rule 2: Bidirectional Connections

**For bidirectional connections (A↔B), use OPPOSITE sides.**

```
A → B: exit from RIGHT (exitX=1), enter LEFT (entryX=0)
B → A: exit from LEFT (exitX=0), enter RIGHT (entryX=1)
```

```xml
<!-- A to B -->
<mxCell id="e1" style="exitX=1;exitY=0.3;entryX=0;entryY=0.3;endArrow=classic;" 
        edge="1" source="a" target="b"/>

<!-- B to A -->
<mxCell id="e2" style="exitX=0;exitY=0.7;entryX=1;entryY=0.7;endArrow=classic;" 
        edge="1" source="b" target="a"/>
```

---

## Rule 3: Explicit Exit/Entry Points

**Always specify exitX, exitY, entryX, entryY explicitly.**

Every edge MUST have these 4 attributes set in the style:

```xml
<mxCell id="e1" 
        style="edgeStyle=orthogonalEdgeStyle;exitX=1;exitY=0.3;entryX=0;entryY=0.3;endArrow=classic;" 
        edge="1" parent="1" source="a" target="b">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### Exit/Entry Point Reference

| Position | X | Y |
|----------|---|---|
| Top-Left | 0 | 0 |
| Top-Center | 0.5 | 0 |
| Top-Right | 1 | 0 |
| Middle-Left | 0 | 0.5 |
| Center | 0.5 | 0.5 |
| Middle-Right | 1 | 0.5 |
| Bottom-Left | 0 | 1 |
| Bottom-Center | 0.5 | 1 |
| Bottom-Right | 1 | 1 |

---

## Rule 4: Obstacle Avoidance (CRITICAL)

**Route edges AROUND intermediate shapes.**

Before creating an edge:
1. Identify ALL shapes between source and target
2. If any shape is in direct path, use waypoints to route around
3. Add 20-30px clearance from shape boundaries

**For DIAGONAL connections**: Route along the PERIMETER (outside edge), NOT through the middle.

```xml
<!-- Routing around obstacle -->
<mxCell id="edge1" 
        style="edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=0;entryX=1;entryY=0.5;endArrow=classic;" 
        edge="1" parent="1" source="hotfix" target="main">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="750" y="80"/>   <!-- Go right first -->
      <mxPoint x="750" y="150"/>  <!-- Then down -->
    </Array>
  </mxGeometry>
</mxCell>
```

---

## Rule 5: Strategic Layout Planning

**Plan layout BEFORE generating XML.**

1. Organize shapes into visual layers/zones (columns or rows)
2. Space shapes 150-200px apart for clear routing channels
3. Mentally trace each edge: "What shapes are between source and target?"
4. Prefer layouts where edges flow in one direction (left-to-right or top-to-bottom)

---

## Rule 6: Multiple Waypoints

**Use multiple waypoints for complex routing.**

- One waypoint is often not enough
- Use 2-3 waypoints for L-shaped or U-shaped paths
- Each direction change needs a waypoint
- Waypoints should form orthogonal segments

```xml
<!-- U-shaped routing with 3 waypoints -->
<mxCell id="edge1" style="edgeStyle=orthogonalEdgeStyle;endArrow=classic;" 
        edge="1" source="a" target="b">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="100" y="300"/>  <!-- Down -->
      <mxPoint x="400" y="300"/>  <!-- Right -->
      <mxPoint x="400" y="100"/>  <!-- Up -->
    </Array>
  </mxGeometry>
</mxCell>
```

---

## Rule 7: Natural Connection Points

**Choose NATURAL connection points based on flow direction.**

- **NEVER use corner connections** (e.g., entryX=1, entryY=1) - they look unnatural

| Flow Direction | Exit | Entry |
|----------------|------|-------|
| Top-to-Bottom | exitY=1 (bottom) | entryY=0 (top) |
| Left-to-Right | exitX=1 (right) | entryX=0 (left) |
| Diagonal down-right | exitY=1 OR exitX=1 | entryY=0 OR entryX=0 |

---

## Pre-Generation Verification Checklist

Before generating XML, mentally verify:

1. **"Do any edges cross over shapes that aren't their source/target?"**
   - If yes → add waypoints

2. **"Do any two edges share the same path?"**
   - If yes → adjust exit/entry points

3. **"Are any connection points at corners?"**
   - If yes → use edge centers instead

4. **"Could I rearrange shapes to reduce edge crossings?"**
   - If yes → revise layout

---

## Examples

### Two Edges Between Same Nodes

```xml
<!-- First edge: upper path -->
<mxCell id="e1" value="A to B" 
        style="edgeStyle=orthogonalEdgeStyle;exitX=1;exitY=0.3;entryX=0;entryY=0.3;endArrow=classic;" 
        edge="1" parent="1" source="a" target="b">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>

<!-- Second edge: lower path (return) -->
<mxCell id="e2" value="B to A" 
        style="edgeStyle=orthogonalEdgeStyle;exitX=0;exitY=0.7;entryX=1;entryY=0.7;endArrow=classic;" 
        edge="1" parent="1" source="b" target="a">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### Single Waypoint Detour

```xml
<mxCell id="edge1" 
        style="edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=1;entryX=0.5;entryY=0;endArrow=classic;" 
        edge="1" parent="1" source="a" target="b">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="300" y="150"/>
    </Array>
  </mxGeometry>
</mxCell>
```

### Routing Around Obstacles

**Scenario**: Hotfix (right, bottom) → Main (center, top), but Develop (center, middle) is in between.

```xml
<!-- Route to the RIGHT of all shapes, then enter from right -->
<mxCell id="hotfix_to_main" 
        style="edgeStyle=orthogonalEdgeStyle;exitX=0.5;exitY=0;entryX=1;entryY=0.5;endArrow=classic;" 
        edge="1" parent="1" source="hotfix" target="main">
  <mxGeometry relative="1" as="geometry">
    <Array as="points">
      <mxPoint x="750" y="80"/>
      <mxPoint x="750" y="150"/>
    </Array>
  </mxGeometry>
</mxCell>
```

**Key principle**: When connecting distant nodes diagonally, route along the PERIMETER of the diagram, not through the middle where other shapes exist.
