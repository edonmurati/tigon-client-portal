import { ProtectedRoute } from "@/components/auth/auth-provider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["CLIENT"]} redirectTo="/login">
      <div className="min-h-screen bg-[#08090E] text-[#FAFAF8]">
        {children}
      </div>
    </ProtectedRoute>
  );
}
