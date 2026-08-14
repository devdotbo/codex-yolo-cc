---
name: codex-cli-runtime
description: Internal helper contract for calling the codex-companion runtime from Claude Code
user-invocable: false
---

# Codex Runtime

Use this skill only inside the `codex:codex-execute` subagent.

Primary helper:
- `codex-companion task "<raw arguments>"`
- `node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" task "<raw arguments>"`

Execution rules:
- The execute subagent is a forwarder, not an orchestrator. Its only job is to invoke `task` once and return that stdout unchanged.
- `codex-companion` is the context-independent launcher and works from plain subagent Bash when the plugin `bin/` directory is on PATH. The `${CLAUDE_PLUGIN_ROOT}` form is also valid in plugin command, agent, and hook contexts where Claude Code injects that variable.
- Prefer the helper over hand-rolled `git`, direct Codex CLI strings, or any other Bash activity.
- Do not call `setup`, `review`, `adversarial-review`, `status`, `result`, or `cancel` from `codex:codex-execute`.
- Use `task` for every execute request, including diagnosis, planning, research, and explicit fix requests.
- Once invoked, always forward through the companion `task` command. Do not answer from your own knowledge or fabricate a simple result, even for trivial prompts.
- You may use the `codex-prompting` skill to rewrite the user's request into a tighter Codex prompt before the single `task` call.
- That prompt drafting is the only Claude-side work allowed. Do not inspect the repo, solve the task yourself, or add independent analysis outside the forwarded prompt text.
- Model is fixed to gpt-5.6-sol, the only supported --model value (alias: sol); any other --model value is rejected. Sandbox (YOLO/danger-full-access) and web search (live, high context) are hardcoded. Effort defaults to xhigh but accepts --effort <level>. Do not forward --write or --search flags.

Command selection:
- Use exactly one `task` invocation per execute handoff.
- If the forwarded request includes `--background` or `--wait`, treat that as Claude-side execution control only. Strip it before calling `task`, and do not treat it as part of the natural-language task text.
- Treat `--resume` and `--fresh` as routing controls and do not include them in the task text you pass through.
- `--resume`: always use `task --resume-last`, even if the request text is ambiguous.
- `--fresh`: always use a fresh `task` run, even if the request sounds like a follow-up.
- `task --resume-last`: internal helper for "keep going", "resume", "apply the top fix", or "dig deeper" after a previous execute run.

Safety rules:
- Preserve the user's task text as-is apart from stripping routing flags.
- Do not inspect the repository, read files, grep, monitor progress, poll status, fetch results, cancel jobs, summarize output, or do any follow-up work of your own.
- Return the stdout of the `task` command exactly as-is.
- If the Bash call fails or Codex cannot be invoked, return nothing.
