# Sync Checklist - 项目更新同步指南

## 何时需要同步

当上游项目 (upstream) 有以下变更时，需要同步 skill：

### 高优先级 (必须同步)

- [ ] `lib/system-prompts.ts` - System prompt 变更
- [ ] `lib/utils.ts` - 验证逻辑变更
- [ ] `app/api/chat/route.ts` - Tools 定义变更
- [ ] `app/api/chat/xml_guide.md` - XML 格式文档变更

### 中优先级 (评估后同步)

- [ ] 新增支持的图表类型
- [ ] 新增 Cloud Provider 图标支持 (如新增阿里云)
- [ ] 性能优化相关的 prompt 调整
- [ ] 新增验证规则

### 低优先级 (可选同步)

- [ ] UI 相关变更 (不影响 skill)
- [ ] 部署配置变更
- [ ] 依赖版本更新

---

## 同步步骤

### Step 1: 拉取上游更新

```bash
cd /Users/rico/apps/draw-io/next-ai-draw-io
git fetch upstream
git log upstream/main --oneline -10
```

### Step 2: 检查变更范围

```bash
# 获取上次同步的 commit (从 VERSION_LOCK.md)
LAST_SYNC=$(cat skills/drawio-diagram/.skill-dev/VERSION_LOCK.md | grep "Commit:" | awk '{print $2}')

# 检查关键文件变更
git diff $LAST_SYNC..upstream/main -- lib/system-prompts.ts
git diff $LAST_SYNC..upstream/main -- lib/utils.ts
git diff $LAST_SYNC..upstream/main -- app/api/chat/route.ts
git diff $LAST_SYNC..upstream/main -- app/api/chat/xml_guide.md
```

### Step 3: 评估影响

对照 `SOURCE_MAP.md` 确定需要更新的 skill 文件：

| 源文件变更 | 影响的 Skill 文件 |
|-----------|------------------|
| system-prompts.ts | SKILL.md, edge-routing.md |
| utils.ts | validation-rules.md |
| route.ts (tools) | SKILL.md |
| xml_guide.md | xml-format.md |

### Step 4: 执行同步

1. 更新受影响的 skill 文件
2. 保持 SKILL.md 精简 (~2000 words)
3. 详细内容放 references/

### Step 5: 更新元数据

```bash
# 更新 VERSION_LOCK.md
# - Commit hash
# - Sync Date
# - 文件 hash

# 更新 CHANGELOG.md
# - 版本号
# - 变更内容
# - Source Commit
```

### Step 6: 验证

- [ ] SKILL.md frontmatter 有效
- [ ] description 包含触发短语
- [ ] 所有 references 文件存在
- [ ] examples 文件有效
- [ ] scripts 可执行

### Step 7: 提交

```bash
git add skills/drawio-diagram/
git commit -m "chore(skill): sync drawio-diagram with upstream

> 同步上游项目变更到 skill

- Updated from upstream commit: <hash>
- Changes: <brief description>"
```

---

## 快速检查脚本

```bash
#!/bin/bash
# .skill-dev/scripts/check-upstream.sh

SKILL_DIR="skills/drawio-diagram"
LAST_SYNC=$(cat $SKILL_DIR/.skill-dev/VERSION_LOCK.md | grep "Commit:" | awk '{print $2}')

echo "Last sync commit: $LAST_SYNC"
echo "Checking for changes..."

FILES=(
  "lib/system-prompts.ts"
  "lib/utils.ts"
  "app/api/chat/route.ts"
  "app/api/chat/xml_guide.md"
)

for file in "${FILES[@]}"; do
  CHANGES=$(git diff $LAST_SYNC..upstream/main --stat -- $file | tail -1)
  if [ -n "$CHANGES" ]; then
    echo "⚠️  $file has changes"
  else
    echo "✓  $file unchanged"
  fi
done
```

---

## 注意事项

1. **保持向后兼容** - 不要删除已有的触发短语
2. **渐进式更新** - 大变更分多次提交
3. **测试触发** - 确保 skill 能被正确触发
4. **文档同步** - CHANGELOG 必须更新
