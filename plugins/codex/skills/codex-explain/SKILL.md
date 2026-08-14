---
name: codex-explain
description: >-
  Explains how this Codex plugin actually behaves at runtime, so you can answer
  questions about it without re-deriving from source. Covers the shared
  per-session Codex runtime and its lifecycle, one-shot vs persistent behavior,
  foreground vs background jobs, thread resume vs transfer, the hardcoded YOLO
  full-access sandbox for execute, read-only reviews, model and effort options,
  the optional stop-review gate, and what every /codex: command does and who can
  invoke it. Load this whenever the user asks how Codex or the codex plugin
  works, whether it stays open or is one-shot, whether it keeps a session or
  process alive, what options or flags exist, or what a specific /codex: command
  does.
user-invocable: true
---

# How the Codex plugin behaves

Verified reference for the `codex` plugin (this install is the codex-yolo fork,
version 1.3.0-yolo). Use it to answer "how does codex work, does it stay open,
what are the options" without re-reading the plugin source. Facts here were
checked against the scripts and confirmed with a live run.

## Mental model: neither pure one-shot nor a live handoff

Claude Code never hands control to Codex. Every `/codex:` interaction is a
discrete tool call that runs, finishes, and returns to Claude. But the plugin
keeps a warm Codex process alive for the whole Claude session, so it is also not
a cold shell-out:

- The first `execute` or `review` in a session starts a shared Codex runtime (a
  broker process plus a Codex app-server) reachable over a Unix domain socket.
  Before that, setup reports mode "direct" (no runtime yet); after it, status
  reports mode "shared" with a live socket endpoint.
- That runtime stays warm and is reused by every later call in the session.
- Each call is a "shot": it can block (foreground) or detach (background job
  with an ID you poll). Either way, control returns to Claude when it finishes.
- The conversation thread with Codex persists across shots and is resumable
  (`--resume`) or exportable to a real terminal (`transfer`).

Closest analogy: messaging a stateful agent that remembers the thread and keeps
a warm process, with Claude Code always the intermediary. Not "you are now
inside Codex."

## Who drives Codex: main context vs subagents

There are two separate layers:

- Execution and session data are shared. A general-purpose subagent can invoke
  `codex:codex-execute`, and the resulting Codex job uses the same
  `CODEX_COMPANION_SESSION_ID`, workspace-keyed state, broker, and resumable
  Codex threads as the main context.
- Control is main-context/user-only. Slash commands, interactive resume choices,
  decision prompts, status/result/cancel/transfer orchestration, and user
  follow-up routing are driven from the main context.

What works from a subagent:

- It can spawn `codex:codex-execute` for substantial work. The execute agent now
  must forward every delegated request to the companion instead of answering
  from its own knowledge.
- Plain Bash can call the context-independent `codex-companion` launcher when
  the plugin `bin/` directory is on PATH, or an absolute path to
  `scripts/codex-companion.mjs`.
- Jobs created this way are visible to `/codex:status` and controllable from the
  main context.

What does not work from a subagent:

- Subagents do not own slash-command orchestration or interactive prompts.
- A subagent should not be asked to poll status, fetch results, cancel jobs,
  handle decision requests, or decide whether to resume. The main context
  controls a subagent's Codex jobs; the subagent does not control the main
  context's Codex surface.

To verify that a foreground execute response came from a real Codex run, look
for the `Codex session ID:` marker and matching `codex resume <thread-id>`
command. Missing markers usually mean there was no Codex thread to prove, such
as an invocation failure. Consumers fail closed on this marker: `/codex:execute`
and the result-handling guidance treat an unmarked response as a non-run or
failed run, never as a Codex answer.

## Lifecycle (start and teardown)

- SessionStart hook: persists env vars only (session id, transcript path, plugin
  data dir). It does not start a runtime.
- First `task` or `review`: starts the shared runtime on demand.
- SessionEnd hook: full teardown. It sends a broker shutdown, kills any
  still-running job process trees for the session, tears down the broker process
  tree, removes the pid, log, and socket files, and drops this session's jobs
  from state. The runtime does not outlive the Claude session.

## Commands

Claude can only auto-invoke commands that are not marked
`disable-model-invocation`. In this plugin that is just `execute` and `setup`.
The rest are user-typed slash commands.

| Command | What it does | Claude can auto-invoke |
| --- | --- | --- |
| `/codex:execute` | Delegate implementation, debugging, or investigation to Codex. Can write files. | Yes |
| `/codex:review` | Read-only code review of the git diff. Never edits. | No |
| `/codex:adversarial-review` | Read-only review that challenges the design and approach, not just defects. | No |
| `/codex:status` | Show active and recent jobs for this repo, plus gate status. | No |
| `/codex:result` | Show the stored final output of a finished job. | No |
| `/codex:cancel` | Cancel an active background job. | No |
| `/codex:transfer` | Export the current Claude session into a resumable Codex thread. | No |
| `/codex:setup` | Check readiness and auth, optionally install Codex, toggle the review gate. | Yes |

