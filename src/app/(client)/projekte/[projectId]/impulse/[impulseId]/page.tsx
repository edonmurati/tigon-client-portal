import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { ImpulseTypeBadge, ImpulseStatusBadge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { timeAgo, formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ImpulseDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; impulseId: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!user.clientId) redirect("/login");

  const { projectId, impulseId } = await params;

  // Verify project belongs to this client
  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: user.clientId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!project) notFound();

  const impulse = await prisma.impulse.findFirst({
    where: { id: impulseId, projectId, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, role: true } },
      comments: {
        where: { deletedAt: null },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!impulse) notFound();

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/projekte/${project.id}`}
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu {project.name}
        </Link>
      </div>

      {/* Impulse header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start gap-2 mb-3">
          <ImpulseTypeBadge type={impulse.type} />
          <ImpulseStatusBadge status={impulse.status} />
          {impulse.area && (
            <Badge className="bg-dark-300 text-ink-muted">{impulse.area}</Badge>
          )}
        </div>
        <h1 className="font-serif text-3xl text-surface tracking-tightest leading-tight">
          {impulse.title}
        </h1>
        <p className="text-xs text-ink-muted mt-2">
          {formatDate(impulse.createdAt)} &middot; {timeAgo(impulse.createdAt)}
        </p>
      </div>

      {/* Content */}
      <Card className="mb-6">
        <CardBody>
          <p className="text-sm text-surface whitespace-pre-wrap leading-relaxed">
            {impulse.content}
          </p>
        </CardBody>
      </Card>

      {/* Comments */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-ink-muted" />
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Antworten ({impulse.comments.length})
          </h2>
        </div>

        {impulse.comments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-ink-muted">
              Noch keine Antworten. Das Tigon-Team meldet sich in Kürze.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {impulse.comments.map((comment) => {
              const isAdmin = comment.author.role === "ADMIN";
              return (
                <Card key={comment.id}>
                  <CardBody className="py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-surface">
                        {isAdmin ? "Tigon Team" : comment.author.name}
                      </span>
                      {isAdmin && (
                        <Badge className="bg-accent/20 text-accent text-[10px] px-1.5 py-0">
                          Tigon
                        </Badge>
                      )}
                      <span className="text-xs text-ink-muted ml-auto">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-surface/80 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
