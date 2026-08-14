import test from "node:test";
import assert from "node:assert/strict";

import { buildCodexAppServerArgs } from "../plugins/codex/scripts/lib/app-server.mjs";

test("app-server starts Codex without any provider overrides", () => {
  assert.deepEqual(buildCodexAppServerArgs(), ["app-server"]);
});