## Execute (the write path)

`/codex:execute [--background|--wait] [--resume|--fresh] [--model <m>] [--effort <level>] <task>`

- Sandbox is hardcoded to Codex YOLO mode: `danger-full-access` with approval
  policy `never`. Full disk read and write, no approval prompts. This is by
  design and is what the plugin name means. Scope prompts narrowly.
- Live web search is hardcoded on (high context).
- `--write` and `--search` are not forwarded; access is already full, so passing
  them does nothing.
- Routing: the command hands off to the `codex:codex-execute` subagent, which is
  a thin forwarder that makes one call to the companion `task` runtime and
  returns its stdout verbatim.

## Reviews (read-only)

- `/codex:review` and `/codex:adversarial-review` run in a `read-only` sandbox
  and never edit files.
- They target the git diff (working tree or a base branch via `--base <ref>`,
  scope via `--scope auto|working-tree|branch`).
- Adversarial review challenges whether the approach is right, what assumptions
  it depends on, and where the design fails under real conditions.
- After any review, auto-applying fixes is forbidden. Findings are presented,
  then Claude must ask which, if any, to fix before touching a file.

## Threads: resume vs transfer

- `--resume` / `--resume-last`: continue the last Codex thread from this session.
- `--fresh`: force a brand new thread.
- If neither flag is given and a resumable thread exists, `execute` asks once
  (continue vs new) before starting.
- `/codex:transfer`: imports the current Claude session transcript into a Codex
  thread and prints `codex resume <thread-id>`, so you can keep talking to that
  exact thread in a terminal, fully outside Claude Code.

## Jobs: foreground vs background

- Foreground (`--wait`, or the default for a small bounded task): blocks and
  returns Codex output inline.
- Background (`--background`): spawns a detached worker, returns a job ID
  immediately. Poll with `/codex:status`, fetch the final payload with
  `/codex:result`, stop it with `/codex:cancel`.
- Job records and per-job logs are persisted on disk, so results survive across
  turns within the session.

## Models and effort

- Model: `gpt-5.6-sol` only. It is the default and the sole accepted `--model`
  value; every other value is rejected with an "Unsupported model" error.
- Alias: `sol` = gpt-5.6-sol.
- Effort: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. Default `xhigh`.
  When the app-server runs against the plain `openai` provider, the requested
  model/effort pair is validated against its model catalog; under the default
  `codex-lb` provider that check is a no-op.
- gpt-5.6-sol needs a Codex CLI build that ships the model.

## Stop-review gate (opt-in, off by default)

- Enable with `/codex:setup --enable-review-gate`, disable with
  `--disable-review-gate`.
- When on, a Stop hook runs a Codex review of the previous turn before Claude is
  allowed to finish. The review answers `ALLOW:` or `BLOCK:`; a block prevents
  the session from ending until issues are addressed or the gate is bypassed.
  15 minute timeout.

## Setup and auth

- `/codex:setup` checks Node, npm, the Codex CLI, and auth (ChatGPT login or API
  key), and reports whether a shared runtime is active.
- If Codex is missing, it offers `npm install -g @openai/codex`. If unauthed, the
  fix is `codex login`.

## Where state lives on disk

- Plugin data: `~/.claude/plugins/data/codex-codex-yolo/state/<workspace-hash>/`
  with `state.json` (config plus jobs) and `jobs/*.log`.
- Broker socket: under `$TMPDIR`, for example
  `/var/folders/.../cxc-XXXX/broker.sock`.

## Safety notes

- Execute runs with full disk access and no approval gate, by design. Keep
  execute prompts tightly scoped.
- Reviews are read-only and never edit.
- Do not turn a failed Codex run into a Claude-side implementation attempt;
  report the failure and stop.

## Source map (to verify or go deeper)

- `scripts/codex-companion.mjs`: command dispatch (task, review, status, result,
  cancel, transfer, setup) and background worker spawning.
- `scripts/lib/codex.mjs`: model, sandbox, effort, and web-search defaults, plus
  app-server request building.
- `scripts/lib/broker-lifecycle.mjs` and `scripts/app-server-broker.mjs`: the
  shared runtime and its socket protocol.
- `scripts/lib/tracked-jobs.mjs`, `state.mjs`, `job-control.mjs`: job and thread
  persistence.
- `hooks/hooks.json`, `scripts/session-lifecycle-hook.mjs`,
  `scripts/stop-review-gate-hook.mjs`: lifecycle and the review gate.
- `commands/*.md`, `agents/codex-execute.md`, `skills/*`: the Claude-facing
  surface.
