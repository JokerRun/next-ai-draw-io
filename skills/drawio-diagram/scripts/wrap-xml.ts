#!/usr/bin/env npx tsx
/**
 * Draw.io XML Wrapper
 * 
 * Wraps bare mxCell elements with full mxFile structure required by draw.io.
 * 
 * Usage:
 *   npx tsx wrap-xml.ts <file.xml>
 *   cat cells.xml | npx tsx wrap-xml.ts > wrapped.drawio
 * 
 * Options:
 *   -o, --output <file>  Write output to file instead of stdout
 *   --page-name <name>   Page name (default: "Page-1")
 */

const ROOT_CELLS = '<mxCell id="0"/><mxCell id="1" parent="0"/>'

function wrapWithMxFile(xml: string, pageName: string = "Page-1"): string {
    if (!xml || !xml.trim()) {
        return `<mxfile><diagram name="${pageName}" id="page-1"><mxGraphModel><root>${ROOT_CELLS}</root></mxGraphModel></diagram></mxfile>`
    }

    // Already has full structure
    if (xml.includes("<mxfile")) {
        return xml
    }

    // Has mxGraphModel but not mxfile
    if (xml.includes("<mxGraphModel")) {
        return `<mxfile><diagram name="${pageName}" id="page-1">${xml}</diagram></mxfile>`
    }

    // Has <root> wrapper - extract inner content
    let content = xml
    if (xml.includes("<root>")) {
        content = xml.replace(/<\/?root>/g, "").trim()
    }

    // Remove any existing root cells from content
    content = content
        .replace(/<mxCell[^>]*\bid=["']0["'][^>]*(?:\/>|><\/mxCell>)/g, "")
        .replace(/<mxCell[^>]*\bid=["']1["'][^>]*(?:\/>|><\/mxCell>)/g, "")
        .trim()

    return `<mxfile><diagram name="${pageName}" id="page-1"><mxGraphModel><root>${ROOT_CELLS}${content}</root></mxGraphModel></diagram></mxfile>`
}

async function main() {
    const args = process.argv.slice(2)
    let xml = ""
    let outputFile = ""
    let pageName = "Page-1"

    // Parse args
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-o" || args[i] === "--output") {
            outputFile = args[++i]
        } else if (args[i] === "--page-name") {
            pageName = args[++i]
        } else if (args[i] === "-h" || args[i] === "--help") {
            console.log(`
Draw.io XML Wrapper

Wraps bare mxCell elements with full mxFile structure.

Usage:
  npx tsx wrap-xml.ts <file.xml>
  cat cells.xml | npx tsx wrap-xml.ts > wrapped.drawio

Options:
  -o, --output <file>  Write output to file instead of stdout
  --page-name <name>   Page name (default: "Page-1")
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

    const wrapped = wrapWithMxFile(xml, pageName)

    if (outputFile) {
        const fs = await import("fs")
        fs.writeFileSync(outputFile, wrapped)
        console.error(`Wrapped XML written to: ${outputFile}`)
    } else {
        console.log(wrapped)
    }
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
