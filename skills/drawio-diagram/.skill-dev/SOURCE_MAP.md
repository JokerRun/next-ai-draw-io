# Source Map - 内容来源追踪

> 当项目更新时，根据此映射检查是否需要同步 skill

## 文件映射总览

| Skill File | Source File(s) | Description |
|------------|----------------|-------------|
| SKILL.md | Multiple (see below) | 核心指南 |
| references/xml-format.md | `app/api/chat/xml_guide.md` | XML Schema 参考 |
| references/validation-rules.md | `lib/utils.ts` | 验证规则 |
| references/edge-routing.md | `lib/system-prompts.ts` | 连线路由规则 |
| references/cloud-icons.md | `lib/system-prompts.ts` + 外部文档 | 云图标参考 |

---

## SKILL.md 详细来源

| Section | Source File | Location |
|---------|-------------|----------|
| Core Tools (display_diagram) | `app/api/chat/route.ts` | L280-320, tools.display_diagram |
| Core Tools (edit_diagram) | `app/api/chat/route.ts` | L321-340, tools.edit_diagram |
| Core Tools (append_diagram) | `app/api/chat/route.ts` | L341-355, tools.append_diagram |
| Validation Rules | `lib/utils.ts` | validateMxCellStructure() |
| Layout Constraints | `lib/system-prompts.ts` | DEFAULT_SYSTEM_PROMPT (Layout constraints section) |
| Common Styles | `app/api/chat/xml_guide.md` | Cell Style Reference section |
| Error Recovery | `lib/system-prompts.ts` | EXTENDED_ADDITIONS (edit_diagram Best Practices) |

---

## references/xml-format.md

| Source | Location |
|--------|----------|
| `app/api/chat/xml_guide.md` | 完整文件复制，略作格式调整 |

**关键 sections:**
- Basic Structure
- mxCell Attributes
- mxGeometry
- Cell Style Reference
- Common Patterns (Groups, Swimlanes, Tables)

---

## references/validation-rules.md

| Source | Functions |
|--------|-----------|
| `lib/utils.ts` | `validateMxCellStructure()` - 主验证函数 |
| `lib/utils.ts` | `checkDuplicateAttributes()` - 重复属性检查 |
| `lib/utils.ts` | `checkDuplicateIds()` - 重复ID检查 |
| `lib/utils.ts` | `checkTagMismatches()` - 标签匹配检查 |
| `lib/utils.ts` | `checkNestedMxCells()` - 嵌套检查 |
| `lib/utils.ts` | `autoFixXml()` - 自动修复逻辑 |

---

## references/edge-routing.md

| Source | Location |
|--------|----------|
| `lib/system-prompts.ts` | EXTENDED_ADDITIONS - "Edge Routing Rules" section |

**关键 rules:**
- Rule 1-7: Edge routing best practices
- Waypoint examples
- Obstacle avoidance patterns

---

## references/cloud-icons.md

| Source | Notes |
|--------|-------|
| `lib/system-prompts.ts` | "AWS 2025 icons" 提及 |
| External | Draw.io shape library documentation |

---

## 检查命令

快速检查源文件是否有变更：

```bash
# 检查核心文件变更
git diff <last_sync_commit>..HEAD -- lib/system-prompts.ts lib/utils.ts app/api/chat/route.ts app/api/chat/xml_guide.md

# 检查特定函数
rg "validateMxCellStructure|autoFixXml" lib/utils.ts
rg "display_diagram|edit_diagram|append_diagram" app/api/chat/route.ts
```
