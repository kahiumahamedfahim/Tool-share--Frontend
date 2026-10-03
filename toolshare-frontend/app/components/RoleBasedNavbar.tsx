"use client";

import { useEffect, useState } from "react";

import AdminNavbar from "@/app/components/admin/AdminNavbar";
import ModeratorNavbar from "@/app/components/moderator/ModeratorNavbar";

export default function RoleBasedNavbar() {
  const [userRole, setUserRole] = useState<
    "ADMIN" | "MODERATOR" | null
  >(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (role === "ADMIN" || role === "MODERATOR") {
      setUserRole(role);
    }
  }, []);

  if (userRole === "ADMIN") {
    return <AdminNavbar />;
  }

  if (userRole === "MODERATOR") {
    return <ModeratorNavbar />;
  }

  return null;
}