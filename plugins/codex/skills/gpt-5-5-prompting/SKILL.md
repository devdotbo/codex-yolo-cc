---
name: gpt-5-5-prompting
description: Internal guidance for composing Codex and GPT-5.5 prompts for coding, review, diagnosis, and research tasks inside the Codex Claude Code plugin
user-invocable: false
---

# GPT-5.5 Prompting

Use this skill when `codex:codex-execute` needs to ask Codex or another GPT-5.5-based workflow for help. The same recipes still apply to GPT-5.4 fallback runs.

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
- Review or adversarial review: add `grounding_rules`, `structured_output_contract`, and `dig_deeper_nudge`.
- Research or recommendation tasks: add `research_mode` and `citation_rules`.
- Write-capable tasks: add `action_safety` so Codex stays narrow and avoids unrelated refactors.

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
5. Remove redundant instructions before sending the prompt.

When to add the decision escalation contract:
- Include `decision_escalation_contract` in any prompt where Codex may encounter contradictions, ambiguous requirements, overlapping file sets, or missing information that changes correctness.
- The contract tells Codex to emit a structured `DECISION_NEEDED` marker instead of guessing. The companion script detects this marker and surfaces it to Claude Code for resolution.

Reusable blocks live in [references/prompt-blocks.md](references/prompt-blocks.md).
Concrete end-to-end templates live in [references/codex-prompt-recipes.md](references/codex-prompt-recipes.md).
Common failure modes to avoid live in [references/codex-prompt-antipatterns.md](references/codex-prompt-antipatterns.md).

## Model-Specific Prompt Guidance

| Model | Strengths | Prompt strategy |
|-------|-----------|-----------------|
| gpt-5.5 | Strongest reasoning, large context, complex multi-step tasks, nuanced code review | Full prompt recipes with all blocks. Use completeness_contract and verification_loop. |
| gpt-5.5-mini | Fast, cost-effective, focused single-step tasks | Simplified prompts. Prefer compact_output_contract. Skip dig_deeper_nudge. Keep task scope narrow. |
| gpt-5.4 | Legacy fallback when 5.5 is unavailable for the account | Same block mix as gpt-5.5. |
| gpt-5.4-mini | Legacy mini fallback | Same simplified strategy as gpt-5.5-mini. |

When the selected model is a mini variant (gpt-5.5-mini or gpt-5.4-mini):
- Prefer one clear, bounded task over multi-step orchestration
- Use compact_output_contract instead of structured_output_contract
- Skip verification_loop for simple lookups and file searches
- Keep the total prompt under ~2000 tokens when possible
