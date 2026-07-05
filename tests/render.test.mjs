import test from "node:test";
import assert from "node:assert/strict";

import {
  renderDecisionRequest,
  renderReviewResult,
  renderStoredJobResult,
  renderTaskResult
} from "../plugins/codex/scripts/lib/render.mjs";

test("renderReviewResult degrades gracefully when JSON is missing required review fields", () => {
  const output = renderReviewResult(
    {
      parsed: {
        verdict: "approve",
        summary: "Looks fine."
      },
      rawOutput: JSON.stringify({
        verdict: "approve",
        summary: "Looks fine."
      }),
      parseError: null
    },
    {
      reviewLabel: "Adversarial Review",
      targetLabel: "working tree diff"
    }
  );

  assert.match(output, /Codex returned JSON with an unexpected review shape\./);
  assert.match(output, /Missing array `findings`\./);
  assert.match(output, /Raw final message:/);
});

test("renderStoredJobResult prefers rendered output for structured review jobs", () => {
  const output = renderStoredJobResult(
    {
      id: "review-123",
      status: "completed",
      title: "Codex Adversarial Review",
      jobClass: "review",
      threadId: "thr_123"
    },
    {
      threadId: "thr_123",
      rendered: "# Codex Adversarial Review\n\nTarget: working tree diff\nVerdict: needs-attention\n",
      result: {
        result: {
          verdict: "needs-attention",
          summary: "One issue.",
          findings: [],
          next_steps: []
        },
        rawOutput:
          '{"verdict":"needs-attention","summary":"One issue.","findings":[],"next_steps":[]}'
      }
    }
  );

  assert.match(output, /^# Codex Adversarial Review/);
  assert.doesNotMatch(output, /^\{/);
  assert.match(output, /Codex session ID: thr_123/);
  assert.match(output, /Resume in Codex: codex resume thr_123/);
});

test("renderTaskResult appends a Codex session marker when a thread id is available", () => {
  const output = renderTaskResult(
    {
      rawOutput: "Handled the requested task.\nTask prompt accepted."
    },
    {
      threadId: "thr_task"
    }
  );

  assert.equal(
    output,
    "Handled the requested task.\nTask prompt accepted.\n\nCodex session ID: thr_task\nResume in Codex: codex resume thr_task\n"
  );
});

test("renderTaskResult leaves output unmarked when no thread id is available", () => {
  const output = renderTaskResult(
    {
      rawOutput: "Handled the requested task."
    },
    {}
  );

  assert.equal(output, "Handled the requested task.\n");
  assert.doesNotMatch(output, /Codex session ID:/);
});

test("renderDecisionRequest formats a decision request for display", () => {
  const parsed = {
    blocker: "Two valid migration strategies with different rollback risks",
    evidence: [
      "Strategy A uses additive columns only",
      "Strategy B renames and drops, blocking rollback"
    ],
    options: [
      "A: Additive migration with backfill",
      "B: Rename-and-drop migration"
    ],
    recommended: "A"
  };

  const output = renderDecisionRequest(parsed, { threadId: "thr_decision" });

  assert.match(output, /^CODEX DECISION NEEDED/);
  assert.match(output, /Blocker: Two valid migration strategies/);
  assert.match(output, /Strategy A uses additive columns only/);
  assert.match(output, /Strategy B renames and drops/);
  assert.match(output, /A: Additive migration with backfill/);
  assert.match(output, /B: Rename-and-drop migration/);
  assert.match(output, /Recommended: A/);
  assert.match(output, /\/codex:execute --resume "Decision:/);
  assert.match(output, /Codex session ID: thr_decision/);
  assert.match(output, /Resume in Codex: codex resume thr_decision/);
});

test("renderDecisionRequest handles empty evidence and options gracefully", () => {
  const parsed = {
    blocker: "Missing database credentials for staging",
    evidence: [],
    options: [],
    recommended: ""
  };

  const output = renderDecisionRequest(parsed);

  assert.match(output, /^CODEX DECISION NEEDED/);
  assert.match(output, /Blocker: Missing database credentials/);
  assert.doesNotMatch(output, /Evidence:/);
  assert.doesNotMatch(output, /Options:/);
  assert.doesNotMatch(output, /Recommended:/);
  assert.doesNotMatch(output, /Codex session ID:/);
});
