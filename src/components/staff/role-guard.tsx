"use client";

import { useTranslate } from "@/components/providers/language-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_HOME, getAppRole, type AppRole } from "@/lib/app-role";

/** Client-side belt-and-suspenders with proxy role isolation. */
export function RoleGuard({
  allow,
  children,
}: {
  allow: AppRole;
  children: React.ReactNode;
}) {
  const translateUI = useTranslate();
  const router = useRouter();
  const role = getAppRole();

  const permitted = role === allow || (role === "student" && allow === "class_rep");

  useEffect(() => {
    if (!permitted) {
      router.replace(APP_HOME[role]);
    }
  }, [permitted, role, router]);

  if (!permitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="surface max-w-sm rounded-2xl p-6 text-center">
          <p className="font-heading text-[15px] font-semibold">{translateUI("Access denied")}</p>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {translateUI("This app is locked to the ")}{translateUI(allow.replace("_", " "))} {translateUI(" workspace.")}</p>
        </div>
      </div>
    );
  }

  return <>{translateUI(children)}</>;
}
