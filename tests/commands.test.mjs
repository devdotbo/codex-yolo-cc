import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_ROOT = path.join(ROOT, "plugins", "codex");

function read(relativePath) {
  return fs.readFileSync(path.join(PLUGIN_ROOT, relativePath), "utf8");
}

test("review command uses AskUserQuestion and background Bash while staying review-only", () => {
  const source = read("commands/review.md");
  assert.match(source, /AskUserQuestion/);
  assert.match(source, /\bBash\(/);
  assert.match(source, /Do not fix issues/i);
  assert.match(source, /review-only/i);
  assert.match(source, /return Codex's output verbatim to the user/i);
  assert.match(source, /```bash/);
  assert.match(source, /```typescript/);
  assert.match(source, /review "\$ARGUMENTS"/);
  assert.match(source, /\[--scope auto\|working-tree\|branch\]/);
  assert.match(source, /run_in_background:\s*true/);
  assert.match(source, /command:\s*`node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/codex-companion\.mjs" review "\$ARGUMENTS"`/);
  assert.match(source, /description:\s*"Codex review"/);
  assert.match(source, /Do not call `BashOutput`/);
  assert.match(source, /Return the command stdout verbatim, exactly as-is/i);
  assert.match(source, /git status --short --untracked-files=all/);
  assert.match(source, /git diff --shortstat/);
  assert.match(source, /Treat untracked files or directories as reviewable work/i);
  assert.match(source, /Recommend waiting only when the review is clearly tiny, roughly 1-2 files total/i);
  assert.match(source, /In every other case, including unclear size, recommend background/i);
  assert.match(source, /The companion script parses `--wait` and `--background`/i);
  assert.match(source, /Claude Code's `Bash\(..., run_in_background: true\)` is what actually detaches the run/i);
  assert.match(source, /When in doubt, run the review/i);
  assert.match(source, /\(Recommended\)/);
  assert.match(source, /does not support staged-only review, unstaged-only review, or extra focus text/i);
});

test("adversarial review command uses AskUserQuestion and background Bash while staying review-only", () => {
  const source = read("commands/adversarial-review.md");
  assert.match(source, /AskUserQuestion/);
  assert.match(source, /\bBash\(/);
  assert.match(source, /Do not fix issues/i);
  assert.match(source, /review-only/i);
  assert.match(source, /return Codex's output verbatim to the user/i);
  assert.match(source, /```bash/);
  assert.match(source, /```typescript/);
  assert.match(source, /adversarial-review "\$ARGUMENTS"/);
  assert.match(source, /\[--scope auto\|working-tree\|branch\] \[focus \.\.\.\]/);
  assert.match(source, /run_in_background:\s*true/);
  assert.match(source, /command:\s*`node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/codex-companion\.mjs" adversarial-review "\$ARGUMENTS"`/);
  assert.match(source, /description:\s*"Codex adversarial review"/);
  assert.match(source, /Do not call `BashOutput`/);
  assert.match(source, /Return the command stdout verbatim, exactly as-is/i);
  assert.match(source, /git status --short --untracked-files=all/);
  assert.match(source, /git diff --shortstat/);
  assert.match(source, /Treat untracked files or directories as reviewable work/i);
  assert.match(source, /Recommend waiting only when the scoped review is clearly tiny, roughly 1-2 files total/i);
  assert.match(source, /In every other case, including unclear size, recommend background/i);
  assert.match(source, /The companion script parses `--wait` and `--background`/i);
  assert.match(source, /Claude Code's `Bash\(..., run_in_background: true\)` is what actually detaches the run/i);
  assert.match(source, /When in doubt, run the review/i);
  assert.match(source, /\(Recommended\)/);
  assert.match(source, /uses the same review target selection as `\/codex:review`/i);
  assert.match(source, /supports working-tree review, branch review, and `--base <ref>`/i);
  assert.match(source, /does not support `--scope staged` or `--scope unstaged`/i);
  assert.match(source, /can still take extra focus text after the flags/i);
});

test("continue is not exposed as a user-facing command", () => {
  const commandFiles = fs.readdirSync(path.join(PLUGIN_ROOT, "commands")).sort();
  assert.deepEqual(commandFiles, [
    "adversarial-review.md",
    "cancel.md",
    "execute.md",
    "result.md",
    "review.md",
    "setup.md",
    "status.md",
    "transfer.md"
  ]);
});

test("execute command absorbs continue semantics", () => {
  const execute = read("commands/execute.md");
  const agent = read("agents/codex-execute.md");
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const runtimeSkill = read("skills/codex-cli-runtime/SKILL.md");

  assert.match(execute, /The final user-visible response must be Codex's output verbatim/i);
  assert.match(execute, /allowed-tools:\s*Bash\(node:\*\),\s*AskUserQuestion,\s*Agent/);
  assert.match(execute, /subagent_type: "codex:codex-execute"/);
  assert.match(execute, /do not call `Skill\(codex:codex-execute\)`/i);
  assert.doesNotMatch(execute, /forked general-purpose subagents do not expose it/i);
  assert.match(execute, /Run this orchestration inline in the main context/i);
  assert.match(execute, /status, result, cancel, transfer, resume prompts, or decision prompts/i);
  assert.doesNotMatch(execute, /^context:\s*fork\b/m);
  assert.match(execute, /--background\|--wait/);
  assert.match(execute, /--resume\|--fresh/);
  assert.match(execute, /task-resume-candidate --json/);
  assert.match(execute, /AskUserQuestion/);
  assert.match(execute, /Continue current Codex thread/);
  assert.match(execute, /Start a new Codex thread/);
  assert.match(execute, /run the `codex:codex-execute` subagent in the background/i);
  assert.match(execute, /default to foreground/i);
  assert.match(execute, /Do not forward them to `task`/i);
  assert.match(execute, /Model defaults to gpt-5\.5 and accepts --model <model>/i);
  assert.match(execute, /If the request includes `--resume`, do not ask whether to continue/i);
  assert.match(execute, /If the request includes `--fresh`, do not ask whether to continue/i);
  assert.match(execute, /If the user chooses continue, add `--resume`/i);
  assert.match(execute, /If the user chooses a new thread, add `--fresh`/i);
  assert.match(execute, /thin forwarder only/i);
  assert.match(execute, /Return the Codex companion stdout verbatim to the user/i);
  assert.match(execute, /Do not paraphrase, summarize, rewrite, or add commentary before or after it/i);
  assert.match(execute, /return that command's stdout as-is/i);
  assert.match(execute, /Leave `--resume` and `--fresh` in the forwarded request/i);
  assert.match(agent, /--resume/);
  assert.match(agent, /--fresh/);
  assert.match(agent, /thin forwarding wrapper/i);
  assert.match(agent, /Use exactly one `Bash` call/i);
  assert.match(agent, /MUST make the companion `task` Bash call/i);
  assert.match(agent, /MUST NOT answer from your own knowledge/i);
  assert.match(agent, /Do not inspect the repository, read files, grep, monitor progress, poll status, fetch results, cancel jobs, summarize output, or do any follow-up work of your own/i);
  assert.match(agent, /Do not call `review`, `adversarial-review`, `status`, `result`, or `cancel`/i);
  assert.match(agent, /Model defaults to gpt-5\.5 and accepts --model <model>/i);
  assert.match(agent, /Return the stdout of the `codex-companion` command exactly as-is/i);
  assert.match(agent, /If the Bash call fails or Codex cannot be invoked, return nothing/i);
  assert.match(agent, /gpt-5-5-prompting/);
  assert.match(agent, /only to tighten the user's request into a better Codex prompt/i);
  assert.match(agent, /Do not use that skill to inspect the repository, reason through the problem yourself, draft a solution, or do any independent work/i);
  assert.match(runtimeSkill, /only job is to invoke `task` once and return that stdout unchanged/i);
  assert.match(runtimeSkill, /`codex-companion task "<raw arguments>"`/);
  assert.match(runtimeSkill, /context-independent launcher/i);
  assert.match(runtimeSkill, /`\$\{CLAUDE_PLUGIN_ROOT\}` form is also valid in plugin command, agent, and hook contexts/i);
  assert.match(runtimeSkill, /Do not answer from your own knowledge or fabricate a simple result/i);
  assert.match(runtimeSkill, /Do not call `setup`, `review`, `adversarial-review`, `status`, `result`, or `cancel`/i);
  assert.match(runtimeSkill, /use the `gpt-5-5-prompting` skill to rewrite the user's request into a tighter Codex prompt/i);
  assert.match(runtimeSkill, /That prompt drafting is the only Claude-side work allowed/i);
  assert.match(runtimeSkill, /Model defaults to gpt-5\.5 and accepts --model <model>/i);
  assert.match(runtimeSkill, /If the forwarded request includes `--background` or `--wait`, treat that as Claude-side execution control only/i);
  assert.match(runtimeSkill, /Strip it before calling `task`/i);
  assert.match(runtimeSkill, /Do not inspect the repository, read files, grep, monitor progress, poll status, fetch results, cancel jobs, summarize output, or do any follow-up work of your own/i);
  assert.match(runtimeSkill, /If the Bash call fails or Codex cannot be invoked, return nothing/i);
  assert.match(readme, /`codex:codex-execute` subagent/i);
  assert.match(readme, /model defaults to GPT 5\.5 \(also supports gpt-5\.5-mini and gpt-5\.4\/5\.4-mini fallbacks via --model/i);
  assert.match(readme, /sandbox runs in YOLO mode/i);
  assert.match(readme, /continue a previous Codex task/i);
  assert.match(readme, /### `\/codex:setup`/);
  assert.match(readme, /### `\/codex:review`/);
  assert.match(readme, /### `\/codex:adversarial-review`/);
  assert.match(readme, /uses the same review target selection as `\/codex:review`/i);
  assert.match(readme, /--base main challenge whether this was the right caching and retry design/);
  assert.match(readme, /### `\/codex:execute`/);
  assert.match(readme, /### `\/codex:transfer`/);
  assert.match(readme, /### `\/codex:status`/);
  assert.match(readme, /### `\/codex:result`/);
  assert.match(readme, /### `\/codex:cancel`/);
});

test("transfer, result, and cancel commands are exposed as deterministic runtime entrypoints", () => {
  const transfer = read("commands/transfer.md");
  const result = read("commands/result.md");
  const cancel = read("commands/cancel.md");
  const resultHandling = read("skills/codex-result-handling/SKILL.md");

  assert.match(transfer, /disable-model-invocation:\s*true/);
  assert.match(transfer, /codex-companion\.mjs" transfer "\$ARGUMENTS"/);
  assert.match(transfer, /codex resume <session-id>/);
  assert.match(result, /disable-model-invocation:\s*true/);
  assert.match(result, /codex-companion\.mjs" result "\$ARGUMENTS"/);
  assert.match(cancel, /disable-model-invocation:\s*true/);
  assert.match(cancel, /codex-companion\.mjs" cancel "\$ARGUMENTS"/);
  assert.match(resultHandling, /do not turn a failed or incomplete Codex run into a Claude-side implementation attempt/i);
  assert.match(resultHandling, /if Codex was never successfully invoked, do not generate a substitute answer at all/i);
});

test("internal docs use task terminology for execute runs", () => {
  const runtimeSkill = read("skills/codex-cli-runtime/SKILL.md");
  const promptingSkill = read("skills/gpt-5-5-prompting/SKILL.md");
  const promptRecipes = read("skills/gpt-5-5-prompting/references/codex-prompt-recipes.md");

  assert.match(runtimeSkill, /codex-companion\.mjs" task "<raw arguments>"/);
  assert.match(runtimeSkill, /Use `task` for every execute request/i);
  assert.match(runtimeSkill, /task --resume-last/i);
  assert.match(promptingSkill, /Use `task` when the task is diagnosis/i);
  assert.match(promptRecipes, /Codex task prompts/i);
  assert.match(promptRecipes, /Use these as starting templates for Codex task prompts/i);
  assert.match(promptRecipes, /## Diagnosis/);
  assert.match(promptRecipes, /## Narrow Fix/);
});

test("hooks keep session-end cleanup and stop gating enabled", () => {
  const source = read("hooks/hooks.json");
  assert.match(source, /SessionStart/);
  assert.match(source, /SessionEnd/);
  assert.match(source, /stop-review-gate-hook\.mjs/);
  assert.match(source, /session-lifecycle-hook\.mjs/);
});

test("setup command can offer Codex install and still points users to codex login", () => {
  const setup = read("commands/setup.md");
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");

  assert.match(setup, /argument-hint:\s*'\[--enable-review-gate\|--disable-review-gate\]'/);
  assert.match(setup, /AskUserQuestion/);
  assert.match(setup, /npm install -g @openai\/codex/);
  assert.match(setup, /codex-companion\.mjs" setup --json \$ARGUMENTS/);
  assert.match(readme, /!codex login/);
  assert.match(readme, /offer to install Codex for you/i);
  assert.match(readme, /\/codex:setup --enable-review-gate/);
  assert.match(readme, /\/codex:setup --disable-review-gate/);
});

test("execute command documents decision handling", () => {
  const execute = read("commands/execute.md");
  assert.match(execute, /CODEX DECISION NEEDED/);
  assert.match(execute, /AskUserQuestion/);
  assert.match(execute, /--resume "Decision:/);
});

test("prompting skill references decision escalation contract", () => {
  const promptingSkill = read("skills/gpt-5-5-prompting/SKILL.md");
  const promptBlocks = read("skills/gpt-5-5-prompting/references/prompt-blocks.md");
  assert.match(promptingSkill, /decision_escalation_contract/);
  assert.match(promptBlocks, /DECISION_NEEDED/);
  assert.match(promptBlocks, /decision_escalation_contract/);
  assert.match(promptBlocks, /blocker:/);
  assert.match(promptBlocks, /evidence:/);
  assert.match(promptBlocks, /options:/);
  assert.match(promptBlocks, /recommended:/);
});

test("prompting skill references confidence reporting contract", () => {
  const promptBlocks = read("skills/gpt-5-5-prompting/references/prompt-blocks.md");
  assert.match(promptBlocks, /confidence_report/);
  assert.match(promptBlocks, /CONFIDENCE/);
  assert.match(promptBlocks, /level:/);
  assert.match(promptBlocks, /basis:/);
  assert.match(promptBlocks, /risks:/);
});

test("prompting skill includes model-specific prompt guidance", () => {
  const promptingSkill = read("skills/gpt-5-5-prompting/SKILL.md");
  const promptRecipes = read("skills/gpt-5-5-prompting/references/codex-prompt-recipes.md");
  assert.match(promptingSkill, /gpt-5\.5-mini/);
  assert.match(promptingSkill, /Model-Specific Prompt Guidance/);
  assert.match(promptRecipes, /Mini Recipes/);
  assert.match(promptRecipes, /Mini: Quick Lookup/);
  assert.match(promptRecipes, /Mini: Targeted Fix/);
});

test("execute agent references model-aware prompting for mini", () => {
  const agent = read("agents/codex-execute.md");
  assert.match(agent, /mini variant.*simplified prompt recipes/i);
});
