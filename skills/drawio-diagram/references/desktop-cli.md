# draw.io Desktop CLI Reference

draw.io 桌面版内置强大的命令行导出功能，可直接用于图片/PDF 导出，无需额外脚本。

## 安装

### macOS

```bash
# 方式一：官网下载
# https://www.drawio.com/ → 下载 .dmg 安装

# 方式二：Homebrew
brew install --cask drawio
```

安装后 CLI 路径：`/Applications/draw.io.app/Contents/MacOS/draw.io`

### Linux

```bash
# Snap (推荐)
sudo snap install drawio

# 或下载 .deb/.rpm
# https://github.com/jgraph/drawio-desktop/releases
```

CLI 路径：`/snap/bin/drawio` 或 `/usr/bin/drawio`

### Windows

从官网下载安装：https://www.drawio.com/

CLI 路径：`C:\Program Files\draw.io\draw.io.exe`

---

## 基础用法

```bash
draw.io --export --format <fmt> --output <file> <input.drawio>
```

### 快速示例

```bash
# macOS - 导出 PNG (2x 缩放)
/Applications/draw.io.app/Contents/MacOS/draw.io --export \
  --format png --scale 2 --output diagram.png diagram.drawio

# 简写 (如果 draw.io 在 PATH 中)
drawio --export -f png -o diagram.png diagram.drawio
```

---

## 完整选项参考

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-x, --export` | 启用导出模式 | - |
| `-f, --format <fmt>` | 输出格式: png, pdf, svg, jpg, vsdx, xml | pdf |
| `-o, --output <file>` | 输出文件路径 | 同输入文件名 |
| `-s, --scale <n>` | 缩放比例 | 1 |
| `-b, --border <n>` | 边框像素 | 0 |
| `-q, --quality <n>` | JPEG 质量 (1-100) | 90 |
| `-t, --transparent` | 透明背景 (PNG) | - |
| `-a, --all-pages` | 导出所有页面 (仅 PDF) | - |
| `-p, --page-index <n>` | 指定页面 (0-indexed) | 0 |
| `-g, --page-range <from>..<to>` | 页面范围 (仅 PDF) | - |
| `-l, --layers <indexes>` | 指定图层 (逗号分隔) | 全部 |
| `--width <n>` | 适应宽度 (保持比例) | - |
| `--height <n>` | 适应高度 (保持比例) | - |
| `--crop` | 裁剪 PDF 到图表大小 | - |
| `-e, --embed-diagram` | 嵌入图表源 (PNG/SVG/PDF) | - |
| `--embed-svg-images` | 嵌入 SVG 中的图片 | - |
| `-u, --uncompressed` | 不压缩 XML 输出 | - |
| `-r, --recursive` | 递归处理文件夹 | - |
| `-k, --check` | 不覆盖已存在文件 | - |

---

## 常用场景

### 1. 高清 PNG 预览

```bash
# 2x 缩放，10px 边框
drawio --export --format png --scale 2 --border 10 \
  --output preview.png diagram.drawio
```

### 2. 透明背景 PNG

```bash
drawio --export --format png --transparent --scale 2 \
  --output icon.png diagram.drawio
```

### 3. PDF 文档（所有页面）

```bash
drawio --export --format pdf --all-pages --crop \
  --output document.pdf diagram.drawio
```

### 4. 指定页面导出

```bash
# 导出第2页 (0-indexed)
drawio --export --format png --page-index 1 \
  --output page2.png diagram.drawio
```

### 5. 多页分别导出

```bash
# 导出所有页面为独立 PNG
# 输出: diagram-Page-1.png, diagram-Page-2.png, ...
for i in 0 1 2; do
  drawio --export --format png --page-index $i \
    --output "page-$((i+1)).png" diagram.drawio
done
```

### 6. SVG 导出（嵌入字体）

```bash
drawio --export --format svg --embed-svg-fonts true \
  --output diagram.svg diagram.drawio
```

### 7. 批量转换（文件夹）

```bash
# 递归转换所有 .drawio 文件为 PNG
drawio --export --format png --recursive \
  --output ./output/ ./diagrams/
```

### 8. 嵌入源图表（可编辑 PNG）

```bash
# 生成的 PNG 可用 draw.io 打开编辑
drawio --export --format png --embed-diagram \
  --output editable.png diagram.drawio
```

---

## 与脚本配合

### 推荐工作流

```bash
# 1. 验证+包装 (使用脚本)
node scripts/wrap-xml.js cells.xml -o diagram.drawio

# 2. 导出预览 (直接用 CLI，更高效)
/Applications/draw.io.app/Contents/MacOS/draw.io --export \
  --format png --scale 2 --output preview.png diagram.drawio
```

### Shell 别名（推荐添加到 ~/.zshrc）

```bash
# macOS
alias drawio='/Applications/draw.io.app/Contents/MacOS/draw.io'

# 快速导出函数
drawio-png() {
  local input="$1"
  local output="${2:-${input%.drawio}.png}"
  drawio --export --format png --scale 2 --border 10 --output "$output" "$input"
  echo "✅ Exported: $output"
}
```

使用：

```bash
drawio-png diagram.drawio              # → diagram.png
drawio-png diagram.drawio preview.png  # → preview.png
```

---

## 故障排除

### CLI 找不到

```bash
# 检查安装
ls -la /Applications/draw.io.app/Contents/MacOS/draw.io  # macOS
which drawio  # Linux

# 验证版本
/Applications/draw.io.app/Contents/MacOS/draw.io --version
```

### 导出失败

1. **检查文件有效性** - 先用 draw.io GUI 打开确认
2. **检查权限** - 确保输出目录可写
3. **增加超时** - 大文件可能需要更长时间

### 无头环境 (CI/Server)

draw.io 需要图形环境，在无头服务器上使用：

```bash
# 使用 xvfb
xvfb-run drawio --export --format png diagram.drawio

# 或 Docker
docker run -v $(pwd):/data rlespinasse/drawio-export:latest \
  --format png --output /data/output.png /data/diagram.drawio
```

---

## 参考链接

- [draw.io Desktop Releases](https://github.com/jgraph/drawio-desktop/releases)
- [Command Line Usage](https://www.drawio.com/doc/faq/command-line-args)
- [draw.io Export Docker](https://github.com/rlespinasse/drawio-export)
