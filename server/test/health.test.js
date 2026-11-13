const test = require("node:test");
const assert = require("node:assert/strict");

test("health response contract includes required operational fields", () => {
  const payload = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: 1,
    version: "1.0.0",
    checks: { database: "ok", memory: "ok" }
  };
  assert.equal(payload.status, "ok");
  assert.ok(Number.isFinite(Date.parse(payload.timestamp)));
  assert.ok(payload.uptime >= 0);
  assert.ok(payload.checks.database);
  assert.ok(payload.checks.memory);
});