#!/usr/bin/env npx tsx
/**
 * Draw.io XML Formatter
 * 
 * Pretty-prints draw.io XML with proper indentation.
 * 
 * Usage:
 *   npx tsx format-xml.ts <file.xml>
 *   cat diagram.xml | npx tsx format-xml.ts > formatted.xml
 * 
 * Options:
 *   -o, --output <file>  Write output to file instead of stdout
 *   --indent <string>    Indentation string (default: "  ")
 */

function formatXML(xml: string, indent: string = "  "): string {
    let formatted = ""
    let pad = 0

    // Remove existing whitespace between tags
    xml = xml.replace(/>\s*</g, "><").trim()

    // Split on tags
    const tags = xml.split(/(?=<)|(?<=>)/g).filter(Boolean)

    tags.forEach((node, index) => {
        if (node.match(/^<\/\w/)) {
            // Closing tag - decrease indent
            pad = Math.max(0, pad - 1)
            formatted += indent.repeat(pad) + node + "\n"
        } else if (node.match(/^<\w[^>]*[^/]>.*$/)) {
            // Opening tag
            formatted += indent.repeat(pad) + node
            // Only add newline if next item is a tag
            const nextIndex = index + 1
            if (nextIndex < tags.length && tags[nextIndex].startsWith("<")) {
                formatted += "\n"
                if (!node.match(/^<\w[^>]*\/>$/)) {
                    pad++
                }
            }
        } else if (node.match(/^<\w[^>]*\/>$/)) {
            // Self-closing tag
            formatted += indent.repeat(pad) + node + "\n"
        } else if (node.startsWith("<")) {
            // Other tags (like <?xml)
            formatted += indent.repeat(pad) + node + "\n"
        } else {
            // Text content
            formatted += node
        }
    })

    return formatted.trim()
}

async function main() {
    const args = process.argv.slice(2)
    let xml = ""
    let outputFile = ""
    let indent = "  "

    // Parse args
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "-o" || args[i] === "--output") {
            outputFile = args[++i]
        } else if (args[i] === "--indent") {
            indent = args[++i].replace(/\\t/g, "\t")
        } else if (args[i] === "-h" || args[i] === "--help") {
            console.log(`
Draw.io XML Formatter

Pretty-prints draw.io XML with proper indentation.

Usage:
  npx tsx format-xml.ts <file.xml>
  cat diagram.xml | npx tsx format-xml.ts > formatted.xml

Options:
  -o, --output <file>  Write output to file instead of stdout
  --indent <string>    Indentation string (default: "  ", use "\\t" for tabs)
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

    const formatted = formatXML(xml, indent)

    if (outputFile) {
        const fs = await import("fs")
        fs.writeFileSync(outputFile, formatted)
        console.error(`Formatted XML written to: ${outputFile}`)
    } else {
        console.log(formatted)
    }
}

main().catch(err => {
    console.error("Error:", err.message)
    process.exit(2)
})
