# /sync-repos - Sync AI Architect Repositories

## Purpose
Keep all AI Architect repositories in sync across multiple locations.

## Repository Map

| Repo | Location | GitHub |
|------|----------|--------|
| **ai-architect** (main) | `/mnt/c/Users/Frank/claude-ai-architect` | frankxai/ai-architect |
| **oci-ai-architect** | `/mnt/c/Users/Frank/oci-ai-architect` | frankxai/oci-ai-architect |
| **Academy embed** | `/mnt/c/Users/Frank/AI Architect Academy/claude-ai-architect` | (submodule) |
| **ai-architect-academy** | `/mnt/c/Users/Frank/AI Architect Academy` | AI-Architect-Academy/ai-architect-academy |

## Sync Workflow

### 1. Update Main Repos
```bash
# Push ai-architect changes
cd /mnt/c/Users/Frank/claude-ai-architect
git add -A && git commit -m "update" && git push

# Push oci-ai-architect changes
cd /mnt/c/Users/Frank/oci-ai-architect
git add -A && git commit -m "update" && git push
```

### 2. Sync to Academy Embed
```bash
# Copy updated files to Academy's claude-ai-architect folder
rsync -av --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  /mnt/c/Users/Frank/claude-ai-architect/ \
  "/mnt/c/Users/Frank/AI Architect Academy/claude-ai-architect/"
```

### 3. Commit Academy Changes
```bash
cd "/mnt/c/Users/Frank/AI Architect Academy"
git add claude-ai-architect/
git commit -m "chore: sync claude-ai-architect"
git push
```

## When to Sync

- After `/update-knowledge` runs
- After major skill updates
- Before Academy deployments
- Weekly maintenance

## Files to Sync

| Source | Destination | What |
|--------|-------------|------|
| ai-architect/skills/ | Academy/claude-ai-architect/skills/ | All skills |
| ai-architect/templates/ | Academy/claude-ai-architect/templates/ | D2, Terraform |
| ai-architect/dev-docs/ | Academy/claude-ai-architect/dev-docs/ | Version tracking |
| ai-architect/.claude/ | Academy/claude-ai-architect/.claude/ | Commands |

## Automation

This command should:
1. Check for uncommitted changes in source repos
2. Sync files to embedded locations
3. Commit and push all repos
4. Report what was synced

## Output Format
```markdown
## Sync Report - [DATE]

### Repositories Updated
- [x] ai-architect → GitHub
- [x] oci-ai-architect → GitHub
- [x] Academy/claude-ai-architect → synced
- [x] ai-architect-academy → GitHub

### Files Changed
- X skills updated
- X templates synced
- VERSION-TRACKING.md synced
```
