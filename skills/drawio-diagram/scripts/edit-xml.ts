#!/usr/bin/env npx tsx
/**
 * Draw.io Diagram Editor (edit_diagram equivalent)
 * 
 * Edit specific parts of a diagram XML using search/replace patterns.
 * Supports multiple matching strategies for robustness.
 * 
 * Usage:
 *   npx tsx edit-xml.ts <file.xml> --search "pattern" --replace "replacement"
 *   npx tsx edit-xml.ts <file.xml> --edits '[{"search":"...", "replace":"..."}]'
 *   cat diagram.xml | npx tsx edit-xml.ts --search "pattern" --replace "replacement"
 * 
 * Options:
 *   -s, --search <pattern>    Search pattern (exact match)
 *   -r, --replace <text>      Replacement text
 *   -e, --edits <json>        JSON array of {search, replace} pairs
 *   -o, --output <file>       Write output to file
 *   -v, --verbose             Show match details
 */

// ============================================================================
// Format XML (from lib/utils.ts)
// ============================================================================

function formatXML(xml: string, indent: string = "  "): string {
    let formatted = ""
    let pad = 0
    xml = xml.replace(/>\s*</g, "><").trim()
    const tags = xml.split(/(?=<)|(?<=>)/g).filter(Boolean)

    tags.forEach((node, index) => {
        if (node.match(/^<\/\w/)) {
            pad = Math.max(0, pad - 1)
            formatted += indent.repeat(pad) + node + "\n"
        } else if (node.match(/^<\w[^>]*[^/]>.*$/)) {
            formatted += indent.repeat(pad) + node
            const nextIndex = index + 1
            if (nextIndex < tags.length && tags[nextIndex].startsWith("<")) {
                formatted += "\n"
                if (!node.match(/^<\w[^>]*\/>$/)) {
                    pad++
                }
            }
        } else if (node.match(/^<\w[^>]*\/>$/)) {
            formatted += indent.repeat(pad) + node + "\n"
        } else if (node.startsWith("<")) {
            formatted += indent.repeat(pad) + node + "\n"
        } else {
            formatted += node
        }
    })

    return formatted.trim()
}

// ============================================================================
// Character Frequency Match (attribute-order agnostic)
// ============================================================================

function sameCharFrequency(a: string, b: string): boolean {
    const freqA = new Map<string, number>()
    const freqB = new Map<string, number>()
    
    for (const c of a.replace(/\s/g, "")) {
        freqA.set(c, (freqA.get(c) || 0) + 1)
    }
    for (const c of b.replace(/\s/g, "")) {
        freqB.set(c, (freqB.get(c) || 0) + 1)
    }
    
    if (freqA.size !== freqB.size) return false
    for (const [char, count] of freqA) {
        if (freqB.get(char) !== count) return false
    }
    return true
}

// ============================================================================
// Replace XML Parts (from lib/utils.ts - replaceXMLParts)
// ============================================================================

interface EditResult {
    success: boolean
    strategy: string
    error?: string
}

