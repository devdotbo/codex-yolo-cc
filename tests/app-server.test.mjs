import test from "node:test";
import assert from "node:assert/strict";

import { buildCodexAppServerArgs } from "../plugins/codex/scripts/lib/app-server.mjs";

function configPairs(args) {
  const pairs = new Map();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "-c") {
      const [key, ...valueParts] = String(args[index + 1] ?? "").split("=");
      pairs.set(key, valueParts.join("="));
      index += 1;
    }
  }
  return pairs;
}

test("app-server starts Codex through the local load balancer by default", () => {
  const args = buildCodexAppServerArgs({});
  const pairs = configPairs(args);

  assert.equal(args[0], "app-server");
  assert.equal(pairs.get("model_provider"), '"codex-lb"');
  assert.equal(pairs.get("model_providers.codex-lb.name"), '"openai"');
  assert.equal(pairs.get("model_providers.codex-lb.base_url"), '"http://127.0.0.1:2455/backend-api/codex"');
  assert.equal(pairs.get("model_providers.codex-lb.wire_api"), '"responses"');
  assert.equal(pairs.get("model_providers.codex-lb.supports_websockets"), "true");
  assert.equal(pairs.get("model_providers.codex-lb.requires_openai_auth"), "true");
});

test("app-server load balancer wiring can be disabled or retargeted with env", () => {
  assert.deepEqual(buildCodexAppServerArgs({ CODEX_PLUGIN_DISABLE_LB: "1" }), ["app-server"]);

  const args = buildCodexAppServerArgs({
    CODEX_PLUGIN_LB_BASE_URL: "http://127.0.0.1:9999/backend-api/codex"
  });
  const pairs = configPairs(args);
  assert.equal(pairs.get("model_providers.codex-lb.base_url"), '"http://127.0.0.1:9999/backend-api/codex"');
});
