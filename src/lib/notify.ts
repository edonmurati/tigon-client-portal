const N8N_BASE = process.env.N8N_WEBHOOK_BASE;

export async function notifyImpulseCreated(data: {
  impulseId: string;
  impulseTitle: string;
  impulseType: string;
  clientName: string;
  projectName: string;
  authorName: string;
}) {
  if (!N8N_BASE) return;
  fetch(`${N8N_BASE}/portal-impulse-created`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.tigonautomation.de"}/admin/impulse/${data.impulseId}`,
    }),
  }).catch(() => {}); // fire and forget
}

export async function notifyImpulseResponse(data: {
  impulseId: string;
  impulseTitle: string;
  clientName: string;
  clientEmail: string;
  responsePreview: string;
}) {
  if (!N8N_BASE) return;
  fetch(`${N8N_BASE}/portal-impulse-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://portal.tigonautomation.de"}/projekte/${data.impulseId}`,
    }),
  }).catch(() => {});
}
