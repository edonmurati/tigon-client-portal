"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteCredentialButtonProps {
  credentialId: string;
  label: string;
}

export function DeleteCredentialButton({ credentialId, label }: DeleteCredentialButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${label}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/zugangsdaten/${credentialId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/admin/zugangsdaten");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" loading={loading} onClick={handleDelete}>
      <Trash2 size={13} />
      Löschen
    </Button>
  );
}
