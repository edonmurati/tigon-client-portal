import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedTwoWorkspaces, cleanupFixture, type TestFixture } from "./fixtures";
import { callRoute } from "./helpers";

// Client-Role Isolation: a CLIENT user must only see their own client's data,
// and never data from another workspace or another client in the same workspace.

let fx: TestFixture;
let sameWsOtherClientProjectId: string;

beforeAll(async () => {
  fx = await seedTwoWorkspaces();
  // Add a second client + project inside workspace A, so we can verify that
  // the CLIENT user of client-A cannot read project of another client in the same WS.
  const { prisma } = await import("@/lib/prisma");
  const otherClient = await prisma.client.create({
    data: {
      workspaceId: fx.a.workspaceId,
      name: "Other Client in WS A",
      slug: `other-client-a-${Date.now()}`,
      stage: "ACTIVE",
    },
  });
  const otherProject = await prisma.project.create({
    data: {
      workspaceId: fx.a.workspaceId,
      clientId: otherClient.id,
      name: "Other Project in WS A",
      slug: `other-project-a-${Date.now()}`,
    },
  });
  sameWsOtherClientProjectId = otherProject.id;
});

afterAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.project.deleteMany({ where: { id: sameWsOtherClientProjectId } });
  await prisma.client.deleteMany({
    where: { workspaceId: fx.a.workspaceId, slug: { startsWith: "other-client-a-" } },
  });
  await cleanupFixture(fx);
});

const NOT_FOUND = [403, 404];

describe("client tenant isolation", () => {
  describe("projekte/[projectId]", () => {
    it("CLIENT-A reads own project → 200", async () => {
      const { GET } = await import("@/app/api/client/projekte/[projectId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.clientUserToken,
        params: { projectId: fx.a.projectId },
      });
      expect(res.status).toBe(200);
    });

    it("CLIENT-A reads project from WS-B → 404", async () => {
      const { GET } = await import("@/app/api/client/projekte/[projectId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.clientUserToken,
        params: { projectId: fx.b.projectId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("CLIENT-A reads project of OTHER client in same WS → 404", async () => {
      const { GET } = await import("@/app/api/client/projekte/[projectId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.clientUserToken,
        params: { projectId: sameWsOtherClientProjectId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("ADMIN token on client endpoint → 401", async () => {
      const { GET } = await import("@/app/api/client/projekte/[projectId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.a.projectId },
      });
      expect(res.status).toBe(401);
    });
  });

  describe("projekte/[projectId]/impulse", () => {
    it("CLIENT-A GET impulse list of foreign WS project → 404", async () => {
      const { GET } = await import("@/app/api/client/projekte/[projectId]/impulse/route");
      const res = await callRoute(GET as never, {
        token: fx.a.clientUserToken,
        params: { projectId: fx.b.projectId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("CLIENT-A POST impulse into foreign WS project → 404", async () => {
      const { POST } = await import("@/app/api/client/projekte/[projectId]/impulse/route");
      const res = await callRoute(POST as never, {
        token: fx.a.clientUserToken,
        params: { projectId: fx.b.projectId },
        body: { type: "IDEA", title: "injected", content: "test" },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("CLIENT-A POST impulse into same-WS other client's project → 404", async () => {
      const { POST } = await import("@/app/api/client/projekte/[projectId]/impulse/route");
      const res = await callRoute(POST as never, {
        token: fx.a.clientUserToken,
        params: { projectId: sameWsOtherClientProjectId },
        body: { type: "IDEA", title: "injected", content: "test" },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("projekte/[projectId]/impulse/[impulseId]", () => {
    it("CLIENT-A GET foreign WS impulse → 404", async () => {
      const { GET } = await import(
        "@/app/api/client/projekte/[projectId]/impulse/[impulseId]/route"
      );
      const res = await callRoute(GET as never, {
        token: fx.a.clientUserToken,
        params: { projectId: fx.a.projectId, impulseId: fx.b.impulseId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("dashboard", () => {
    it("CLIENT-A dashboard shows only own client data", async () => {
      const { GET } = await import("@/app/api/client/dashboard/route");
      const res = await callRoute(GET as never, {
        token: fx.a.clientUserToken,
      });
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).not.toContain(fx.b.clientId);
      expect(body).not.toContain(fx.b.projectId);
    });

    it("CLIENT-A dashboard ≠ CLIENT-B dashboard", async () => {
      const { GET } = await import("@/app/api/client/dashboard/route");
      const resA = await callRoute(GET as never, { token: fx.a.clientUserToken });
      const resB = await callRoute(GET as never, { token: fx.b.clientUserToken });
      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      const bodyA = await resA.text();
      const bodyB = await resB.text();
      expect(bodyA).not.toEqual(bodyB);
      expect(bodyA).not.toContain(fx.b.projectId);
      expect(bodyB).not.toContain(fx.a.projectId);
    });
  });

  describe("unauthenticated", () => {
    it("dashboard without token → 401", async () => {
      const { GET } = await import("@/app/api/client/dashboard/route");
      const res = await callRoute(GET as never, { token: null });
      expect(res.status).toBe(401);
    });

    it("project view without token → 401", async () => {
      const { GET } = await import("@/app/api/client/projekte/[projectId]/route");
      const res = await callRoute(GET as never, {
        token: null,
        params: { projectId: fx.a.projectId },
      });
      expect(res.status).toBe(401);
    });
  });
});
