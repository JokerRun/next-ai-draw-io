## 复盘结论

基于 skill-development 技能指导原则，对 drawio-diagram skill 进行了内容层级的详细复盘。

### 核心问题

1. **[P0] 缺少端到端工作流** - Workflow 章节只有 4 步抽象描述，用户不知道如何从 XML → .drawio → PNG
2. **[P0] 引用已删除文件** - L35-36 引用 `wrap-xml.ts`（已删除），应改为 `wrap-xml.js`
3. **[P0] 语言混用** - Export Preview 章节是中文，应统一为英文
4. **[P1] 触发短语不完整** - 缺少 edit/export/preview/multi-page 场景
5. **[P2] 脚本表格重复** - 与 references/cli-scripts.md 重复

---

## 执行计划

### P0 - 必须修复

#### 1. 添加 "End-to-End Workflow" 章节
位置：Quick Start 之后，Core Operations 之前

内容：
- Create New Diagram（3步：generate → wrap-xml.js → export）
- Edit Existing Diagram（3步：edit → validate → export）
- Handle Truncated Output（3步：check → append → wrap）

#### 2. 修复已删除文件引用
- L35-36: `wrap-xml.ts` → `wrap-xml.js`
- L36: `npx tsx` → `node`

#### 3. 统一语言为英文
- L200-222: 翻译中文内容为英文

### P1 - 应该修复

#### 4. 扩展触发短语
添加：`"edit diagram"`, `"modify flowchart"`, `"export diagram to PNG"`, `"preview diagram"`, `"multi-page diagram"`

#### 5. 精简 Workflow 章节
删除旧的 4 步抽象描述，保留新的具体工作流

### P2 - 可选（本次跳过）

- 添加 examples/workflow-demo/
- 精简脚本表格

---

## 预期变更

| 文件 | 变更 |
|------|------|
| SKILL.md | 添加 End-to-End Workflow、修复引用、翻译中文、扩展触发短语 |

预计修改约 80 行。