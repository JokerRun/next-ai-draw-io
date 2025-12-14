# Skill Development & Maintenance Guide

> 本目录用于维护 drawio-diagram skill 的开发记录、同步流程和工具文档。

## 目录结构

```
.skill-dev/
├── README.md              # 本文件 - 维护指南入口
├── CHANGELOG.md           # 版本变更日志
├── SOURCE_MAP.md          # 内容来源追踪 (skill ↔ 源项目)
├── SYNC_CHECKLIST.md      # 上游同步指南
├── VERSION_LOCK.md        # 版本锁定信息
├── 1.skill-dev-round1.md  # 第一轮开发记录
├── 2.skill-dev-round2.md  # 第二轮开发记录
├── scripts/
│   └── check-upstream.sh  # 检查上游更新
├── docs/
│   ├── REQUEST_FLOW.md    # 请求流程分析
│   ├── images/            # 流程图 (gemini 生成)
│   └── request-flows-drawio-version/  # drawio 版流程图
└── output/                # 测试输出文件
```

> **注意:** `.skill-dev` 目录不随 skill 分发，仅用于开发维护。
> CLI 参考文档已移至 `references/desktop-cli.md`（随 skill 分发）。

---

## 快速参考

### 核心脚本 (scripts/)

| 脚本 | 用途 | 必要性 |
|------|------|--------|
| `validate-xml.ts` | 验证 XML 结构 | 核心 - CLI 不支持 |
| `fix-xml.ts` | 自动修复 XML | 核心 - CLI 不支持 |
| `wrap-xml.js` | 包装+验证一体化 | **推荐** - 阻止无效 XML |
| `edit-xml.ts` | Search/replace 编辑 | 核心 - CLI 不支持 |
| `append-xml.ts` | 追加/合并片段 | 核心 - 处理截断 |
| `check-complete.ts` | 检测截断 | 核心 - CLI 不支持 |
| `merge-pages.js` | 合并多页 .drawio | 辅助 |
| `export-png.js` | 导出 PNG/PDF | 可选 - CLI 可替代 |
| `format-xml.ts` | 格式化 XML | 可选 |

### draw.io Desktop CLI

**推荐直接使用 CLI 导出图片**（无需脚本封装）：

```bash
# macOS
/Applications/draw.io.app/Contents/MacOS/draw.io --export \
  --format png --scale 2 --output preview.png diagram.drawio

# Linux
drawio --export --format png --output preview.png diagram.drawio
```

> 详见 `references/desktop-cli.md`（随 skill 分发）

---

## 推荐工作流

### 创建新图表

```
生成 mxCells → wrap-xml.js (验证+包装) → draw.io CLI (导出预览)
```

```bash
# 1. 生成 mxCell XML (由 LLM 完成)

# 2. 包装为 .drawio (内置验证，无效则 exit 1)
node scripts/wrap-xml.js cells.xml -o diagram.drawio

# 3. 导出预览 (直接用 CLI)
/Applications/draw.io.app/Contents/MacOS/draw.io --export \
  --format png --scale 2 --output preview.png diagram.drawio
```

### 编辑现有图表

```bash
# Search/replace 编辑
npx tsx scripts/edit-xml.ts diagram.drawio -s "old" -r "new"

# 验证修改
npx tsx scripts/validate-xml.ts diagram.drawio
```

### 处理 LLM 截断输出

```bash
# 检测是否截断
npx tsx scripts/check-complete.ts output.xml
# exit 1 = 截断

# 追加续写内容
npx tsx scripts/append-xml.ts base.xml continuation.xml -o complete.xml
```

---

## 维护任务

### 同步上游更新

当源项目 (next-ai-draw-io) 有更新时：

1. 运行 `.skill-dev/scripts/check-upstream.sh` 检查变更
2. 对照 `SOURCE_MAP.md` 确定影响范围
3. 按 `SYNC_CHECKLIST.md` 执行同步
4. 更新 `VERSION_LOCK.md` 和 `CHANGELOG.md`

### 版本发布

1. 更新 `SKILL.md` 中的 version
2. 更新 `CHANGELOG.md`
3. 提交并打 tag

---

## 相关文档

- [SKILL.md](../SKILL.md) - 核心技能指南
- [references/cli-scripts.md](../references/cli-scripts.md) - 脚本详细文档
- [DESKTOP_CLI.md](./DESKTOP_CLI.md) - draw.io CLI 完整参考
