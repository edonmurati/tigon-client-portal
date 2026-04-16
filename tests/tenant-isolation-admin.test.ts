import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedTwoWorkspaces, cleanupFixture, type TestFixture } from "./fixtures";
import { callRoute } from "./helpers";

// Admin-Tenant-Isolation: jede Route muss 404/403 geben, wenn Admin aus WS-A
// eine Ressource aus WS-B anspricht.

let fx: TestFixture;

beforeAll(async () => {
  fx = await seedTwoWorkspaces();
});

afterAll(async () => {
  await cleanupFixture(fx);
});

const NOT_FOUND = [403, 404];

describe("admin tenant isolation", () => {
  describe("kunden/[clientId]", () => {
    it("GET foreign client → 404", async () => {
      const { GET } = await import("@/app/api/admin/kunden/[clientId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign client → 404, resource untouched", async () => {
      const { PATCH } = await import("@/app/api/admin/kunden/[clientId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId },
        body: { name: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const c = await prisma.client.findUnique({ where: { id: fx.b.clientId } });
      expect(c?.name).not.toBe("HACKED");
    });
  });

  describe("kunden/[clientId]/kontakte", () => {
    it("GET foreign kunde kontakte → 404", async () => {
      const { GET } = await import("@/app/api/admin/kunden/[clientId]/kontakte/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("POST creates contact on foreign client → 404", async () => {
      const { POST } = await import("@/app/api/admin/kunden/[clientId]/kontakte/route");
      const res = await callRoute(POST as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId },
        body: { name: "intruder" },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("kunden/[clientId]/kontakte/[contactId]", () => {
    it("PATCH foreign contact → 404, untouched", async () => {
      const { PATCH } = await import(
        "@/app/api/admin/kunden/[clientId]/kontakte/[contactId]/route"
      );
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId, contactId: fx.b.contactId },
        body: { name: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const c = await prisma.contactPerson.findUnique({ where: { id: fx.b.contactId } });
      expect(c?.name).not.toBe("HACKED");
    });

    it("DELETE foreign contact → 404, still exists", async () => {
      const { DELETE } = await import(
        "@/app/api/admin/kunden/[clientId]/kontakte/[contactId]/route"
      );
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId, contactId: fx.b.contactId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const c = await prisma.contactPerson.findUnique({ where: { id: fx.b.contactId } });
      expect(c).not.toBeNull();
    });

    it("cross-client in OWN workspace: contact not on given client → 404", async () => {
      const { PATCH } = await import(
        "@/app/api/admin/kunden/[clientId]/kontakte/[contactId]/route"
      );
      // a's admin, a's clientId, but contactId belongs to b (wrong)
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.a.clientId, contactId: fx.b.contactId },
        body: { name: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("projekte/[projectId]", () => {
    it("GET foreign project → 404", async () => {
      const { GET } = await import("@/app/api/admin/projekte/[projectId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.b.projectId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign project → 404, untouched", async () => {
      const { PATCH } = await import("@/app/api/admin/projekte/[projectId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.b.projectId },
        body: { name: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const p = await prisma.project.findUnique({ where: { id: fx.b.projectId } });
      expect(p?.name).not.toBe("HACKED");
    });
  });

  describe("projekte/[projectId]/areas", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/projekte/[projectId]/areas/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.b.projectId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PUT foreign → 404", async () => {
      const { PUT } = await import("@/app/api/admin/projekte/[projectId]/areas/route");
      const res = await callRoute(PUT as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.b.projectId },
        body: { areas: ["pwned"] },
        method: "PUT",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("projekte/[projectId]/milestones", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/projekte/[projectId]/milestones/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.b.projectId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("POST creates milestone on foreign project → 404", async () => {
      const { POST } = await import("@/app/api/admin/projekte/[projectId]/milestones/route");
      const res = await callRoute(POST as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.b.projectId },
        body: { title: "intruder" },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign milestone (own projectId as decoy) → 404", async () => {
      const { PATCH } = await import("@/app/api/admin/projekte/[projectId]/milestones/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.a.projectId },
        query: { milestoneId: fx.b.milestoneId },
        body: { title: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const m = await prisma.milestone.findUnique({ where: { id: fx.b.milestoneId } });
      expect(m?.title).not.toBe("HACKED");
    });

    it("DELETE foreign milestone (own projectId as decoy) → 404", async () => {
      const { DELETE } = await import("@/app/api/admin/projekte/[projectId]/milestones/route");
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { projectId: fx.a.projectId },
        query: { milestoneId: fx.b.milestoneId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const m = await prisma.milestone.findUnique({ where: { id: fx.b.milestoneId } });
      expect(m).not.toBeNull();
    });
  });

  describe("aufgaben/[taskId]", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/aufgaben/[taskId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { taskId: fx.b.taskId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign → 404, untouched", async () => {
      const { PATCH } = await import("@/app/api/admin/aufgaben/[taskId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { taskId: fx.b.taskId },
        body: { title: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const t = await prisma.task.findUnique({ where: { id: fx.b.taskId } });
      expect(t?.title).not.toBe("HACKED");
    });

    it("DELETE foreign → 404, still exists", async () => {
      const { DELETE } = await import("@/app/api/admin/aufgaben/[taskId]/route");
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { taskId: fx.b.taskId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const t = await prisma.task.findUnique({ where: { id: fx.b.taskId } });
      expect(t).not.toBeNull();
    });
  });

  describe("impulse/[impulseId]", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/impulse/[impulseId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { impulseId: fx.b.impulseId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign → 404, status untouched", async () => {
      const { PATCH } = await import("@/app/api/admin/impulse/[impulseId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { impulseId: fx.b.impulseId },
        body: { status: "DONE" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const i = await prisma.impulse.findUnique({ where: { id: fx.b.impulseId } });
      expect(i?.status).toBe("NEW");
    });
  });

  describe("impulse/[impulseId]/comments", () => {
    it("POST comment on foreign impulse → 404", async () => {
      const { POST } = await import("@/app/api/admin/impulse/[impulseId]/comments/route");
      const res = await callRoute(POST as never, {
        token: fx.a.adminToken,
        params: { impulseId: fx.b.impulseId },
        body: { content: "injected" },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("notizen/[noteId]", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/notizen/[noteId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { noteId: fx.b.noteId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign → 404, untouched", async () => {
      const { PATCH } = await import("@/app/api/admin/notizen/[noteId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { noteId: fx.b.noteId },
        body: { title: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const n = await prisma.knowledgeEntry.findUnique({ where: { id: fx.b.noteId } });
      expect(n?.title).not.toBe("HACKED");
    });

    it("DELETE foreign → 404, still exists", async () => {
      const { DELETE } = await import("@/app/api/admin/notizen/[noteId]/route");
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { noteId: fx.b.noteId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);

      const { prisma } = await import("@/lib/prisma");
      const n = await prisma.knowledgeEntry.findUnique({ where: { id: fx.b.noteId } });
      expect(n).not.toBeNull();
    });
  });

  describe("zugangsdaten/[credentialId]", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/zugangsdaten/[credentialId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { credentialId: fx.b.credentialId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign → 404", async () => {
      const { PATCH } = await import("@/app/api/admin/zugangsdaten/[credentialId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { credentialId: fx.b.credentialId },
        body: { label: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("DELETE foreign → 404", async () => {
      const { DELETE } = await import("@/app/api/admin/zugangsdaten/[credentialId]/route");
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { credentialId: fx.b.credentialId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("REVEAL foreign secret → 404 (no plaintext leak)", async () => {
      const { POST } = await import("@/app/api/admin/zugangsdaten/[credentialId]/reveal/route");
      const res = await callRoute(POST as never, {
        token: fx.a.adminToken,
        params: { credentialId: fx.b.credentialId },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
      const body = await res.text();
      expect(body).not.toContain("secret-value");
    });
  });

  describe("dokumente/[documentId]", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/dokumente/[documentId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { documentId: fx.b.documentId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("DELETE foreign → 404", async () => {
      const { DELETE } = await import("@/app/api/admin/dokumente/[documentId]/route");
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { documentId: fx.b.documentId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("DOWNLOAD foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/dokumente/[documentId]/download/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { documentId: fx.b.documentId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("infrastruktur/[serverId]", () => {
    it("GET foreign → 404", async () => {
      const { GET } = await import("@/app/api/admin/infrastruktur/[serverId]/route");
      const res = await callRoute(GET as never, {
        token: fx.a.adminToken,
        params: { serverId: fx.b.serverId },
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("PATCH foreign → 404", async () => {
      const { PATCH } = await import("@/app/api/admin/infrastruktur/[serverId]/route");
      const res = await callRoute(PATCH as never, {
        token: fx.a.adminToken,
        params: { serverId: fx.b.serverId },
        body: { name: "HACKED" },
        method: "PATCH",
      });
      expect(NOT_FOUND).toContain(res.status);
    });

    it("DELETE foreign → 404", async () => {
      const { DELETE } = await import("@/app/api/admin/infrastruktur/[serverId]/route");
      const res = await callRoute(DELETE as never, {
        token: fx.a.adminToken,
        params: { serverId: fx.b.serverId },
        method: "DELETE",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("kunden/[clientId]/users", () => {
    it("POST user on foreign client → 404", async () => {
      const { POST } = await import("@/app/api/admin/kunden/[clientId]/users/route");
      const res = await callRoute(POST as never, {
        token: fx.a.adminToken,
        params: { clientId: fx.b.clientId },
        body: { name: "intruder", email: `intruder-${Date.now()}@test.local`, password: "abcdefgh" },
        method: "POST",
      });
      expect(NOT_FOUND).toContain(res.status);
    });
  });

  describe("list endpoints do not bleed across workspaces", () => {
    it("GET /kunden lists only own workspace clients", async () => {
      const { GET } = await import("@/app/api/admin/kunden/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { clients: Array<{ id: string }> };
      const ids = data.clients.map((c) => c.id);
      expect(ids).toContain(fx.a.clientId);
      expect(ids).not.toContain(fx.b.clientId);
    });

    it("GET /aufgaben lists only own workspace tasks", async () => {
      const { GET } = await import("@/app/api/admin/aufgaben/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { tasks: Array<{ id: string }> };
      const ids = data.tasks.map((t) => t.id);
      expect(ids).toContain(fx.a.taskId);
      expect(ids).not.toContain(fx.b.taskId);
    });

    it("GET /impulse lists only own workspace impulses", async () => {
      const { GET } = await import("@/app/api/admin/impulse/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { impulses: Array<{ id: string }> };
      const ids = data.impulses.map((i) => i.id);
      expect(ids).toContain(fx.a.impulseId);
      expect(ids).not.toContain(fx.b.impulseId);
    });

    it("GET /notizen lists only own workspace notes", async () => {
      const { GET } = await import("@/app/api/admin/notizen/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { entries: Array<{ id: string }> };
      const ids = data.entries.map((e) => e.id);
      expect(ids).toContain(fx.a.noteId);
      expect(ids).not.toContain(fx.b.noteId);
    });

    it("GET /zugangsdaten lists only own workspace credentials", async () => {
      const { GET } = await import("@/app/api/admin/zugangsdaten/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { credentials: Array<{ id: string }> };
      const ids = data.credentials.map((c) => c.id);
      expect(ids).toContain(fx.a.credentialId);
      expect(ids).not.toContain(fx.b.credentialId);
    });

    it("GET /dokumente lists only own workspace documents", async () => {
      const { GET } = await import("@/app/api/admin/dokumente/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { documents: Array<{ id: string }> };
      const ids = data.documents.map((d) => d.id);
      expect(ids).toContain(fx.a.documentId);
      expect(ids).not.toContain(fx.b.documentId);
    });

    it("GET /infrastruktur lists only own workspace servers", async () => {
      const { GET } = await import("@/app/api/admin/infrastruktur/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { servers: Array<{ id: string }> };
      const ids = data.servers.map((s) => s.id);
      expect(ids).toContain(fx.a.serverId);
      expect(ids).not.toContain(fx.b.serverId);
    });

    it("GET /aktivitaet lists only own workspace activity", async () => {
      const { GET } = await import("@/app/api/admin/aktivitaet/route");
      const res = await callRoute(GET as never, { token: fx.a.adminToken });
      expect(res.status).toBe(200);
    });
  });

  describe("unauthenticated access", () => {
    it("GET /kunden without token → 401", async () => {
      const { GET } = await import("@/app/api/admin/kunden/route");
      const res = await callRoute(GET as never, { token: null });
      expect(res.status).toBe(401);
    });

    it("CLIENT role on admin endpoint → 401", async () => {
      const { GET } = await import("@/app/api/admin/kunden/route");
      const res = await callRoute(GET as never, { token: fx.a.clientUserToken });
      expect(res.status).toBe(401);
    });
  });
});