function replaceXMLParts(
    xmlContent: string,
    searchReplacePairs: Array<{ search: string; replace: string }>,
    verbose: boolean = false
): { result: string; edits: EditResult[] } {
    let result = formatXML(xmlContent)
    const editResults: EditResult[] = []

    for (const { search, replace } of searchReplacePairs) {
        const formattedSearch = formatXML(search)
        const searchLines = formattedSearch.split("\n")
        let resultLines = result.split("\n")

        if (searchLines[searchLines.length - 1] === "") {
            searchLines.pop()
        }

        let matchFound = false
        let matchStartLine = -1
        let matchEndLine = -1
        let strategy = ""

        // Strategy 1: Exact match
        for (let i = 0; i <= resultLines.length - searchLines.length; i++) {
            let matches = true
            for (let j = 0; j < searchLines.length; j++) {
                if (resultLines[i + j] !== searchLines[j]) {
                    matches = false
                    break
                }
            }
            if (matches) {
                matchStartLine = i
                matchEndLine = i + searchLines.length
                matchFound = true
                strategy = "exact"
                break
            }
        }

        // Strategy 2: Trimmed match
        if (!matchFound) {
            for (let i = 0; i <= resultLines.length - searchLines.length; i++) {
                let matches = true
                for (let j = 0; j < searchLines.length; j++) {
                    if (resultLines[i + j].trim() !== searchLines[j].trim()) {
                        matches = false
                        break
                    }
                }
                if (matches) {
                    matchStartLine = i
                    matchEndLine = i + searchLines.length
                    matchFound = true
                    strategy = "trimmed"
                    break
                }
            }
        }

        // Strategy 3: Substring match
        if (!matchFound) {
            const searchStr = search.trim()
            const index = result.indexOf(searchStr)
            if (index !== -1) {
                result = result.substring(0, index) + replace.trim() + result.substring(index + searchStr.length)
                result = formatXML(result)
                editResults.push({ success: true, strategy: "substring" })
                continue
            }
        }

        // Strategy 4: Character frequency match (attribute-order agnostic)
        if (!matchFound) {
            for (let i = 0; i <= resultLines.length - searchLines.length; i++) {
                let matches = true
                for (let j = 0; j < searchLines.length; j++) {
                    if (!sameCharFrequency(resultLines[i + j], searchLines[j])) {
                        matches = false
                        break
                    }
                }
                if (matches) {
                    matchStartLine = i
                    matchEndLine = i + searchLines.length
                    matchFound = true
                    strategy = "char-frequency"
                    break
                }
            }
        }

        // Strategy 5: Match by mxCell id
        if (!matchFound) {
            const idMatch = search.match(/id="([^"]+)"/)
            if (idMatch) {
                const searchId = idMatch[1]
                for (let i = 0; i < resultLines.length; i++) {
                    if (resultLines[i].includes(`id="${searchId}"`)) {
                        let endLine = i + 1
                        const line = resultLines[i].trim()
                        if (!line.endsWith("/>")) {
                            let depth = 1
                            while (endLine < resultLines.length && depth > 0) {
                                const currentLine = resultLines[endLine].trim()
                                if (currentLine.startsWith("<") && !currentLine.startsWith("</") && !currentLine.endsWith("/>")) {
                                    depth++
                                } else if (currentLine.startsWith("</")) {
                                    depth--
                                }
                                endLine++
                            }
                        }
                        matchStartLine = i
                        matchEndLine = endLine
                        matchFound = true
                        strategy = "id-match"
                        break
                    }
                }
            }
        }

        // Strategy 6: Match by value attribute
        if (!matchFound) {
            const valueMatch = search.match(/value="([^"]*)"/)
            if (valueMatch) {
                const searchValue = valueMatch[0]
                for (let i = 0; i < resultLines.length; i++) {
                    if (resultLines[i].includes(searchValue)) {
                        let endLine = i + 1
                        const line = resultLines[i].trim()
                        if (!line.endsWith("/>")) {
                            let depth = 1
                            while (endLine < resultLines.length && depth > 0) {
                                const currentLine = resultLines[endLine].trim()
                                if (currentLine.startsWith("<") && !currentLine.startsWith("</") && !currentLine.endsWith("/>")) {
                                    depth++
                                } else if (currentLine.startsWith("</")) {
                                    depth--
                                }
                                endLine++
                            }
                        }
                        matchStartLine = i
                        matchEndLine = endLine
                        matchFound = true
                        strategy = "value-match"
                        break
                    }
                }
            }
        }

        if (!matchFound) {
            editResults.push({ 
                success: false, 
                strategy: "none",
                error: "Pattern not found in document"
            })
            continue
        }

        // Apply replacement
        const replaceLines = replace.split("\n")
        if (replaceLines[replaceLines.length - 1] === "") {
            replaceLines.pop()
        }

        const newResultLines = [
            ...resultLines.slice(0, matchStartLine),
            ...replaceLines,
            ...resultLines.slice(matchEndLine),
        ]

        result = newResultLines.join("\n")
        editResults.push({ success: true, strategy })
    }

    return { result, edits: editResults }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
    const args = process.argv.slice(2)
    let xml = ""
    let outputFile = ""
    let verbose = false
    let edits: Array<{ search: string; replace: string }> = []
    let currentSearch = ""

    // Parse args
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-o" || args[i] === "--output") {
            outputFile = args[++i]
        } else if (args[i] === "-v" || args[i] === "--verbose") {
            verbose = true
        } else if (args[i] === "-s" || args[i] === "--search") {
            currentSearch = args[++i]
        } else if (args[i] === "-r" || args[i] === "--replace") {
            if (currentSearch) {
                edits.push({ search: currentSearch, replace: args[++i] })
                currentSearch = ""
            }
        } else if (args[i] === "-e" || args[i] === "--edits") {
            try {
                edits = JSON.parse(args[++i])
            } catch (e) {
                console.error("Error: Invalid JSON for --edits")
                process.exit(2)
            }
        } else if (args[i] === "-h" || args[i] === "--help") {
            console.log(`
Draw.io Diagram Editor

Edit specific parts of diagram XML using search/replace patterns.
Supports multiple matching strategies for robustness.

Usage:
  npx tsx edit-xml.ts <file.xml> -s "pattern" -r "replacement"
  npx tsx edit-xml.ts <file.xml> --edits '[{"search":"...", "replace":"..."}]'
  cat diagram.xml | npx tsx edit-xml.ts -s "pattern" -r "replacement"

Options:
  -s, --search <pattern>    Search pattern
  -r, --replace <text>      Replacement text
  -e, --edits <json>        JSON array of {search, replace} pairs
  -o, --output <file>       Write output to file
  -v, --verbose             Show match details
  -h, --help                Show this help

Matching Strategies (tried in order):
  1. Exact match
  2. Trimmed match (ignoring whitespace)
  3. Substring match
  4. Character frequency match (attribute-order agnostic)
  5. Match by mxCell id attribute
  6. Match by value attribute
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

    if (edits.length === 0) {
        console.error("Error: No edits specified. Use -s/-r or --edits")
        process.exit(2)
    }

    const { result, edits: editResults } = replaceXMLParts(xml, edits, verbose)

    if (verbose) {
        console.error(`\nApplied ${edits.length} edit(s):`)
        editResults.forEach((e, i) => {
            if (e.success) {
                console.error(`  ${i + 1}. ✅ Success (strategy: ${e.strategy})`)
            } else {
                console.error(`  ${i + 1}. ❌ Failed: ${e.error}`)
            }
        })
        console.error()
    }

    const allSuccess = editResults.every(e => e.success)

    if (outputFile) {
        const fs = await import("fs")
        fs.writeFileSync(outputFile, result)
        console.error(`Edited XML written to: ${outputFile}`)
    } else {
        console.log(result)
    }

    process.exit(allSuccess ? 0 : 1)
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
