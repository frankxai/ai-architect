#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))

export function validateC4(dir = here) {
  const dsl = readFileSync(join(dir, "agentic-system.dsl"), "utf8")
  const openBraces = (dsl.match(/\{/g) ?? []).length
  const closeBraces = (dsl.match(/\}/g) ?? []).length
  if (openBraces === 0 || openBraces !== closeBraces) {
    throw new Error(`Structurizr DSL brace mismatch: ${openBraces} open vs ${closeBraces} close`)
  }

  const definedIds = new Set(Array.from(dsl.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*=\s*(?:person|softwareSystem|container|component)\b/gm), (m) => m[1]))
  for (const requiredId of ["operator", "customer", "checkerHuman", "agentPlatform", "supervisor", "capabilityProxy", "makerWorker", "checkerWorker", "stateStore"]) {
    if (!definedIds.has(requiredId)) {
      throw new Error(`Structurizr DSL missing required element: ${requiredId}`)
    }
  }

  const relations = Array.from(dsl.matchAll(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*->\s*([A-Za-z][A-Za-z0-9_]*)\s+"([^"]+)"/gm))
  if (relations.length < 10) {
    throw new Error(`Expected >= 10 relationships in agentic-system.dsl, found ${relations.length}`)
  }
  for (const [, src, dst] of relations) {
    if (!definedIds.has(src)) throw new Error(`Undefined relationship source in DSL: ${src}`)
    if (!definedIds.has(dst)) throw new Error(`Undefined relationship target in DSL: ${dst}`)
  }

  const mmdFiles = ["c1-system-context.mmd", "c2-containers.mmd", "c3-tool-plane-components.mmd", "c4-maker-checker-sequence.mmd"]
  for (const name of mmdFiles) {
    const text = readFileSync(join(dir, name), "utf8").trim()
    if (!/^(flowchart|sequenceDiagram)\b/.test(text)) {
      throw new Error(`Invalid Mermaid header in ${name}`)
    }
    if ((text.match(/-->|->>|-->>/) ?? []).length === 0) {
      throw new Error(`Mermaid diagram ${name} has no edges`)
    }
  }

  return {
    ok: true,
    dslElements: definedIds.size,
    dslRelationships: relations.length,
    mermaidDiagrams: mmdFiles.length,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(validateC4(), null, 2))
}
