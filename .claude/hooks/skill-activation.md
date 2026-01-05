# Skill Auto-Activation Hook

This hook analyzes user prompts and suggests relevant skills based on `skill-rules.json`.

## How It Works

When a user submits a prompt, this hook:
1. Scans for keywords matching skill triggers
2. Checks file patterns if files are mentioned
3. Matches intent patterns against the prompt
4. Suggests the most relevant skill(s)

## Activation Logic

```
IF prompt contains skill keywords THEN suggest skill
IF prompt mentions files matching patterns THEN suggest skill
IF prompt intent matches patterns THEN suggest skill
```

## Usage

The hook runs automatically on UserPromptSubmit. To manually check which skills apply:

```
# Check which skills match a query
claude "What skills apply to: deploy a RAG system on OCI"
```

## Skill Priority Order

When multiple skills match, prioritize:
1. Most specific keyword match
2. File pattern match (highest confidence)
3. Intent pattern match
4. Fallback to general skills

## Limitations

- Regex patterns may miss nuanced intent
- Keywords can have multiple meanings
- File patterns require explicit file mentions
- Complex prompts may need manual skill selection

## Customization

Edit `.claude/settings/skill-rules.json` to:
- Add new keywords for existing skills
- Create new skill triggers
- Adjust intent patterns for better matching
