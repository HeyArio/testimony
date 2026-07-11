"use client";

import { useRouter } from "next/navigation";
import { fa } from "@/i18n/fa";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm font-bold text-primary hover:text-primary-dark"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      type="button"
    >
      {fa.auth.logout}
    </button>
  );
}
