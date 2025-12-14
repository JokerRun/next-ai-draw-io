# Version Lock

## 当前同步版本

| Field | Value |
|-------|-------|
| **Project** | next-ai-draw-io |
| **Version** | 0.4.0 |
| **Commit** | 0851b32 |
| **Commit Message** | refactor: simplify LLM XML format to output bare mxCells only |
| **Sync Date** | 2025-12-14 |
| **Synced By** | rico |

---

## 关键文件状态

| File | Last Modified | Notes |
|------|---------------|-------|
| lib/system-prompts.ts | 2025-12-14 | System prompt 定义 |
| lib/utils.ts | 2025-12-14 | XML 验证/修复逻辑 |
| app/api/chat/route.ts | 2025-12-14 | Tools 定义 |
| app/api/chat/xml_guide.md | 2025-12-14 | XML 格式文档 |

---

## 依赖版本

从 package.json 提取的关键依赖：

| Package | Version |
|---------|---------|
| ai | ^5.0.89 |
| zod | ^4.1.12 |
| @xmldom/xmldom | ^0.9.8 |

---

## 上游仓库

- **Upstream**: https://github.com/DayuanJiang/next-ai-draw-io
- **Fork**: https://github.com/JokerRun/next-ai-draw-io

---

## 更新此文件

同步后请更新：
1. Commit hash 和 message
2. Sync Date
3. 关键文件的 Last Modified 日期
4. 如有依赖变更，更新依赖版本表
