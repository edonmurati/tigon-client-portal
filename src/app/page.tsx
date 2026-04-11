"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function RootPage() {
  const { isLoggedIn, role, _authChecked } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_authChecked) return;

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (role === "ADMIN") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, role, _authChecked, router]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C8964A33] border-t-[#C8964A] rounded-full animate-spin" />
    </div>
  );
}
