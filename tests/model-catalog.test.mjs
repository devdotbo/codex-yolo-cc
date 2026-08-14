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
    effort: "max",
    modelProvider: "openai"
  });
  await validateReasoningSelection(client, {
    model: "gpt-5.6-terra",
    effort: "max",
    modelProvider: "openai"
  });
});

test("catalog rejects an unsupported effort and lists supported efforts", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["low", "medium", "high", "xhigh"])]);

  await assert.rejects(
    validateReasoningSelection(client, {
      model: "gpt-5.6-luna",
      effort: "max",
      modelProvider: "openai"
    }),
    /Reasoning effort "max" is not supported by model "gpt-5\.6-luna".*low, medium, high, xhigh/i
  );
});

test("catalog validates effort against the default model when no model is selected", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["low", "medium", "high", "xhigh"], true)]);

  await assert.rejects(
    validateReasoningSelection(client, { effort: "max", modelProvider: "openai" }),
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
    effort: "max",
    modelProvider: "openai"
  });
});

test("catalog does not block custom providers or unknown models", async () => {
  const client = clientWith([model("gpt-5.6-luna", ["high"])]);

  // The fork spawns the app-server with model_provider=codex-lb by default,
  // so validation must stay inert for any provider other than openai.
  await validateReasoningSelection(client, {
    model: "gpt-5.6-luna",
    effort: "max",
    modelProvider: "codex-lb"
  });
  await validateReasoningSelection(client, {
    model: "custom-model",
    effort: "max",
    modelProvider: "openai"
  });
});
