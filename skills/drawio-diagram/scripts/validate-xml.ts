#!/usr/bin/env npx ts-node
/**
 * Draw.io XML Validator
 * 
 * Validates mxCell XML structure for common issues.
 * Can be used standalone or integrated into build pipelines.
 * 
 * Usage:
 *   npx ts-node validate-xml.ts <file.xml>
 *   cat diagram.xml | npx ts-node validate-xml.ts
 *   echo '<mxCell id="2" .../>' | npx ts-node validate-xml.ts
 * 
 * Exit codes:
 *   0 - Valid XML
 *   1 - Invalid XML (with error message)
 *   2 - Usage error
 */

// ============================================================================
// Constants
// ============================================================================

const MAX_XML_SIZE = 1_000_000 // 1MB

const STRUCTURAL_ATTRS = [
    "edge",
    "parent", 
    "source",
    "target",
    "vertex",
    "connectable",
]

const VALID_ENTITIES = new Set(["lt", "gt", "amp", "quot", "apos"])

// ============================================================================
// Validation Helper Functions
// ============================================================================

interface ParsedTag {
    tag: string
    tagName: string
    isClosing: boolean
    isSelfClosing: boolean
}

function parseXmlTags(xml: string): ParsedTag[] {
    const tags: ParsedTag[] = []
    let i = 0

    while (i < xml.length) {
        const tagStart = xml.indexOf("<", i)
        if (tagStart === -1) break

        let tagEnd = tagStart + 1
        let inQuote = false
        let quoteChar = ""

        while (tagEnd < xml.length) {
            const c = xml[tagEnd]
            if (inQuote) {
                if (c === quoteChar) inQuote = false
            } else {
                if (c === '"' || c === "'") {
                    inQuote = true
                    quoteChar = c
                } else if (c === ">") {
                    break
                }
            }
            tagEnd++
        }

        if (tagEnd >= xml.length) break

        const tag = xml.substring(tagStart, tagEnd + 1)
        i = tagEnd + 1

        const tagMatch = /^<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)/.exec(tag)
        if (!tagMatch) continue

        tags.push({
            tag,
            tagName: tagMatch[2],
            isClosing: tagMatch[1] === "/",
            isSelfClosing: tag.endsWith("/>"),
        })
    }

    return tags
}

