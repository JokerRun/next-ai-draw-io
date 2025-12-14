#!/usr/bin/env npx tsx
/**
 * Draw.io Diagram Appender (append_diagram equivalent)
 * 
 * Append/merge mxCell elements to an existing diagram.
 * Used to continue truncated output or add new elements.
 * 
 * Usage:
 *   npx tsx append-xml.ts base.xml fragment.xml -o merged.xml
 *   cat fragment.xml | npx tsx append-xml.ts base.xml -o merged.xml
 *   npx tsx append-xml.ts base.xml --append "<mxCell.../>"
 * 
 * Options:
 *   -a, --append <xml>       XML fragment to append (inline)
 *   -o, --output <file>      Write output to file
 *   --before-close           Insert before </root> instead of at end
 */

// ============================================================================
// Append XML Fragment
// ============================================================================

function appendXmlFragment(base: string, fragment: string, beforeClose: boolean = true): string {
    const trimmedFragment = fragment.trim()
    
    if (!trimmedFragment) {
        return base
    }

    // If base is empty or just whitespace, return fragment wrapped
    if (!base.trim()) {
        return trimmedFragment
    }

    // Check if base has </root> closing tag
    const rootCloseIndex = base.lastIndexOf("</root>")
    
    if (beforeClose && rootCloseIndex !== -1) {
        // Insert fragment before </root>
        const before = base.substring(0, rootCloseIndex)
        const after = base.substring(rootCloseIndex)
        
        // Ensure proper newline separation
        const needsNewline = !before.endsWith("\n")
        return before + (needsNewline ? "\n" : "") + trimmedFragment + "\n" + after
    }

    // Check if base has </mxGraphModel> closing tag
    const modelCloseIndex = base.lastIndexOf("</mxGraphModel>")
    if (beforeClose && modelCloseIndex !== -1) {
        // Find </root> before </mxGraphModel>
        const rootClose = base.lastIndexOf("</root>", modelCloseIndex)
        if (rootClose !== -1) {
            const before = base.substring(0, rootClose)
            const after = base.substring(rootClose)
            const needsNewline = !before.endsWith("\n")
            return before + (needsNewline ? "\n" : "") + trimmedFragment + "\n" + after
        }
    }

    // No structure found, just append
    return base + "\n" + trimmedFragment
}

// ============================================================================
// Merge mxCell Elements
// ============================================================================

function mergeXmlCells(base: string, additions: string): string {
    // Extract all mxCell elements from additions
    const cellPattern = /<mxCell\b[^>]*(?:\/>|>[\s\S]*?<\/mxCell>)/g
    const newCells = additions.match(cellPattern) || []
    
    if (newCells.length === 0) {
        // No mxCell elements found, try appending raw content
        return appendXmlFragment(base, additions)
    }

    // Extract existing cell IDs from base
    const existingIds = new Set<string>()
    const idPattern = /<mxCell[^>]*\bid="([^"]+)"/g
    let match
    while ((match = idPattern.exec(base)) !== null) {
        existingIds.add(match[1])
    }

    // Filter out cells with duplicate IDs and generate new IDs if needed
    let maxId = 1
    for (const id of existingIds) {
        const numId = parseInt(id, 10)
        if (!isNaN(numId) && numId > maxId) {
            maxId = numId
        }
    }

    const cellsToAdd: string[] = []
    for (const cell of newCells) {
        const cellIdMatch = cell.match(/\bid="([^"]+)"/)
        if (cellIdMatch) {
            const cellId = cellIdMatch[1]
            if (existingIds.has(cellId)) {
                // Duplicate ID - generate new one
                maxId++
                const newCell = cell.replace(/\bid="[^"]+"/, `id="${maxId}"`)
                cellsToAdd.push(newCell)
            } else {
                cellsToAdd.push(cell)
                existingIds.add(cellId)
            }
        } else {
            // No ID found, add as-is
            cellsToAdd.push(cell)
        }
    }

    // Append all cells
    return appendXmlFragment(base, cellsToAdd.join("\n"))
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
    const args = process.argv.slice(2)
    let baseXml = ""
    let fragmentXml = ""
    let outputFile = ""
    let beforeClose = true
    let merge = false

    // Parse args
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-o" || args[i] === "--output") {
            outputFile = args[++i]
        } else if (args[i] === "-a" || args[i] === "--append") {
            fragmentXml = args[++i]
        } else if (args[i] === "--at-end") {
            beforeClose = false
        } else if (args[i] === "--merge") {
            merge = true
        } else if (args[i] === "-h" || args[i] === "--help") {
            console.log(`
Draw.io Diagram Appender

Append/merge mxCell elements to an existing diagram.
Used to continue truncated output or add new elements.

Usage:
  npx tsx append-xml.ts base.xml fragment.xml -o merged.xml
  cat fragment.xml | npx tsx append-xml.ts base.xml -o merged.xml
  npx tsx append-xml.ts base.xml --append "<mxCell.../>"

Options:
  -a, --append <xml>       XML fragment to append (inline)
  -o, --output <file>      Write output to file
  --at-end                 Append at document end (default: before </root>)
  --merge                  Smart merge: handle duplicate IDs
  -h, --help               Show this help

Examples:
  # Append truncated continuation
  npx tsx append-xml.ts diagram.xml continuation.xml -o complete.xml

  # Add new cell inline
  npx tsx append-xml.ts diagram.xml -a '<mxCell id="new" .../>' -o updated.xml

  # Merge with duplicate ID handling
  npx tsx append-xml.ts base.xml additions.xml --merge -o merged.xml
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
            const content = fs.readFileSync(filePath, "utf-8")
            if (!baseXml) {
                baseXml = content
            } else if (!fragmentXml) {
                fragmentXml = content
            }
        }
    }

    // Read fragment from stdin if not provided
    if (!fragmentXml) {
        const chunks: Buffer[] = []
        for await (const chunk of process.stdin) {
            chunks.push(chunk)
        }
        fragmentXml = Buffer.concat(chunks).toString("utf-8")
    }

    if (!baseXml.trim()) {
        console.error("Error: Base XML is empty")
        process.exit(2)
    }

    if (!fragmentXml.trim()) {
        console.error("Error: Fragment XML is empty")
        process.exit(2)
    }

    const result = merge 
        ? mergeXmlCells(baseXml, fragmentXml)
        : appendXmlFragment(baseXml, fragmentXml, beforeClose)

    if (outputFile) {
        const fs = await import("fs")
        fs.writeFileSync(outputFile, result)
        console.error(`Appended XML written to: ${outputFile}`)
    } else {
        console.log(result)
    }
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
