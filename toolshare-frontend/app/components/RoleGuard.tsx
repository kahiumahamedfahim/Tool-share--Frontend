"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  useEffect(() => {
    const userRole =
      localStorage.getItem("userRole");

    if (!userRole) {
      router.replace("/not-found");
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      router.replace("/not-found");
      return;
    }

    setAuthorized(true);
  }, [allowedRoles, router]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}