function checkDuplicateAttributes(xml: string): string | null {
    const structuralSet = new Set(STRUCTURAL_ATTRS)
    const tagPattern = /<[^>]+>/g
    let tagMatch
    while ((tagMatch = tagPattern.exec(xml)) !== null) {
        const tag = tagMatch[0]
        const attrPattern = /\s([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*=/g
        const attributes = new Map<string, number>()
        let attrMatch
        while ((attrMatch = attrPattern.exec(tag)) !== null) {
            const attrName = attrMatch[1]
            attributes.set(attrName, (attributes.get(attrName) || 0) + 1)
        }
        const duplicates = Array.from(attributes.entries())
            .filter(([name, count]) => count > 1 && structuralSet.has(name))
            .map(([name]) => name)
        if (duplicates.length > 0) {
            return `Duplicate structural attribute(s): ${duplicates.join(", ")}`
        }
    }
    return null
}

function checkDuplicateIds(xml: string): string | null {
    const idPattern = /\bid\s*=\s*["']([^"']+)["']/gi
    const ids = new Map<string, number>()
    let idMatch
    while ((idMatch = idPattern.exec(xml)) !== null) {
        const id = idMatch[1]
        ids.set(id, (ids.get(id) || 0) + 1)
    }
    const duplicateIds = Array.from(ids.entries())
        .filter(([, count]) => count > 1)
        .map(([id, count]) => `'${id}' (${count}x)`)
    if (duplicateIds.length > 0) {
        return `Duplicate ID(s): ${duplicateIds.slice(0, 3).join(", ")}`
    }
    return null
}

function checkTagMismatches(xml: string): string | null {
    const xmlWithoutComments = xml.replace(/<!--[\s\S]*?-->/g, "")
    const tags = parseXmlTags(xmlWithoutComments)
    const tagStack: string[] = []

    for (const { tagName, isClosing, isSelfClosing } of tags) {
        if (isClosing) {
            if (tagStack.length === 0) {
                return `Closing tag </${tagName}> without matching opening tag`
            }
            const expected = tagStack.pop()
            if (expected?.toLowerCase() !== tagName.toLowerCase()) {
                return `Expected closing tag </${expected}> but found </${tagName}>`
            }
        } else if (!isSelfClosing) {
            tagStack.push(tagName)
        }
    }
    if (tagStack.length > 0) {
        return `${tagStack.length} unclosed tag(s): ${tagStack.join(", ")}`
    }
    return null
}

function checkCharacterReferences(xml: string): string | null {
    const charRefPattern = /&#x?[^;]+;?/g
    let charMatch
    while ((charMatch = charRefPattern.exec(xml)) !== null) {
        const ref = charMatch[0]
        if (ref.startsWith("&#x")) {
            if (!ref.endsWith(";")) {
                return `Missing semicolon after hex reference: ${ref}`
            }
            const hexDigits = ref.substring(3, ref.length - 1)
            if (hexDigits.length === 0 || !/^[0-9a-fA-F]+$/.test(hexDigits)) {
                return `Invalid hex character reference: ${ref}`
            }
        } else if (ref.startsWith("&#")) {
            if (!ref.endsWith(";")) {
                return `Missing semicolon after decimal reference: ${ref}`
            }
            const decDigits = ref.substring(2, ref.length - 1)
            if (decDigits.length === 0 || !/^[0-9]+$/.test(decDigits)) {
                return `Invalid decimal character reference: ${ref}`
            }
        }
    }
    return null
}

function checkEntityReferences(xml: string): string | null {
    const xmlWithoutComments = xml.replace(/<!--[\s\S]*?-->/g, "")
    const bareAmpPattern = /&(?!(?:lt|gt|amp|quot|apos|#))/g
    if (bareAmpPattern.test(xmlWithoutComments)) {
        return "Unescaped & character(s). Replace & with &amp;"
    }
    const invalidEntityPattern = /&([a-zA-Z][a-zA-Z0-9]*);/g
    let entityMatch
    while ((entityMatch = invalidEntityPattern.exec(xmlWithoutComments)) !== null) {
        if (!VALID_ENTITIES.has(entityMatch[1])) {
            return `Invalid entity: &${entityMatch[1]}; (use lt, gt, amp, quot, apos)`
        }
    }
    return null
}

function checkNestedMxCells(xml: string): string | null {
    const cellTagPattern = /<\/?mxCell[^>]*>/g
    const cellStack: number[] = []
    let cellMatch
    while ((cellMatch = cellTagPattern.exec(xml)) !== null) {
        const tag = cellMatch[0]
        if (tag.startsWith("</mxCell>")) {
            if (cellStack.length > 0) cellStack.pop()
        } else if (!tag.endsWith("/>")) {
            const isLabelOrGeometry = /\sas\s*=\s*["'](valueLabel|geometry)["']/.test(tag)
            if (!isLabelOrGeometry) {
                cellStack.push(cellMatch.index)
                if (cellStack.length > 1) {
                    return "Nested mxCell tags found. Cells should be siblings."
                }
            }
        }
    }
    return null
}

// ============================================================================
// Main Validation Function
// ============================================================================

interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    stats: {
        size: number
        cellCount: number
        edgeCount: number
    }
}

function validateMxCellXml(xml: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Stats
    const cellCount = (xml.match(/<mxCell/g) || []).length
    const edgeCount = (xml.match(/edge="1"/g) || []).length

    // Size check
    if (xml.length > MAX_XML_SIZE) {
        warnings.push(`XML size (${xml.length} bytes) exceeds 1MB, may cause performance issues`)
    }

    // Check for CDATA wrapper
    if (/^\s*<!\[CDATA\[/.test(xml)) {
        errors.push("XML wrapped in CDATA section - remove <![CDATA[ and ]]>")
    }

    // Check for wrapper tags (should be bare mxCell only)
    if (/<mxfile|<mxGraphModel|<diagram/.test(xml)) {
        warnings.push("Contains wrapper tags (<mxfile>, <mxGraphModel>, <diagram>) - generate bare mxCell elements only")
    }

    // Check for root cells (should not be included)
    if (/<mxCell[^>]*\bid=["']0["']/.test(xml) || /<mxCell[^>]*\bid=["']1["']/.test(xml)) {
        warnings.push("Contains root cells (id=\"0\" or id=\"1\") - these are added automatically")
    }

    // Duplicate attributes
    const dupAttrError = checkDuplicateAttributes(xml)
    if (dupAttrError) errors.push(dupAttrError)

    // Unescaped < in attribute values
    const attrValuePattern = /=\s*"([^"]*)"/g
    let attrValMatch
    while ((attrValMatch = attrValuePattern.exec(xml)) !== null) {
        const value = attrValMatch[1]
        if (/</.test(value) && !/&lt;/.test(value)) {
            errors.push("Unescaped < in attribute values. Use &lt;")
            break
        }
    }

    // Duplicate IDs
    const dupIdError = checkDuplicateIds(xml)
    if (dupIdError) errors.push(dupIdError)

    // Tag mismatches
    const tagMismatchError = checkTagMismatches(xml)
    if (tagMismatchError) errors.push(tagMismatchError)

    // Character references
    const charRefError = checkCharacterReferences(xml)
    if (charRefError) errors.push(charRefError)

    // Entity references
    const entityError = checkEntityReferences(xml)
    if (entityError) errors.push(entityError)

    // Empty IDs
    if (/<mxCell[^>]*\sid\s*=\s*["']\s*["'][^>]*>/g.test(xml)) {
        errors.push("mxCell with empty id attribute")
    }

    // Nested mxCell
    const nestedCellError = checkNestedMxCells(xml)
    if (nestedCellError) errors.push(nestedCellError)

    // XML comments (draw.io strips them, breaks edit_diagram)
    if (/<!--/.test(xml)) {
        warnings.push("Contains XML comments - draw.io strips these, may break edit_diagram")
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
            size: xml.length,
            cellCount,
            edgeCount,
        },
    }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
    const args = process.argv.slice(2)
    let xml = ""

    if (args.length === 0) {
        // Read from stdin
        const chunks: Buffer[] = []
        for await (const chunk of process.stdin) {
            chunks.push(chunk)
        }
        xml = Buffer.concat(chunks).toString("utf-8")
    } else if (args[0] === "-h" || args[0] === "--help") {
        console.log(`
Draw.io XML Validator

Usage:
  npx ts-node validate-xml.ts <file.xml>
  cat diagram.xml | npx ts-node validate-xml.ts
  
Options:
  -h, --help     Show this help message
  -q, --quiet    Only output errors (exit code indicates result)
  -j, --json     Output result as JSON

Exit codes:
  0 - Valid XML
  1 - Invalid XML
  2 - Usage error
`)
        process.exit(0)
    } else {
        // Read from file
        const fs = await import("fs")
        const path = await import("path")
        const filePath = path.resolve(args[0])
        
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found: ${filePath}`)
            process.exit(2)
        }
        xml = fs.readFileSync(filePath, "utf-8")
    }

    if (!xml.trim()) {
        console.error("Error: Empty input")
        process.exit(2)
    }

    const result = validateMxCellXml(xml)
    const quiet = args.includes("-q") || args.includes("--quiet")
    const json = args.includes("-j") || args.includes("--json")

    if (json) {
        console.log(JSON.stringify(result, null, 2))
    } else if (!quiet) {
        console.log(`\n📊 Stats: ${result.stats.cellCount} cells, ${result.stats.edgeCount} edges, ${result.stats.size} bytes\n`)
        
        if (result.warnings.length > 0) {
            console.log("⚠️  Warnings:")
            result.warnings.forEach(w => console.log(`   - ${w}`))
            console.log()
        }

        if (result.errors.length > 0) {
            console.log("❌ Errors:")
            result.errors.forEach(e => console.log(`   - ${e}`))
            console.log()
        }

        if (result.valid) {
            console.log("✅ XML is valid!\n")
        } else {
            console.log("❌ XML validation failed\n")
        }
    }

    process.exit(result.valid ? 0 : 1)
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
