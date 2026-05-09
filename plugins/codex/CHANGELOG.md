# Changelog

## 1.2.0-yolo

Fork release. Default model bumped to GPT 5.5; legacy 5.4 stays selectable.

- Default model: gpt-5.4 → gpt-5.5 (companion runtime, lib/codex.mjs thread/resume/turn defaults, stop-review-gate hook)
- Allowed models: gpt-5.5, gpt-5.5-mini, gpt-5.4, gpt-5.4-mini
- Aliases: `mini` → gpt-5.5-mini, `legacy` → gpt-5.4, `legacy-mini` → gpt-5.4-mini
- Skill renamed: `gpt-5-4-prompting` → `gpt-5-5-prompting`; tables now mark 5.4/5.4-mini as legacy fallbacks
- Backport from upstream `bb38412`: `/codex:execute` no longer uses `context: fork`; routes via `Agent` tool with explicit `subagent_type: "codex:codex-execute"` to prevent `Skill(...)` recursion hangs
- Manifest/version bump across `package.json`, `.claude-plugin/marketplace.json`, `plugins/codex/.claude-plugin/plugin.json` (1.1.0-yolo → 1.2.0-yolo)
- Tests: added gpt-5.5 default + `mini`/`legacy` alias coverage; pinned the new Agent-routing invariants for execute.md
- Requires Codex CLI >= 0.124.0 for gpt-5.5 (ChatGPT Pro account verified; gpt-5.5-mini not yet entitled on ChatGPT accounts but stays in the allowlist)

## 1.1.0-yolo

Fork release (un-hardcoded model + effort selection).

- Un-hardcoded reasoning effort, default xhigh, accepts `--effort`
- Un-hardcoded model selection, default gpt-5.4, accepts `--model` (gpt-5.4, gpt-5.4-mini)
- Decision-escalation callback for Codex mid-task blockers (`DECISION_NEEDED`)
- Structured result envelopes and confidence reporting
- Fork rebrand to `devdotbo/codex-yolo-cc`

## 1.0.0

- Initial version of the Codex plugin for Claude Code
