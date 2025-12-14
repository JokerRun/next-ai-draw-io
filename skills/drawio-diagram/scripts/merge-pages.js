#!/usr/bin/env node
/**
 * Merge multiple mxCell XML files into a single multi-page .drawio file
 * 
 * Usage: node merge-pages.js <output.drawio> <page1.xml> <page2.xml> ...
 * Or: node merge-pages.js <output.drawio> --dir <pages-directory>
 */

const fs = require('fs');
const path = require('path');

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

function wrapPageContent(mxCellContent, pageName, pageId) {
  return `  <diagram id="${pageId}" name="${pageName}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${mxCellContent.split('\n').map(line => '        ' + line).join('\n')}
      </root>
    </mxGraphModel>
  </diagram>`;
}

function createMultiPageDrawio(pages) {
  const diagrams = pages.map((page) => {
    const pageId = generateId();
    return wrapPageContent(page.content, page.name, pageId);
  });

  return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="draw.io-skill" version="21.5.2" type="device">
${diagrams.join('\n')}
</mxfile>`;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node merge-pages.js <output.drawio> <page1.xml> [page2.xml ...]');
    console.log('   Or: node merge-pages.js <output.drawio> --dir <pages-directory>');
    console.log('');
    console.log('Page names are derived from filenames (e.g., page1_overview.xml -> "Overview")');
    process.exit(1);
  }

  const outputPath = args[0];
  let inputFiles = [];

  if (args[1] === '--dir') {
    const dir = args[2];
    if (!fs.existsSync(dir)) {
      console.error(`❌ Directory not found: ${dir}`);
      process.exit(1);
    }
    inputFiles = fs.readdirSync(dir)
      .filter(f => f.endsWith('.xml'))
      .sort()
      .map(f => path.join(dir, f));
  } else {
    inputFiles = args.slice(1);
  }

  if (inputFiles.length === 0) {
    console.error('❌ No input files found');
    process.exit(1);
  }

  const pages = [];

  for (const file of inputFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ File not found: ${file}`);
      process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf-8').trim();
    
    // Extract page name from filename
    const basename = path.basename(file, '.xml');
    const namePart = basename.replace(/^page\d+_?/, '');
    const pageName = namePart
      ? namePart.toUpperCase().split(/[-_]/).join(' ')
      : `Page ${pages.length + 1}`;

    pages.push({ name: pageName, content });
    console.log(`📄 Added: ${pageName} (${file})`);
  }

  const drawioContent = createMultiPageDrawio(pages);
  fs.writeFileSync(outputPath, drawioContent);

  console.log('');
  console.log(`✅ Created multi-page .drawio file: ${outputPath}`);
  console.log(`📊 Total pages: ${pages.length}`);
}

main();
