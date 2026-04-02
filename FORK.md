# Codex Plugin Fork - GPT 5.4 xhigh YOLO Mode

Custom fork of `openai/codex-plugin-cc` with locked configuration.

## What Changed

- Model: always GPT 5.4 (hardcoded, no `--model` flag)
- Effort: always xhigh (hardcoded, no `--effort` flag)
- Sandbox: danger-full-access (YOLO mode) for all execute tasks, read-only for reviews
- `/codex:rescue` replaced with `/codex:execute`
- `/codex:dual-review` added (Codex + Claude Opus consensus review)

## Local Setup Required

Two things outside this repo must point here for the fork to load:

### 1. installed_plugins.json

`~/.claude/plugins/installed_plugins.json` must have:

```json
"codex@openai-codex": [{
  "installPath": "/Users/bioharz/git/codex-plugin-cc/plugins/codex",
  "version": "1.1.0-custom"
}]
```

### 2. Marketplace symlink

The marketplace clone must symlink to the fork (prevents ghost commands):

```bash
rm -rf ~/.claude/plugins/marketplaces/openai-codex/plugins/codex
ln -s /Users/bioharz/git/codex-plugin-cc/plugins/codex ~/.claude/plugins/marketplaces/openai-codex/plugins/codex
```

## Merging Upstream

```bash
git fetch origin
git merge origin/main
```

Conflicts will be localized to `normalizeRequestedModel`, `normalizeReasoningEffort`, and the sandbox line in `executeTaskRun`.
