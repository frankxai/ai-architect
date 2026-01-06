# /update-knowledge - Automated Knowledge Base Refresh

## Purpose
Keep the AI Architect knowledge base current by checking latest versions of tracked technologies and updating relevant files.

## Workflow

### 1. Version Discovery
Search for current versions of these technologies:
- **LLM Models**: GPT (OpenAI), Claude (Anthropic), Gemini (Google), Llama (Meta)
- **Agent Frameworks**: Vercel AI SDK, OpenAI Agents SDK, Claude Agent SDK, LangGraph
- **Frontend**: Next.js, React
- **AI Gateways**: OpenRouter model count, new providers
- **Cloud**: OCI GenAI, AWS Bedrock, Azure OpenAI updates

### 2. Compare Against Current
Read `dev-docs/VERSION-TRACKING.md` and identify outdated entries.

### 3. Update Files
If updates found:
1. Update `dev-docs/VERSION-TRACKING.md` with new versions
2. Update affected skills in `skills/*/SKILL.md`:
   - Increment `version` (e.g., 1.1.0 → 1.2.0)
   - Update `last_updated` to today
   - Update `external_version` with new versions
3. Update `CLAUDE.md` model selection table if models changed
4. Update `dev-docs/CONTEXT.md` recent changes table

### 4. Report Changes
Output a summary:
```
## Knowledge Update Report - [DATE]

### Updated Technologies
| Technology | Old Version | New Version |
|------------|-------------|-------------|
| ... | ... | ... |

### Files Modified
- dev-docs/VERSION-TRACKING.md
- skills/[affected-skills]/SKILL.md
- CLAUDE.md (if models changed)

### Recommended Actions
- [ ] Review changes before committing
- [ ] Run `/commit` to save updates
```

## Usage Notes

- Run weekly or after major AI announcements
- Uses web search to find latest versions
- Only updates if actual version changes detected
- Preserves existing skill content, only updates metadata

## Search Queries to Execute

```
1. "OpenAI GPT latest model [current year]"
2. "Claude Anthropic latest model [current year]"
3. "Vercel AI SDK latest version"
4. "Next.js latest version release"
5. "LangGraph latest version"
6. "OpenRouter models count [current year]"
```

## Automation Triggers

Consider running this command:
- Every Monday morning
- After OpenAI/Anthropic/Google announcements
- Before starting major design work
- When user mentions "outdated" or "latest"
