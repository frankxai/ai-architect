#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))

export function validateAdrs(dir = here) {
  const files = readdirSync(dir).filter((f) => /^ADR-00(0[0-9]|10).*\.md$/.test(f)).sort()
  if (files.length !== 11) {
    throw new Error(`Expected 11 ADR files (ADR-0000 template + ADR-0001..0010), found ${files.length}`)
  }
  const requiredHeadings = ["## Context", "## Decision", "## Alternatives Considered and Rejected", "## Consequences", "## Verification Command"]
  for (const file of files) {
    const text = readFileSync(join(dir, file), "utf8")
    for (const h of requiredHeadings) {
      if (!text.includes(h)) throw new Error(`${file} missing heading: ${h}`)
    }
    if (file !== "ADR-0000-template.md") {
      const patNum = file.match(/^ADR-00(\d{2})/)[1]
      if (!text.includes(`PAT-${patNum}`)) throw new Error(`${file} must reference PAT-${patNum}`)
      if (!text.includes(`FM-${patNum}`)) throw new Error(`${file} must reference FM-${patNum}`)
      if (!text.includes("- **Status:** Accepted")) throw new Error(`${file} must have Accepted status`)
    }
  }
  return { ok: true, adrCount: files.length - 1, templatePresent: true }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(validateAdrs(), null, 2))
}
