import test from "node:test";
import assert from "node:assert/strict";

import { validateReasoningSelection } from "../plugins/codex/scripts/lib/model-catalog.mjs";

function clientWith(models) {
  return {
    async request(method) {
      assert.equal(method, "model/list");
      return { data: models, nextCursor: null };
    }
  };
}

function model(name, efforts, isDefault = false) {
  return {
    id: name,
    model: name,
    isDefault,
    supportedReasoningEfforts: efforts.map((reasoningEffort) => ({ reasoningEffort }))
  };
}

test("catalog accepts max for models that support it", async () => {
  const client = clientWith([
    model("gpt-5.6-sol", ["low", "medium", "high", "xhigh", "max"]),
    model("gpt-5.6-terra", ["low", "medium", "high", "xhigh", "max"])
  ]);

  await validateReasoningSelection(client, {
    model: "gpt-5.6-sol",
    effort: "max"
  });
  await validateReasoningSelection(client, {
    model: "gpt-5.6-terra",
    effort: "max"
  });
});

test("catalog rejects an unsupported effort and lists supported efforts", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["low", "medium", "high", "xhigh"])]);

  await assert.rejects(
    validateReasoningSelection(client, {
      model: "gpt-5.6-luna",
      effort: "max"
    }),
    /Reasoning effort "max" is not supported by model "gpt-5\.6-luna".*low, medium, high, xhigh/i
  );
});

test("catalog validates effort against the default model when no model is selected", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["low", "medium", "high", "xhigh"], true)]);

  await assert.rejects(
    validateReasoningSelection(client, { effort: "max" }),
    /Reasoning effort "max" is not supported by model "gpt-5\.6-luna"/i
  );
});

test("catalog fallback allows older CLIs without model/list", async () => {
  const client = {
    async request() {
      const error = new Error("Unsupported method: model/list");
      error.rpcCode = -32601;
      throw error;
    }
  };

  await validateReasoningSelection(client, {
    model: "gpt-5.6-sol",
    effort: "max"
  });
});

test("catalog validation runs regardless of the configured provider", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["high"])]);

  // Validation no longer depends on a provider name: the catalog check applies
  // to every run, so an unsupported effort is rejected here too.
  await assert.rejects(
    validateReasoningSelection(client, {
      model: "gpt-5.6-luna",
      effort: "max",
      modelProvider: "some-custom-provider"
    }),
    /Reasoning effort "max" is not supported by model "gpt-5\.6-luna"/i
  );
});

test("catalog does not block models it does not list", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["high"])]);

  await validateReasoningSelection(client, {
    model: "custom-model",
    effort: "max"
  });
});

test("catalog stays inert when no effort is selected", async () => {
  const client = {
    async request() {
      throw new Error("model/list must not be called when no effort is selected");
    }
  };

  await validateReasoningSelection(client, { model: "gpt-5.6-sol" });
});
