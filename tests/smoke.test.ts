import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedTwoWorkspaces, cleanupFixture, type TestFixture } from "./fixtures";

let fx: TestFixture;

beforeAll(async () => {
  fx = await seedTwoWorkspaces();
});

afterAll(async () => {
  await cleanupFixture(fx);
});

describe("fixtures", () => {
  it("seeds two separate workspaces", () => {
    expect(fx.a.workspaceId).not.toBe(fx.b.workspaceId);
    expect(fx.a.adminToken).toBeTruthy();
    expect(fx.b.adminToken).toBeTruthy();
  });
});
