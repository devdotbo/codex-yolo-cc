# Codex Prompt Anti-Patterns

Avoid these when prompting Codex or gpt-5.6-sol.

## Vague task framing

Bad:

```text
Take a look at this and let me know what you think.
```

Better:

```xml
<task>
Review this change for material correctness and regression risks.
</task>
```

## Missing output contract

Bad:

```text
Investigate and report back.
```

Better:

```xml
<structured_output_contract>
Return:
1. root cause
2. evidence
3. smallest safe next step
</structured_output_contract>
```

## No follow-through default

Bad:

```text
Debug this failure.
```

Better:

```xml
<default_follow_through_policy>
Keep going until you have enough evidence to identify the root cause confidently.
</default_follow_through_policy>
```

## Asking for more reasoning instead of a better contract

Bad:

```text
Think harder and be very smart.
```

Better:

```xml
<verification_loop>
Before finalizing, verify that the answer matches the observed evidence and task requirements.
</verification_loop>
```

## Mixing unrelated jobs into one run

Bad:

```text
Review this diff, fix the bug you find, update the docs, and suggest a roadmap.
```

Better:
- Run review first.
- Run a separate fix prompt if needed.
- Use a third run for docs or roadmap work.

## Repeating the same rule

Bad: restate approval, scope, or verification rules in several blocks so they cannot be missed.

Better: state each policy once, in the block where it belongs. gpt-5.6-sol already
honours a rule it has read once; repeating it makes Codex stop for approval on
steps that were already in scope.

## Prescribing every step

Bad:

```text
First open the file, then find the handler, then add a guard, then run the tests, then...
```

Better:

```xml
<task>
Goal: requests with a missing tenant id must fail closed instead of falling back to the default tenant.
Hard constraints: no schema change, no new dependency.
Success criteria: the existing suite passes and a new test covers the missing-id path.
Required evidence: the failing-to-passing test output.
</task>
```

Specify the goal, the hard constraints, the success criteria, and the evidence you
need back. Let Codex choose the routine implementation steps.

## Unsupported certainty

Bad:

```text
Tell me exactly why production failed.
```

Better:

```xml
<grounding_rules>
Ground every claim in the provided context or tool outputs.
If a point is an inference, label it clearly.
</grounding_rules>
```
