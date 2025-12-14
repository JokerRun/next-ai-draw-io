## 现状总结

### .skill-dev 目录当前内容
```
.skill-dev/
├── 1.skill-dev-round1.md     # 开发历史记录 (用户 prompts)
├── CHANGELOG.md              # 版本变更日志
├── SOURCE_MAP.md             # 内容来源追踪
├── SYNC_CHECKLIST.md         # 上游同步指南
├── VERSION_LOCK.md           # 版本锁定
├── scripts/
│   └── check-upstream.sh     # 检查上游更新脚本
├── docs/
│   ├── REQUEST_FLOW.md       # 请求流程文档
│   ├── images/               # 10张流程图 (gemini生成)
│   └── request-flows-drawio-version/  # drawio版流程图
└── output/                   # 生成的测试文件
```

### scripts/ 目录现有脚本 (10个)
| 脚本 | 代码行数 | 功能 |
|------|---------|------|
| `validate-xml.ts` | 500+ | 验证 XML 结构 |
| `fix-xml.ts` | 500+ | 自动修复 XML |
| `wrap-xml.ts` | 120 | 包装为 .drawio |
| `wrap-xml.js` | 300 | 包装+验证 |
| `format-xml.ts` | 130 | 格式化 XML |
| `check-complete.ts` | 80 | 检查截断 |
| `edit-xml.ts` | 550+ | Search/replace |
| `append-xml.ts` | 280 | 追加/合并 |
| `merge-pages.js` | 100 | 合并多页 |
| `export-png.js` | 230 | 导出 PNG/PDF |

---

## draw.io Desktop CLI 能力分析

```
draw.io --export --format <fmt> --output <file> <input.drawio>
```

| 功能 | CLI 支持 | 脚本必要性 |
|------|---------|-----------|
| 导出 PNG/PDF/SVG/JPG | ✅ 完整支持 | ⚠️ 仅需薄封装 |
| 多页导出 | ✅ `--all-pages`, `--page-index` | ❌ 可直接用 |
| 缩放/边框 | ✅ `--scale`, `--border` | ❌ 可直接用 |
| 透明背景 | ✅ `--transparent` | ❌ 可直接用 |
| 嵌入图表 | ✅ `--embed-diagram` | ❌ 可直接用 |
| 裁剪 PDF | ✅ `--crop` | ❌ 可直接用 |

**CLI 不支持的功能（脚本必需）：**
- XML 结构验证
- 自动修复 XML 错误
- mxCell 包装为完整 .drawio
- Search/replace 编辑
- 追加/合并 XML 片段
- 检查 LLM 输出是否截断

---

## 改进方案

### 1. 脚本精简策略

**保留（核心价值）：**
| 脚本 | 理由 |
|------|------|
| `validate-xml.ts` | CLI 无此功能，防止生成无效 XML |
| `fix-xml.ts` | 自动修复，大幅提升成功率 |
| `wrap-xml.js` | 包装+验证一体化，保障输出质量 |
| `edit-xml.ts` | 精细编辑，CLI 不支持 |
| `append-xml.ts` | 处理 LLM 截断，CLI 不支持 |
| `check-complete.ts` | 检测截断，CLI 不支持 |
| `merge-pages.js` | 多页合并逻辑复杂 |

**精简（可用 CLI 替代）：**
| 脚本 | 替代方案 |
|------|---------|
| `export-png.js` | 直接用 CLI，或保留薄封装仅做路径检测 |
| `format-xml.ts` | 可选保留，价值较低 |
| `wrap-xml.ts` | 被 `wrap-xml.js` 取代 |

### 2. 文档完善

**需要新增到 .skill-dev：**
```
.skill-dev/
├── README.md                 # 维护指南入口 (新增)
├── DESKTOP_CLI.md            # draw.io CLI 完整参考 (新增)
├── 2.skill-dev-round2.md     # 本轮开发记录 (新增)
└── scripts/
    └── quick-export.sh       # CLI 常用命令速查 (新增)
```

**DESKTOP_CLI.md 内容：**
- 安装指南 (macOS/Linux/Windows)
- 完整命令参考
- 常用导出场景示例
- 与脚本配合使用流程

### 3. 推荐工作流调整

**之前（脚本为主）：**
```
生成 mxCells → wrap-xml.ts → export-png.js → 预览
```

**优化后（CLI + 核心脚本）：**
```
生成 mxCells → wrap-xml.js (验证+包装) → draw.io --export (直接CLI)
```

### 4. SKILL.md 更新

添加 Desktop CLI 快速参考：
```markdown
## Export Preview (draw.io Desktop CLI)

直接使用 draw.io CLI 导出图片预览：

# 安装: https://www.drawio.com/
# macOS
/Applications/draw.io.app/Contents/MacOS/draw.io --export \
  --format png --scale 2 --output preview.png diagram.drawio

# 常用选项
--format png|pdf|svg|jpg
--scale 2              # 缩放倍数
--border 10            # 边框像素
--transparent          # 透明背景
--all-pages            # 导出所有页
--page-index 0         # 指定页面
```

---

## 执行优先级

1. **P0 - 立即执行：**
   - 创建 `.skill-dev/README.md` 维护指南
   - 创建 `.skill-dev/DESKTOP_CLI.md` CLI 参考
   - 更新 SKILL.md 添加 CLI 快速参考

2. **P1 - 可选执行：**
   - 精简 `export-png.js` 或保留作为跨平台封装
   - 删除 `wrap-xml.ts`（已被 .js 版取代）
   - 记录本轮开发到 `2.skill-dev-round2.md`

3. **P2 - 后续考虑：**
   - 添加更多图表示例
   - 集成到 CI 自动验证
