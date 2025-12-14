#!/usr/bin/env node
/**
 * Draw.io to PNG/PDF Exporter
 * 
 * Uses draw.io desktop app's command-line export feature.
 * Requires draw.io desktop installed: https://www.drawio.com/
 * 
 * Usage:
 *   node export-png.js <file.drawio>
 *   node export-png.js <file.drawio> -o output.png
 *   node export-png.js <file.drawio> --scale 2
 *   node export-png.js <file.drawio> --format pdf
 *   node export-png.js <file.drawio> --all-pages
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findDrawioPath() {
    const candidates = [
        // macOS
        '/Applications/draw.io.app/Contents/MacOS/draw.io',
        `${process.env.HOME}/Applications/draw.io.app/Contents/MacOS/draw.io`,
        // Linux
        '/usr/bin/drawio',
        '/usr/local/bin/drawio',
        '/opt/drawio/drawio',
        '/snap/bin/drawio',
        // Windows
        'C:\\Program Files\\draw.io\\draw.io.exe',
        `${process.env.LOCALAPPDATA}\\Programs\\draw.io\\draw.io.exe`,
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) {
            return p;
        }
    }

    // Try PATH
    const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['drawio'], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
    if (result.status === 0 && result.stdout.trim()) {
        return result.stdout.trim().split('\n')[0];
    }

    return null;
}

function exportFile(inputFile, options = {}) {
    const drawioPath = findDrawioPath();
    if (!drawioPath) {
        console.error('❌ draw.io desktop not found!');
        console.error('   Install from: https://www.drawio.com/');
        console.error('');
        console.error('   Expected locations:');
        console.error('   - macOS: /Applications/draw.io.app');
        console.error('   - Linux: /usr/bin/drawio or snap install drawio');
        console.error('   - Windows: C:\\Program Files\\draw.io\\draw.io.exe');
        process.exit(1);
    }

    console.log(`🔧 Using: ${drawioPath}`);

    const {
        output,
        format = 'png',
        scale = 2,
        border = 10,
        transparent = false,
        allPages = false,
        pageIndex
    } = options;

    const inputPath = path.resolve(inputFile);
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    const outputPath = output 
        ? path.resolve(output)
        : inputPath.replace(/\.drawio$/, `.${format}`);

    // Build args
    const args = [
        '--export',
        '--format', format,
        '--scale', String(scale),
        '--border', String(border),
        '--output', outputPath,
        inputPath
    ];

    if (transparent && format === 'png') {
        args.splice(args.indexOf('--export') + 1, 0, '--transparent');
    }

    if (allPages) {
        args.splice(args.indexOf('--export') + 1, 0, '--all-pages');
    } else if (pageIndex !== undefined) {
        args.splice(args.indexOf('--export') + 1, 0, '--page-index', String(pageIndex));
    }

    console.log(`📤 Exporting: ${path.basename(inputPath)}`);
    console.log(`   Format: ${format}, Scale: ${scale}x, Border: ${border}px`);
    if (allPages) console.log('   Mode: All pages');

    const result = spawnSync(drawioPath, args, {
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    if (result.status !== 0) {
        console.error(`❌ Export failed: ${result.stderr || result.error || 'Unknown error'}`);
        process.exit(1);
    }

    // Check output
    if (allPages) {
        // All pages export creates: output-Page-1.png, output-Page-2.png, etc.
        const dir = path.dirname(outputPath);
        const base = path.basename(outputPath, `.${format}`);
        const files = fs.readdirSync(dir).filter(f => 
            f.startsWith(base) && f.endsWith(`.${format}`)
        );
        if (files.length > 0) {
            console.log(`✅ Exported ${files.length} file(s):`);
            files.forEach(f => {
                const stats = fs.statSync(path.join(dir, f));
                console.log(`   - ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
            });
        } else {
            console.error('❌ Export failed: No output files created');
            process.exit(1);
        }
    } else {
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`✅ Exported: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            console.error('❌ Export failed: Output file not created');
            process.exit(1);
        }
    }

    return outputPath;
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
        console.log(`
Draw.io PNG/PDF Exporter

Uses draw.io desktop app's command-line export feature.
Requires draw.io desktop: https://www.drawio.com/

Usage:
  node export-png.js <file.drawio>
  node export-png.js <file.drawio> -o output.png
  node export-png.js <file.drawio> --scale 2
  node export-png.js <file.drawio> --format pdf

Options:
  -o, --output <file>    Output file path
  -f, --format <fmt>     Output format: png, pdf, svg, jpg (default: png)
  -s, --scale <n>        Scale factor (default: 2)
  -b, --border <n>       Border in pixels (default: 10)
  -t, --transparent      Transparent background (PNG only)
  -a, --all-pages        Export all pages
  -p, --page <n>         Export specific page (0-indexed)
  -h, --help             Show this help

Examples:
  node export-png.js diagram.drawio
  node export-png.js diagram.drawio -o preview.png --scale 3
  node export-png.js diagram.drawio --format pdf --all-pages
  node export-png.js diagram.drawio -p 0 -o page1.png
`);
        process.exit(args.includes('-h') || args.includes('--help') ? 0 : 1);
    }

    let inputFile = '';
    const options = {};

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '-o': case '--output':
                options.output = args[++i];
                break;
            case '-f': case '--format':
                options.format = args[++i];
                break;
            case '-s': case '--scale':
                options.scale = parseFloat(args[++i]);
                break;
            case '-b': case '--border':
                options.border = parseInt(args[++i], 10);
                break;
            case '-t': case '--transparent':
                options.transparent = true;
                break;
            case '-a': case '--all-pages':
                options.allPages = true;
                break;
            case '-p': case '--page':
                options.pageIndex = parseInt(args[++i], 10);
                break;
            default:
                if (!args[i].startsWith('-')) {
                    inputFile = args[i];
                }
        }
    }

    if (!inputFile) {
        console.error('❌ No input file specified');
        process.exit(1);
    }

    exportFile(inputFile, options);
}

main();
