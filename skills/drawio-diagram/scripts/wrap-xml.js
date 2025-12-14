#!/usr/bin/env node
/**
 * Draw.io XML Wrapper with Built-in Validation
 * 
 * Validates mxCell XML, then wraps with full mxFile structure.
 * Fails if validation errors are found.
 * 
 * Usage:
 *   node wrap-xml.js <file.xml> -o output.drawio
 *   cat cells.xml | node wrap-xml.js > wrapped.drawio
 * 
 * Options:
 *   -o, --output <file>   Write output to file
 *   --page-name <name>    Page name (default: "Page-1")
 *   --skip-validate       Skip validation (not recommended)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Validation (from validate-xml.ts)
// ============================================================================

const MAX_XML_SIZE = 1_000_000;
const STRUCTURAL_ATTRS = ["edge", "parent", "source", "target", "vertex", "connectable"];
const VALID_ENTITIES = new Set(["lt", "gt", "amp", "quot", "apos"]);

function parseXmlTags(xml) {
    const tags = [];
    let i = 0;
    while (i < xml.length) {
        const tagStart = xml.indexOf("<", i);
        if (tagStart === -1) break;
        let tagEnd = tagStart + 1;
        let inQuote = false;
        let quoteChar = "";
        while (tagEnd < xml.length) {
            const c = xml[tagEnd];
            if (inQuote) {
                if (c === quoteChar) inQuote = false;
            } else {
                if (c === '"' || c === "'") { inQuote = true; quoteChar = c; }
                else if (c === ">") break;
            }
            tagEnd++;
        }
        if (tagEnd >= xml.length) break;
        const tag = xml.substring(tagStart, tagEnd + 1);
        i = tagEnd + 1;
        const tagMatch = /^<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)/.exec(tag);
        if (!tagMatch) continue;
        tags.push({ tag, tagName: tagMatch[2], isClosing: tagMatch[1] === "/", isSelfClosing: tag.endsWith("/>") });
    }
    return tags;
}

function checkDuplicateAttributes(xml) {
    const structuralSet = new Set(STRUCTURAL_ATTRS);
    const tagPattern = /<[^>]+>/g;
    let tagMatch;
    while ((tagMatch = tagPattern.exec(xml)) !== null) {
        const tag = tagMatch[0];
        const attrPattern = /\s([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=/g;
        const attributes = new Map();
        let attrMatch;
        while ((attrMatch = attrPattern.exec(tag)) !== null) {
            const attrName = attrMatch[1];
            attributes.set(attrName, (attributes.get(attrName) || 0) + 1);
        }
        const duplicates = Array.from(attributes.entries())
            .filter(([name, count]) => count > 1 && structuralSet.has(name))
            .map(([name]) => name);
        if (duplicates.length > 0) return `Duplicate structural attribute(s): ${duplicates.join(", ")}`;
    }
    return null;
}

function checkDuplicateIds(xml) {
    const idPattern = /\bid\s*=\s*["']([^"']+)["']/gi;
    const ids = new Map();
    let idMatch;
    while ((idMatch = idPattern.exec(xml)) !== null) {
        const id = idMatch[1];
        if (id !== "0" && id !== "1") { // Skip root cells
            ids.set(id, (ids.get(id) || 0) + 1);
        }
    }
    const duplicateIds = Array.from(ids.entries())
        .filter(([, count]) => count > 1)
        .map(([id, count]) => `'${id}' (${count}x)`);
    if (duplicateIds.length > 0) return `Duplicate ID(s): ${duplicateIds.slice(0, 3).join(", ")}`;
    return null;
}

function checkTagMismatches(xml) {
    const xmlWithoutComments = xml.replace(/<!--[\s\S]*?-->/g, "");
    const tags = parseXmlTags(xmlWithoutComments);
    const tagStack = [];
    for (const { tagName, isClosing, isSelfClosing } of tags) {
        if (isClosing) {
            if (tagStack.length === 0) return `Closing tag </${tagName}> without matching opening tag`;
            const expected = tagStack.pop();
            if (expected?.toLowerCase() !== tagName.toLowerCase()) return `Expected closing tag </${expected}> but found </${tagName}>`;
        } else if (!isSelfClosing) {
            tagStack.push(tagName);
        }
    }
    if (tagStack.length > 0) return `${tagStack.length} unclosed tag(s): ${tagStack.join(", ")}`;
    return null;
}

function validateMxCellXml(xml) {
    const errors = [];
    const warnings = [];
    const cellCount = (xml.match(/<mxCell/g) || []).length;
    const edgeCount = (xml.match(/edge="1"/g) || []).length;

    if (xml.length > MAX_XML_SIZE) warnings.push(`XML size (${xml.length} bytes) exceeds 1MB`);
    if (/^\s*<!\[CDATA\[/.test(xml)) errors.push("XML wrapped in CDATA section");
    
    const dupAttrError = checkDuplicateAttributes(xml);
    if (dupAttrError) errors.push(dupAttrError);
    
    const dupIdError = checkDuplicateIds(xml);
    if (dupIdError) errors.push(dupIdError);
    
    const tagMismatchError = checkTagMismatches(xml);
    if (tagMismatchError) errors.push(tagMismatchError);
    
    // Check for empty IDs
    if (/<mxCell[^>]*\sid\s*=\s*["']\s*["'][^>]*>/g.test(xml)) errors.push("mxCell with empty id attribute");

    return { valid: errors.length === 0, errors, warnings, stats: { size: xml.length, cellCount, edgeCount } };
}

// ============================================================================
// Wrapper
// ============================================================================

const ROOT_CELLS = '<mxCell id="0"/><mxCell id="1" parent="0"/>';

function wrapWithMxFile(xml, pageName = "Page-1") {
    if (!xml || !xml.trim()) {
        return `<mxfile><diagram name="${pageName}" id="page-1"><mxGraphModel><root>${ROOT_CELLS}</root></mxGraphModel></diagram></mxfile>`;
    }
    if (xml.includes("<mxfile")) return xml;
    if (xml.includes("<mxGraphModel")) return `<mxfile><diagram name="${pageName}" id="page-1">${xml}</diagram></mxfile>`;

    let content = xml;
    if (xml.includes("<root>")) content = xml.replace(/<\/?root>/g, "").trim();

    // Remove any existing root cells
    content = content
        .replace(/<mxCell[^>]*\bid=["']0["'][^>]*(?:\/>|><\/mxCell>)/g, "")
        .replace(/<mxCell[^>]*\bid=["']1["'][^>]*(?:\/>|><\/mxCell>)/g, "")
        .trim();

    return `<mxfile><diagram name="${pageName}" id="page-1"><mxGraphModel><root>${ROOT_CELLS}${content}</root></mxGraphModel></diagram></mxfile>`;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    let xml = "";
    let outputFile = "";
    let pageName = "Page-1";
    let skipValidate = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-o" || args[i] === "--output") outputFile = args[++i];
        else if (args[i] === "--page-name") pageName = args[++i];
        else if (args[i] === "--skip-validate") skipValidate = true;
        else if (args[i] === "-h" || args[i] === "--help") {
            console.log(`
Draw.io XML Wrapper (with validation)

Usage:
  node wrap-xml.js <file.xml> -o output.drawio
  cat cells.xml | node wrap-xml.js > output.drawio

Options:
  -o, --output <file>   Write output to file
  --page-name <name>    Page name (default: "Page-1")
  --skip-validate       Skip validation (not recommended)
  -h, --help            Show this help
`);
            process.exit(0);
        } else if (!args[i].startsWith("-")) {
            const filePath = path.resolve(args[i]);
            if (!fs.existsSync(filePath)) { console.error(`Error: File not found: ${filePath}`); process.exit(2); }
            xml = fs.readFileSync(filePath, "utf-8");
        }
    }

    // Read from stdin if no file
    if (!xml && !process.stdin.isTTY) {
        const chunks = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        xml = Buffer.concat(chunks).toString("utf-8");
    }

    if (!xml.trim()) { console.error("Error: Empty input"); process.exit(2); }

    // Validate first (unless skipped)
    if (!skipValidate) {
        const result = validateMxCellXml(xml);
        
        console.error(`\n📊 Stats: ${result.stats.cellCount} cells, ${result.stats.edgeCount} edges, ${result.stats.size} bytes`);
        
        if (result.warnings.length > 0) {
            console.error("\n⚠️  Warnings:");
            result.warnings.forEach(w => console.error(`   - ${w}`));
        }
        
        if (!result.valid) {
            console.error("\n❌ Validation Errors:");
            result.errors.forEach(e => console.error(`   - ${e}`));
            console.error("\n❌ Wrap aborted due to validation errors\n");
            process.exit(1);
        }
        
        console.error("\n✅ Validation passed");
    }

    const wrapped = wrapWithMxFile(xml, pageName);

    if (outputFile) {
        fs.writeFileSync(outputFile, wrapped);
        console.error(`✅ Wrapped XML written to: ${outputFile}\n`);
    } else {
        console.log(wrapped);
    }
}

main().catch(err => { console.error("Error:", err.message); process.exit(2); });
