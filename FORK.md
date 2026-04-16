# Codex YOLO Plugin - GPT 5.4 xhigh Full-Access Mode

Custom fork of [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc) with locked configuration for maximum capability.

## What Changed

- Model: always GPT 5.4 (hardcoded, no `--model` flag)
- Effort: defaults to xhigh, accepts `--effort <level>` override (medium, high, xhigh, etc.)
- Sandbox: danger-full-access (YOLO mode) for all execute tasks, read-only for reviews
- Web search: always live with high context (hardcoded per-thread via app-server config)
- `/codex:rescue` replaced with `/codex:execute`


## Local Setup Required

Two things outside this repo must point here for the fork to load:

### 1. installed_plugins.json

`~/.claude/plugins/installed_plugins.json` must have:

```json
"codex@codex-yolo": [{
  "installPath": "<YOUR_CLONE_PATH>/plugins/codex",
  "version": "1.1.0-yolo"
}]
```

### 2. Marketplace symlink

The marketplace clone must symlink to the fork (prevents ghost commands):

```bash
rm -rf ~/.claude/plugins/marketplaces/openai-codex/plugins/codex
ln -s <YOUR_CLONE_PATH>/plugins/codex ~/.claude/plugins/marketplaces/openai-codex/plugins/codex
```

Replace `<YOUR_CLONE_PATH>` with the absolute path where you cloned this repo.

## Merging Upstream

```bash
git remote add upstream https://github.com/openai/codex-plugin-cc.git
git fetch upstream
git merge upstream/main
```

Conflicts will be localized to `normalizeRequestedModel`, `normalizeReasoningEffort`, and the sandbox line in `executeTaskRun`.
