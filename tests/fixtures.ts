import { prisma } from "@/lib/prisma";
import { signAccessToken, hashPassword } from "@/lib/auth";
import { encrypt } from "@/lib/vault";

/**
 * Two fully seeded workspaces for tenant-isolation tests.
 * Every route must refuse cross-workspace access.
 */
export interface SeededWorkspace {
  workspaceId: string;
  adminId: string;
  adminToken: string;
  clientUserId: string;
  clientUserToken: string;
  clientId: string;
  contactId: string;
  projectId: string;
  milestoneId: string;
  taskId: string;
  impulseId: string;
  impulseCommentId: string;
  noteId: string;
  credentialId: string;
  documentId: string;
  serverId: string;
  leadId: string;
}

export interface TestFixture {
  a: SeededWorkspace;
  b: SeededWorkspace;
}

async function seedWorkspace(label: string): Promise<SeededWorkspace> {
  const ws = await prisma.workspace.create({
    data: { name: `ws-${label}`, slug: `ws-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
  });

  const pwd = await hashPassword("test-password");

  const admin = await prisma.user.create({
    data: {
      workspaceId: ws.id,
      email: `admin-${label}-${Date.now()}@test.local`,
      name: `Admin ${label}`,
      passwordHash: pwd,
      role: "ADMIN",
    },
  });

  const client = await prisma.client.create({
    data: {
      workspaceId: ws.id,
      name: `Client ${label}`,
      slug: `client-${label}-${Date.now()}`,
      stage: "ACTIVE",
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      workspaceId: ws.id,
      email: `clientuser-${label}-${Date.now()}@test.local`,
      name: `Client User ${label}`,
      passwordHash: pwd,
      role: "CLIENT",
      clientId: client.id,
    },
  });

  const contact = await prisma.contactPerson.create({
    data: { workspaceId: ws.id, clientId: client.id, name: `Contact ${label}`, email: `contact-${label}@test.local` },
  });

  const project = await prisma.project.create({
    data: {
      workspaceId: ws.id,
      clientId: client.id,
      name: `Project ${label}`,
      slug: `project-${label}-${Date.now()}`,
      areas: ["General"],
    },
  });

  const milestone = await prisma.milestone.create({
    data: { projectId: project.id, title: `Milestone ${label}` },
  });

  const task = await prisma.task.create({
    data: {
      title: `Task ${label}`,
      projectId: project.id,
      clientId: client.id,
      milestoneId: milestone.id,
    },
  });

  const impulse = await prisma.impulse.create({
    data: {
      projectId: project.id,
      authorId: admin.id,
      type: "IDEA",
      title: `Impulse ${label}`,
      content: "test",
    },
  });

  const impulseComment = await prisma.impulseComment.create({
    data: { impulseId: impulse.id, authorId: admin.id, content: "hi" },
  });

  const note = await prisma.knowledgeEntry.create({
    data: {
      workspaceId: ws.id,
      authorId: admin.id,
      title: `Note ${label}`,
      content: "body",
      category: "OTHER",
    },
  });

  const encSecret = encrypt("secret-value");
  const credential = await prisma.credential.create({
    data: {
      workspaceId: ws.id,
      clientId: client.id,
      label: `Cred ${label}`,
      type: "API_KEY",
      encValue: encSecret.encValue,
      encIv: encSecret.encIv,
      encTag: encSecret.encTag,
      createdById: admin.id,
    },
  });

  const document = await prisma.document.create({
    data: {
      workspaceId: ws.id,
      clientId: client.id,
      name: `doc-${label}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 1024,
      storagePath: `test/doc-${label}`,
      category: "OTHER",
      uploadedById: admin.id,
    },
  });

  const server = await prisma.server.create({
    data: {
      workspaceId: ws.id,
      clientId: client.id,
      name: `Server ${label}`,
      provider: "hetzner",
    },
  });

  const lead = await prisma.lead.create({
    data: {
      workspaceId: ws.id,
      companyName: `Lead ${label}`,
      source: "MANUAL",
    },
  });

  const adminToken = await signAccessToken({ id: admin.id, role: admin.role });
  const clientUserToken = await signAccessToken({
    id: clientUser.id,
    role: clientUser.role,
    clientId: clientUser.clientId,
  });

  return {
    workspaceId: ws.id,
    adminId: admin.id,
    adminToken,
    clientUserId: clientUser.id,
    clientUserToken,
    clientId: client.id,
    contactId: contact.id,
    projectId: project.id,
    milestoneId: milestone.id,
    taskId: task.id,
    impulseId: impulse.id,
    impulseCommentId: impulseComment.id,
    noteId: note.id,
    credentialId: credential.id,
    documentId: document.id,
    serverId: server.id,
    leadId: lead.id,
  };
}

export async function seedTwoWorkspaces(): Promise<TestFixture> {
  const [a, b] = await Promise.all([seedWorkspace("a"), seedWorkspace("b")]);
  return { a, b };
}

export async function cleanupFixture(fx: TestFixture) {
  const wsIds = [fx.a.workspaceId, fx.b.workspaceId];
  // Delete in dependency order. Cascade handles most; we clean explicitly for safety.
  await prisma.taskAssignee.deleteMany({ where: { task: { project: { workspaceId: { in: wsIds } } } } });
  await prisma.impulseComment.deleteMany({ where: { impulse: { project: { workspaceId: { in: wsIds } } } } });
  await prisma.impulse.deleteMany({ where: { project: { workspaceId: { in: wsIds } } } });
  await prisma.task.deleteMany({ where: { project: { workspaceId: { in: wsIds } } } });
  await prisma.milestone.deleteMany({ where: { project: { workspaceId: { in: wsIds } } } });
  await prisma.document.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.credential.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.server.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.knowledgeEntry.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.activity.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.contactPerson.deleteMany({ where: { OR: [{ client: { workspaceId: { in: wsIds } } }, { lead: { workspaceId: { in: wsIds } } }] } });
  await prisma.project.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.lead.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.client.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.refreshToken.deleteMany({ where: { user: { workspaceId: { in: wsIds } } } });
  await prisma.user.deleteMany({ where: { workspaceId: { in: wsIds } } });
  await prisma.workspace.deleteMany({ where: { id: { in: wsIds } } });
}
