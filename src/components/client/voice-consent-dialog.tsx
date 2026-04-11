"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VoiceConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function VoiceConsentDialog({
  open,
  onAccept,
  onDecline,
}: VoiceConsentDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-sm px-4">
      <Card className="w-full max-w-sm">
        <CardBody className="pt-5">
          <h2 className="text-base font-semibold text-surface font-serif mb-3">
            Spracherkennung aktivieren
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-6">
            Die Spracherkennung nutzt einen Cloud-Dienst zur Verarbeitung. Ihre
            Spracheingabe wird zur Transkription an einen externen Server
            übertragen.
          </p>
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              className="flex-1 min-h-[44px]"
              onClick={onAccept}
            >
              Akzeptieren
            </Button>
            <Button
              variant="ghost"
              size="md"
              className="flex-1 min-h-[44px]"
              onClick={onDecline}
            >
              Ablehnen
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
