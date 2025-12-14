#!/usr/bin/env npx tsx
/**
 * Draw.io XML Completeness Checker
 * 
 * Checks if mxCell XML output is complete (not truncated).
 * Useful for detecting truncated LLM output.
 * 
 * Usage:
 *   npx tsx check-complete.ts <file.xml>
 *   echo '<mxCell.../>' | npx tsx check-complete.ts
 * 
 * Exit codes:
 *   0 - Complete XML
 *   1 - Truncated or incomplete XML
 *   2 - Usage error
 */

function isMxCellXmlComplete(xml: string | undefined | null): boolean {
    const trimmed = xml?.trim() || ""
    if (!trimmed) return false
    return trimmed.endsWith("/>") || trimmed.endsWith("</mxCell>")
}

async function main() {
    const args = process.argv.slice(2)
    let xml = ""

    if (args[0] === "-h" || args[0] === "--help") {
        console.log(`
Draw.io XML Completeness Checker

Checks if mxCell XML output is complete (not truncated).

Usage:
  npx tsx check-complete.ts <file.xml>
  echo '<mxCell.../>' | npx tsx check-complete.ts

Exit codes:
  0 - Complete XML
  1 - Truncated or incomplete XML
  2 - Usage error
`)
        process.exit(0)
    }

    if (args.length > 0 && !args[0].startsWith("-")) {
        const fs = await import("fs")
        const path = await import("path")
        const filePath = path.resolve(args[0])
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found: ${filePath}`)
            process.exit(2)
        }
        xml = fs.readFileSync(filePath, "utf-8")
    } else {
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

    const complete = isMxCellXmlComplete(xml)
    
    if (complete) {
        console.log("✅ XML appears complete")
        process.exit(0)
    } else {
        console.log("❌ XML appears truncated or incomplete")
        console.log(`   Last 50 chars: ...${xml.slice(-50)}`)
        process.exit(1)
    }
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
