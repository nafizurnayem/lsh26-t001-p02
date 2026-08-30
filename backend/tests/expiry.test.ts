import assert from "node:assert/strict";
import test from "node:test";
import { classifyExpiry, daysUntil } from "../src/inventory/expiry.js";

test("classifies expiry boundaries exactly", () => {
  assert.equal(classifyExpiry(-1), "expired");
  assert.equal(classifyExpiry(0), "expiring_30");
  assert.equal(classifyExpiry(30), "expiring_30");
  assert.equal(classifyExpiry(31), "expiring_90");
  assert.equal(classifyExpiry(90), "expiring_90");
  assert.equal(classifyExpiry(91), "safe");
});

test("calculates calendar-day differences", () => {
  assert.equal(daysUntil("2026-08-29", "2026-08-30"), -1);
  assert.equal(daysUntil("2026-08-30", "2026-08-30"), 0);
  assert.equal(daysUntil("2026-09-29", "2026-08-30"), 30);
});
