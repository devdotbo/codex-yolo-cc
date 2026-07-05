# Changelog

## 1.3.0-yolo

Fork hardening release for Codex execute from subagents.

- Added the `codex-companion` PATH launcher so plain subagent Bash can invoke the companion without relying on `${CLAUDE_PLUGIN_ROOT}`
- Fixed `/codex:result <job-id>` for queued/running jobs so existing active jobs report "still running" instead of "No job found"
- Hardened `codex:codex-execute` against silent fake-success responses by requiring every delegated request to forward to the companion `task` runtime
- Added foreground proof-of-Codex markers for task output and `CODEX DECISION NEEDED` output: `Codex session ID:` plus the matching `codex resume <thread-id>` command
- Corrected `/codex:execute` docs to describe the real main-context control model: subagents can start Codex work, while the main context owns status/result/cancel/transfer, resume routing, and decision prompts
- Updated the `codex-cli-runtime` invocation contract with the context-independent launcher and the always-forward rule
- Added a `codex-explain` section documenting shared subagent execution data, main-context control, and marker-based verification
- Added a fail-closed consumer rule for the proof-of-Codex marker: `/codex:execute` and `codex-result-handling` treat any `codex:codex-execute` response without the `Codex session ID:` line as a non-run or failed run, never as a Codex answer
- Made the test suite hermetic to live-session env injection: `tests/helpers.mjs` strips `CLAUDE_PLUGIN_DATA` and the `CODEX_COMPANION_*` runtime vars at startup, so `npm test` passes from inside a running Claude Code session
- Bumped manifest/version metadata across `package.json`, `package-lock.json`, `plugins/codex/.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` (1.2.0-yolo -> 1.3.0-yolo)
- Known issues: crashed sessions can still leave orphaned `cxc-*` broker temp directories behind; cleanup is tracked for a later release

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
