---
name: codex-prompting
description: Internal guidance for composing Codex and GPT-5.6-sol prompts for coding, review, diagnosis, and research tasks inside the Codex Claude Code plugin
user-invocable: false
---

# Codex Prompting (gpt-5.6-sol)

Use this skill when `codex:codex-execute` needs to ask Codex for help. Codex runs gpt-5.6-sol, the only supported model.

Prompt Codex like an operator, not a collaborator. Keep prompts compact and block-structured with XML tags. State the task, the output contract, the follow-through defaults, and the small set of extra constraints that matter.

Core rules:
- Prefer one clear task per Codex run. Split unrelated asks into separate runs.
- Tell Codex what done looks like. Do not assume it will infer the desired end state.
- Add explicit grounding and verification rules for any task where unsupported guesses would hurt quality.
- Prefer better prompt contracts over raising reasoning or adding long natural-language explanations.
- Use XML tags consistently so the prompt has stable internal structure.

Default prompt recipe:
- `<task>`: the concrete job and the relevant repository or failure context.
- `<structured_output_contract>` or `<compact_output_contract>`: exact shape, ordering, and brevity requirements.
- `<default_follow_through_policy>`: what Codex should do by default instead of asking routine questions.
- `<verification_loop>` or `<completeness_contract>`: required for debugging, implementation, or risky fixes.
- `<grounding_rules>` or `<citation_rules>`: required for review, research, or anything that could drift into unsupported claims.

When to add blocks:
- Coding or debugging: add `completeness_contract`, `verification_loop`, and `missing_context_gating`.
- Review or adversarial review: add `grounding_rules`, `structured_output_contract`, `dig_deeper_nudge`, and `confidence_report`.
- Research or recommendation tasks: add `research_mode`, `citation_rules`, and `confidence_report`.
- Write-capable tasks: add `action_safety` so Codex stays narrow and avoids unrelated refactors.
- Any task whose answer will drive a decision on partial evidence: add `confidence_report` so the level, basis, and risks come back with the result.

Add only the blocks that materially clarify this task. A lean prompt with a few precise blocks beats a template carrying every block; unused blocks dilute the ones that matter.

How to choose prompt shape:
- Use built-in `review` or `adversarial-review` commands when the job is reviewing local git changes. Those prompts already carry the review contract.
- Use `task` when the task is diagnosis, planning, research, or implementation and you need to control the prompt more directly.
- Use `task --resume-last` for follow-up instructions on the same Codex thread. Send only the delta instruction instead of restating the whole prompt unless the direction changed materially.

Working rules:
- Prefer explicit prompt contracts over vague nudges.
- Use stable XML tag names that match the block names from the reference file.
- Do not raise reasoning or complexity first. Tighten the prompt and verification rules before escalating.
- Ask Codex for brief, outcome-based progress updates only when the task is long-running or tool-heavy.
- Keep claims anchored to observed evidence. If something is a hypothesis, say so.

Prompt assembly checklist:
1. Define the exact task and scope in `<task>`.
2. Choose the smallest output contract that still makes the answer easy to use.
3. Decide whether Codex should keep going by default or stop for missing high-risk details.
4. Add verification, grounding, and safety tags only where the task needs them.
5. Add `confidence_report` when you need to know how much to trust the answer.
6. Remove redundant instructions before sending the prompt. Every block must earn its place; drop the ones that only restate the task.

When to add the decision escalation contract:
- Include `decision_escalation_contract` in any prompt where Codex may encounter contradictions, ambiguous requirements, overlapping file sets, or missing information that changes correctness.
- The contract tells Codex to emit a structured `DECISION_NEEDED` marker instead of guessing. The companion script detects this marker and surfaces it to Claude Code for resolution.

Reusable blocks live in [references/prompt-blocks.md](references/prompt-blocks.md).
Concrete end-to-end templates live in [references/codex-prompt-recipes.md](references/codex-prompt-recipes.md).
Common failure modes to avoid live in [references/codex-prompt-antipatterns.md](references/codex-prompt-antipatterns.md).

## gpt-5.6-sol notes

Source: OpenAI's GPT-5.6 usage guide ("Using GPT-5.6", prompting best practices).

- It is already concise by default. Asking it to "be brief" costs content, so
  when you want short output, name what must survive the cut: the conclusion,
  the supporting evidence, the caveats, and the next action.
- It infers intent well. State the goal, the hard constraints, the approval
  boundaries, and the success criteria once, then let it pick the routine steps.
  Say explicitly which ambiguities should trigger a `DECISION_NEEDED`
  escalation instead of a guess.
- State each rule once. Repeating "ask first" or "do not mutate" across blocks
  makes it stop for approval on steps that were already in scope.
- Tighten scope and verification before escalating effort. The default effort is
  `xhigh`; reserve `max` for the hardest quality-first tasks.

For small, bounded asks (quick lookups, single-file fixes), use the simplified
Mini recipes from [references/codex-prompt-recipes.md](references/codex-prompt-recipes.md):
- Prefer one clear, bounded task over multi-step orchestration
- Use compact_output_contract instead of structured_output_contract
- Skip verification_loop for simple lookups and file searches
- Keep prompts lean; a few hundred tokens usually suffice for a small bounded ask
