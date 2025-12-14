#!/usr/bin/env npx tsx
/**
 * Draw.io XML Auto-Fixer
 * 
 * Automatically fixes common XML issues in draw.io diagrams.
 * 
 * Usage:
 *   npx tsx fix-xml.ts <file.xml>
 *   cat diagram.xml | npx tsx fix-xml.ts > fixed.xml
 * 
 * Options:
 *   -o, --output <file>  Write output to file instead of stdout
 *   -v, --verbose        Show all fixes applied
 *   -j, --json           Output result as JSON
 */

// ============================================================================
// Constants
// ============================================================================

const MAX_XML_SIZE = 1_000_000
const MAX_DROP_ITERATIONS = 10

const STRUCTURAL_ATTRS = [
    "edge",
    "parent", 
    "source",
    "target",
    "vertex",
    "connectable",
]

// ============================================================================
// XML Tag Parser
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

// ============================================================================
// Auto-Fix Function (from lib/utils.ts)
// ============================================================================

function autoFixXml(xml: string): { fixed: string; fixes: string[] } {
    let fixed = xml
    const fixes: string[] = []

    // 0. Fix JSON-escaped XML
    if (/=\\"/.test(fixed)) {
        fixed = fixed.replace(/\\"/g, '"')
        fixed = fixed.replace(/\\n/g, "\n")
        fixes.push("Fixed JSON-escaped XML")
    }

    // 1. Remove CDATA wrapper
    if (/^\s*<!\[CDATA\[/.test(fixed)) {
        fixed = fixed.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "")
        fixes.push("Removed CDATA wrapper")
    }

    // 2. Remove text before XML declaration
    const xmlStart = fixed.search(/<(\?xml|mxGraphModel|mxfile)/i)
    if (xmlStart > 0 && !/^<[a-zA-Z]/.test(fixed.trim())) {
        fixed = fixed.substring(xmlStart)
        fixes.push("Removed text before XML root")
    }

    // 3. Fix duplicate attributes
    let dupAttrFixed = false
    fixed = fixed.replace(/<[^>]+>/g, (tag) => {
        let newTag = tag
        for (const attr of STRUCTURAL_ATTRS) {
            const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, "gi")
            const matches = tag.match(attrRegex)
            if (matches && matches.length > 1) {
                let firstKept = false
                newTag = newTag.replace(attrRegex, (m) => {
                    if (!firstKept) {
                        firstKept = true
                        return m
                    }
                    dupAttrFixed = true
                    return ""
                })
            }
        }
        return newTag
    })
    if (dupAttrFixed) {
        fixes.push("Removed duplicate structural attributes")
    }

    // 4. Fix unescaped & characters
    const ampersandPattern = /&(?!(?:lt|gt|amp|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);)/g
    if (ampersandPattern.test(fixed)) {
        fixed = fixed.replace(
            /&(?!(?:lt|gt|amp|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);)/g,
            "&amp;"
        )
        fixes.push("Escaped unescaped & characters")
    }

    // 5. Fix double-escaped entities
    const invalidEntities = [
        { pattern: /&ampquot;/g, replacement: "&quot;", name: "&ampquot;" },
        { pattern: /&amplt;/g, replacement: "&lt;", name: "&amplt;" },
        { pattern: /&ampgt;/g, replacement: "&gt;", name: "&ampgt;" },
        { pattern: /&ampapos;/g, replacement: "&apos;", name: "&ampapos;" },
        { pattern: /&ampamp;/g, replacement: "&amp;", name: "&ampamp;" },
    ]
    for (const { pattern, replacement, name } of invalidEntities) {
        if (pattern.test(fixed)) {
            fixed = fixed.replace(pattern, replacement)
            fixes.push(`Fixed double-escaped entity ${name}`)
        }
    }

    // 6. Fix malformed attribute quotes
    const malformedQuotePattern = /(\s[a-zA-Z][a-zA-Z0-9_:-]*)=&quot;/
    if (malformedQuotePattern.test(fixed)) {
        fixed = fixed.replace(
            /(\s[a-zA-Z][a-zA-Z0-9_:-]*)=&quot;([^&]*?)&quot;/g,
            '$1="$2"'
        )
        fixes.push('Fixed malformed attribute quotes')
    }

    // 7. Fix malformed closing tags
    if (/<\/([a-zA-Z][a-zA-Z0-9]*)\s*\/>/.test(fixed)) {
        fixed = fixed.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*\/>/g, "</$1>")
        fixes.push("Fixed malformed closing tags")
    }

    // 8. Fix missing space between attributes
    const missingSpacePattern = /("[^"]*")([a-zA-Z][a-zA-Z0-9_:-]*=)/g
    if (missingSpacePattern.test(fixed)) {
        fixed = fixed.replace(/("[^"]*")([a-zA-Z][a-zA-Z0-9_:-]*=)/g, "$1 $2")
        fixes.push("Added missing space between attributes")
    }

    // 9. Fix quotes around color values in style
    const quotedColorPattern = /;([a-zA-Z]*[Cc]olor)="#/
    if (quotedColorPattern.test(fixed)) {
        fixed = fixed.replace(/;([a-zA-Z]*[Cc]olor)="#/g, ";$1=#")
        fixes.push("Removed quotes around color values in style")
    }

    // 10. Fix unescaped < in attribute values
    const attrPattern = /(=\s*")([^"]*?)(<)([^"]*?)(")/g
    let hasUnescapedLt = false
    let attrMatch
    while ((attrMatch = attrPattern.exec(fixed)) !== null) {
        if (!attrMatch[3].startsWith("&lt;")) {
            hasUnescapedLt = true
            break
        }
    }
    if (hasUnescapedLt) {
        fixed = fixed.replace(/=\s*"([^"]*)"/g, (_match, value) => {
            const escaped = value.replace(/</g, "&lt;")
            return `="${escaped}"`
        })
        fixes.push("Escaped < characters in attribute values")
    }

    // 11. Fix <Cell> tags to <mxCell>
    if (/<\/?Cell[\s>]/i.test(fixed)) {
        fixed = fixed.replace(/<Cell(\s)/gi, "<mxCell$1")
        fixed = fixed.replace(/<Cell>/gi, "<mxCell>")
        fixed = fixed.replace(/<\/Cell>/gi, "</mxCell>")
        fixes.push("Fixed <Cell> tags to <mxCell>")
    }

    // 12. Fix common tag typos
    const tagTypos = [
        { wrong: /<\/mxElement>/gi, right: "</mxCell>" },
        { wrong: /<\/mxcell>/g, right: "</mxCell>" },
        { wrong: /<\/mxgeometry>/g, right: "</mxGeometry>" },
        { wrong: /<\/mxpoint>/g, right: "</mxPoint>" },
        { wrong: /<\/mxgraphmodel>/gi, right: "</mxGraphModel>" },
    ]
    for (const { wrong, right } of tagTypos) {
        if (wrong.test(fixed)) {
            fixed = fixed.replace(wrong, right)
            fixes.push(`Fixed typo to ${right}`)
        }
    }

    // 13. Fix unclosed tags
    const tagStack: string[] = []
    const parsedTags = parseXmlTags(fixed)
    for (const { tagName, isClosing, isSelfClosing } of parsedTags) {
        if (isClosing) {
            const lastIdx = tagStack.lastIndexOf(tagName)
            if (lastIdx !== -1) {
                tagStack.splice(lastIdx, 1)
            }
        } else if (!isSelfClosing) {
            tagStack.push(tagName)
        }
    }
    if (tagStack.length > 0) {
        const tagsToClose: string[] = []
        for (const tagName of tagStack.reverse()) {
            const openCount = (fixed.match(new RegExp(`<${tagName}[\\s>]`, "gi")) || []).length
            const closeCount = (fixed.match(new RegExp(`</${tagName}>`, "gi")) || []).length
            if (openCount > closeCount) {
                tagsToClose.push(tagName)
            }
        }
        if (tagsToClose.length > 0) {
            const closingTags = tagsToClose.map((t) => `</${t}>`).join("\n")
            fixed = fixed.trimEnd() + "\n" + closingTags
            fixes.push(`Closed ${tagsToClose.length} unclosed tag(s): ${tagsToClose.join(", ")}`)
        }
    }

    // 14. Fix duplicate IDs
    const seenIds = new Map<string, number>()
    const duplicateIds: string[] = []
    const idPattern = /\bid\s*=\s*["']([^"']+)["']/gi
    let idMatch
    while ((idMatch = idPattern.exec(fixed)) !== null) {
        const id = idMatch[1]
        seenIds.set(id, (seenIds.get(id) || 0) + 1)
    }
    for (const [id, count] of seenIds) {
        if (count > 1) duplicateIds.push(id)
    }
    if (duplicateIds.length > 0) {
        const idCounters = new Map<string, number>()
        fixed = fixed.replace(/\bid\s*=\s*["']([^"']+)["']/gi, (match, id) => {
            if (!duplicateIds.includes(id)) return match
            const count = idCounters.get(id) || 0
            idCounters.set(id, count + 1)
            if (count === 0) return match
            const newId = `${id}_dup${count}`
            return match.replace(id, newId)
        })
        fixes.push(`Renamed ${duplicateIds.length} duplicate ID(s)`)
    }

    // 15. Fix empty id attributes
    let emptyIdCount = 0
    fixed = fixed.replace(
        /<mxCell([^>]*)\sid\s*=\s*["']\s*["']([^>]*)>/g,
        (_match, before, after) => {
            emptyIdCount++
            const newId = `cell_${Date.now()}_${emptyIdCount}`
            return `<mxCell${before} id="${newId}"${after}>`
        }
    )
    if (emptyIdCount > 0) {
        fixes.push(`Generated ${emptyIdCount} missing ID(s)`)
    }

    return { fixed, fixes }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
    const args = process.argv.slice(2)
    let xml = ""
    let outputFile = ""
    let verbose = false
    let jsonOutput = false

    // Parse args
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-o" || args[i] === "--output") {
            outputFile = args[++i]
        } else if (args[i] === "-v" || args[i] === "--verbose") {
            verbose = true
        } else if (args[i] === "-j" || args[i] === "--json") {
            jsonOutput = true
        } else if (args[i] === "-h" || args[i] === "--help") {
            console.log(`
Draw.io XML Auto-Fixer

Usage:
  npx tsx fix-xml.ts <file.xml>
  cat diagram.xml | npx tsx fix-xml.ts > fixed.xml

Options:
  -o, --output <file>  Write output to file instead of stdout
  -v, --verbose        Show all fixes applied
  -j, --json           Output result as JSON
  -h, --help           Show this help message
`)
            process.exit(0)
        } else if (!args[i].startsWith("-")) {
            const fs = await import("fs")
            const path = await import("path")
            const filePath = path.resolve(args[i])
            if (!fs.existsSync(filePath)) {
                console.error(`Error: File not found: ${filePath}`)
                process.exit(2)
            }
            xml = fs.readFileSync(filePath, "utf-8")
        }
    }

    // Read from stdin if no file provided
    if (!xml) {
        const chunks: Buffer[] = []
        for await (const chunk of process.stdin) {
            chunks.push(chunk)
        }
        xml = Buffer.concat(chunks).toString("utf-8")
    }

    if (!xml.trim()) {
        console.error("Error: Empty input")
        process.exit(2)
    }

    const { fixed, fixes } = autoFixXml(xml)

    if (jsonOutput) {
        console.log(JSON.stringify({ original: xml, fixed, fixes, changesApplied: fixes.length }, null, 2))
    } else {
        if (verbose && fixes.length > 0) {
            console.error(`Applied ${fixes.length} fix(es):`)
            fixes.forEach(f => console.error(`  - ${f}`))
            console.error()
        }

        if (outputFile) {
            const fs = await import("fs")
            fs.writeFileSync(outputFile, fixed)
            console.error(`Fixed XML written to: ${outputFile}`)
        } else {
            console.log(fixed)
        }
    }
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
