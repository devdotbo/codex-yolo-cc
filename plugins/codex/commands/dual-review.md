---
description: Dual review - both Codex (GPT 5.4 xhigh) and Claude Opus review changes and must reach agreement
argument-hint: "[--base <ref>] [--scope auto|working-tree|branch] [focus ...]"
context: fork
allowed-tools: Read, Glob, Grep, Bash(node:*), Bash(git:*), AskUserQuestion
---

Run a dual-review workflow where both Codex GPT 5.4 and Claude Opus independently review changes, then synthesize a consensus verdict.

## Step 1: Run Codex adversarial review

Execute:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/codex-companion.mjs" adversarial-review $ARGUMENTS
```

Capture the full output. This is Codex's independent review.

## Step 2: Run Claude Opus review

Independently review the same changes yourself:

1. Run `git diff` (or `git diff --cached`, or `git diff <base>...HEAD` depending on the scope) to get the changes.
2. Read the changed files for full context using Read/Glob/Grep.
3. Analyze for: correctness bugs, security issues, race conditions, error handling gaps, API contract violations, data corruption risks, missing edge cases, rollback safety, and observability gaps.
4. Produce your own severity-ordered findings list.

Do NOT look at the Codex output before completing your own review. Form your independent opinion first.

## Step 3: Synthesize both reviews

Present a structured report with these sections:

### Codex Findings
List Codex's findings ordered by severity.

### Claude Opus Findings
List your own findings ordered by severity.

### Consensus
Issues flagged by both reviewers. These are high-confidence findings.

### Disagreements
Issues flagged by only one reviewer. For each, explain:
- Which reviewer flagged it
- The reasoning behind the finding
- Why the other reviewer may have missed it or deemed it acceptable

### Verdict
- **APPROVED**: Both reviewers agree there are no blocking issues.
- **NEEDS WORK**: Either reviewer found blocking issues. List the blockers.

## Rules

- Never auto-fix any issues. Present findings only.
- If the verdict is NEEDS WORK, use `AskUserQuestion` to ask which issues the user wants addressed.
- If Codex fails to run, report the failure and proceed with Claude-only review, noting that dual consensus was not achieved.
- Do not summarize or paraphrase Codex's output beyond what is needed for the structured synthesis.
