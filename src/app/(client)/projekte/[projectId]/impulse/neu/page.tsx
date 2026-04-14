"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardBody } from "@/components/ui/card";

const typeOptions = [
  { value: "FEEDBACK", label: "Feedback" },
  { value: "CHANGE_REQUEST", label: "Änderungswunsch" },
  { value: "QUESTION", label: "Frage" },
  { value: "IDEA", label: "Idee" },
];

export default function NewImpulsePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [areas, setAreas] = useState<string[]>([]);
  const [projectName, setProjectName] = useState<string>("");

  const [type, setType] = useState("FEEDBACK");
  const [area, setArea] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ projectId: pid }) => {
      setProjectId(pid);
      // Fetch project areas
      fetch(`/api/client/projekte/${pid}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.project) {
            setAreas(data.project.areas ?? []);
            setProjectName(data.project.name ?? "");
          }
        })
        .catch(() => {});
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Bitte geben Sie einen Titel ein.");
      return;
    }
    if (!content.trim()) {
      setError("Bitte beschreiben Sie Ihren Impuls.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/client/projekte/${projectId}/impulse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type,
            title: title.trim(),
            content: content.trim(),
            area: area || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fehler beim Erstellen des Impulses.");
        return;
      }

      router.replace(`/projekte/${projectId}/impulse/${data.impulse.id}`);
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  const areaOptions = [
    { value: "", label: "Kein Bereich" },
    ...areas.map((a) => ({ value: a, label: a })),
  ];

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <div className="mb-6">
        {projectId && (
          <Link
            href={`/projekte/${projectId}`}
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {projectName ? `Zurück zu ${projectName}` : "Zurück zum Projekt"}
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Neuer Impuls
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Teilen Sie Feedback, Fragen oder Ideen mit Ihrem Tigon-Team.
        </p>
      </div>

      <Card>
        <CardBody className="py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Typ"
              options={typeOptions}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />

            {areas.length > 0 && (
              <Select
                label="Bereich (optional)"
                options={areaOptions}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            )}

            <Input
              label="Titel"
              placeholder="Kurze Zusammenfassung Ihres Impulses"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Textarea
              label="Beschreibung"
              placeholder="Beschreiben Sie Ihren Impuls so detailliert wie möglich…"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" loading={loading} size="lg">
                Impuls senden
              </Button>
              {projectId && (
                <Link href={`/projekte/${projectId}`}>
                  <Button type="button" variant="ghost" size="lg">
                    Abbrechen
                  </Button>
                </Link>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
