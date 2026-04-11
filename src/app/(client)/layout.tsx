import { ProtectedRoute } from "@/components/auth/auth-provider";
import { Sidebar } from "@/components/client/sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["CLIENT"]} redirectTo="/login">
      <div className="flex min-h-screen bg-dark">
        <Sidebar />
        {/* Push content down on mobile for sticky top bar */}
        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
